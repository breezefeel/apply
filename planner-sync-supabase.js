/* 플래너 항목 동기화. GAS 동기화 쓰기는 호출하지 않습니다. */
var PlannerSyncSupabase = (function(){
  var SEQ_KEY = 'ht_planner_supa_seq';
  var FULL_KEY = 'ht_planner_supa_full';
  var FULL_GEN = '2';
  var clientPromise = null;
  var cachedEmail = '';
  var activeAbort = null;
  var CAPS = {
    protocolVersion: 2,
    entitySchemaVersion: 3,
    patch: true,
    entityRevision: true,
    tombstones: true,
    partialAck: true
  };

  function configured(){
    return !!(typeof PLANNER_SUPABASE_URL === 'string' && PLANNER_SUPABASE_URL &&
      typeof PLANNER_SUPABASE_ANON_KEY === 'string' && PLANNER_SUPABASE_ANON_KEY);
  }

  function loadLibrary(){
    if(window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('Supabase 라이브러리를 불러오지 못했습니다.')); };
      document.head.appendChild(s);
    });
  }

  function abortActive(){
    if(!activeAbort) return;
    try { activeAbort.abort(); } catch(e){}
    activeAbort = null;
  }
  function syncFetch(url, opts){
    opts = Object.assign({}, opts || {});
    if(activeAbort){
      if(!opts.signal) opts.signal = activeAbort.signal;
      else if(typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function'){
        opts.signal = AbortSignal.any([opts.signal, activeAbort.signal]);
      }
    }
    return fetch(url, opts);
  }
  function getClient(){
    if(!configured()) return Promise.reject(new Error('planner-sync-config.js에 Supabase 주소와 공개 키를 넣어 주세요.'));
    if(!clientPromise){
      clientPromise = loadLibrary().then(function(){
        return window.supabase.createClient(PLANNER_SUPABASE_URL, PLANNER_SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true },
          global: { fetch: syncFetch }
        });
      });
    }
    return clientPromise;
  }

  function readSeq(){
    try { return parseInt(localStorage.getItem(SEQ_KEY) || '0', 10) || 0; } catch(e){ return 0; }
  }
  function writeSeq(n){
    n = parseInt(n, 10) || 0;
    if(n < readSeq()) return;
    try { localStorage.setItem(SEQ_KEY, String(n)); } catch(e){}
  }

  function sessionClient(){
    return getClient().then(function(client){
      return client.auth.getSession().then(function(res){
        var session = res && res.data && res.data.session;
        cachedEmail = session && session.user && session.user.email ? session.user.email : '';
        if(!session){
          var err = new Error('팀 로그인이 필요합니다. 동기화 창에서 로그인해 주세요.');
          err.authRequired = true;
          throw err;
        }
        return client;
      });
    });
  }

  function shapeError(err){
    var auth = !!(err && err.authRequired);
    var aborted = !!(err && (err.name === 'AbortError' || /aborted|abort/i.test(String(err.message || ''))));
    return {
      result: 'error',
      message: aborted
        ? '서버 응답이 조금 오래 걸려요. 자동으로 다시 시도합니다.'
        : ((err && err.message) || 'Supabase 동기화에 실패했습니다.'),
      retry: aborted,
      authRequired: auth
    };
  }

  function pull(client){
    var replay = false;
    try { replay = localStorage.getItem(FULL_KEY) !== FULL_GEN; } catch(eFull){ replay = true; }
    if(replay){
      try { localStorage.setItem(SEQ_KEY, '0'); } catch(eReset){}
    }
    var since = readSeq();
    var rows = [];
    var from = 0;
    var page = 200;
    function next(){
      return client.from('planner_entities')
        .select('key,value,revision,deleted,updated_at,change_seq')
        .gt('change_seq', since)
        .order('change_seq', { ascending: true })
        .range(from, from + page - 1)
        .then(function(res){
          if(res.error) throw new Error(res.error.message || '항목을 읽지 못했습니다.');
          var chunk = res.data || [];
          rows = rows.concat(chunk);
          if(chunk.length < page) return rows;
          from += page;
          return next();
        });
    }
    function loadPrefixIndex(prefix){
      var index = [];
      var indexFrom = 0;
      function nextIndex(){
        return client.from('planner_entities')
          .select('key,revision,deleted,updated_at,change_seq')
          .like('key', prefix + '%')
          .order('key', { ascending: true })
          .range(indexFrom, indexFrom + page - 1)
          .then(function(res){
            if(res.error) throw new Error(res.error.message || '주제와 초안 목록을 읽지 못했습니다.');
            var chunk = res.data || [];
            index = index.concat(chunk);
            if(chunk.length < page) return index;
            indexFrom += page;
            return nextIndex();
          });
      }
      return nextIndex();
    }
    function loadPrefixRows(prefix){
      var loaded = [];
      var rowFrom = 0;
      function nextRows(){
        return client.from('planner_entities')
          .select('key,value,revision,deleted,updated_at,change_seq')
          .like('key', prefix + '%')
          .order('key', { ascending: true })
          .range(rowFrom, rowFrom + page - 1)
          .then(function(res){
            if(res.error) throw new Error(res.error.message || '서버 항목을 읽지 못했습니다.');
            var chunk = res.data || [];
            loaded = loaded.concat(chunk);
            if(chunk.length < page) return loaded;
            rowFrom += page;
            return nextRows();
          });
      }
      return nextRows();
    }
    function loadSurfaceRows(){
      var prefixes = ['draft:', 'generated:', 'published:', 'plan:', 'prompt:', 'branding:', 'milestone:', 'pinned:', 'override:', 'deleted:', 'ops:'];
      var acc = [];
      var pi = 0;
      function nextPrefix(){
        if(pi >= prefixes.length){
          return client.from('planner_entities')
            .select('key,value,revision,deleted,updated_at,change_seq')
            .eq('key', 'setting:surfaceDigest')
            .then(function(res){
              if(res.error) throw new Error(res.error.message || '비교 기록을 읽지 못했습니다.');
              return acc.concat(res.data || []);
            });
        }
        var prefix = prefixes[pi++];
        return loadPrefixRows(prefix).then(function(chunk){
          acc = acc.concat(chunk || []);
          return nextPrefix();
        });
      }
      return nextPrefix();
    }
    function loadDraftIndex(){
      return loadPrefixIndex('draft:').then(function(drafts){
        return loadPrefixIndex('generated:').then(function(generated){
          return loadPrefixIndex('published:').then(function(published){
            return loadPrefixIndex('plan:subgoal:').then(function(plans){
              return client.from('planner_entities')
                .select('key,value,revision,deleted,updated_at,change_seq')
                .eq('key', 'setting:surfaceDigest')
                .then(function(res){
                  var digestRows = (res && res.data) || [];
                  return drafts.concat(generated).concat(published).concat(plans).concat(digestRows);
                });
            });
          });
        });
      });
    }
    function loadDraftRows(keys){
      var extra = [];
      var i = 0;
      function nextKeys(){
        if(i >= keys.length) return Promise.resolve(extra);
        var batch = keys.slice(i, i + 8);
        i += 8;
        return client.from('planner_entities')
          .select('key,value,revision,deleted,updated_at,change_seq')
          .in('key', batch)
          .then(function(res){
            if(res.error) throw new Error(res.error.message || '빠진 주제를 읽지 못했습니다.');
            extra = extra.concat(res.data || []);
            return nextKeys();
          });
      }
      return nextKeys();
    }
    function finishPull(index){
      var emptyTable = since === 0 && !rows.length && !(index && index.length);
      var applied = { conflicts: [] };
      if(typeof applySupabaseEntityRows_ === 'function'){
        applied = applySupabaseEntityRows_(rows) || applied;
      }
      if(typeof state !== 'undefined' && state._topicGapForceServer && typeof dropSurfaceKeysAbsentOnServer_ === 'function'){
        try { dropSurfaceKeysAbsentOnServer_(index); } catch(eDrop){}
      }
      var topicGap = false;
      if(typeof finishTopicListCheck_ === 'function'){
        topicGap = !!finishTopicListCheck_(index);
      }
      var maxSeq = since;
      rows.forEach(function(row){
        var seq = parseInt(row.change_seq, 10) || 0;
        if(seq > maxSeq) maxSeq = seq;
      });
      (index || []).forEach(function(row){
        var seq = parseInt(row.change_seq, 10) || 0;
        if(seq > maxSeq) maxSeq = seq;
      });
      writeSeq(maxSeq);
      if(replay && applied && applied.appliedGeneration === 2){
        try { localStorage.setItem(FULL_KEY, FULL_GEN); } catch(eMark){}
      }
      return {
        result: 'success',
        supabaseApplied: true,
        emptyTable: emptyTable,
        topicGap: topicGap,
        serverRevision: maxSeq,
        savedAt: new Date().toISOString(),
        payload: null,
        conflicts: applied.conflicts || [],
        syncCapabilities: CAPS
      };
    }
    if(typeof state !== 'undefined' && state._topicGapForceKeys && state._topicGapReceiveKeys && state._topicGapReceiveKeys.length && !state._topicGapForceServer && !state._topicGapAdoptServer){
      var want = state._topicGapReceiveKeys.slice();
      return loadDraftRows(want).then(function(extra){
        rows = extra || [];
        return finishPull(rows);
      });
    }
    if(typeof state !== 'undefined' && (state._topicGapForceServer || state._topicGapAdoptServer)){
      return loadSurfaceRows().then(function(surfaceRows){
        var seen = {};
        rows = [];
        (surfaceRows || []).forEach(function(row){
          if(!row || !row.key || seen[row.key]) return;
          seen[row.key] = true;
          rows.push(row);
        });
        return finishPull(rows);
      });
    }
    return next().then(function(){
      return loadDraftIndex();
    }).then(function(index){
      var have = {};
      rows.forEach(function(row){ if(row && row.key) have[row.key] = true; });
      var need = [];
      (index || []).forEach(function(row){
        if(!row || !row.key || have[row.key]) return;
        var key = String(row.key);
        var localHas = (typeof localHasSyncedContentKey_ === 'function') ? localHasSyncedContentKey_(key) : false;
        if(row.deleted){
          if(localHas) need.push(key);
          return;
        }
        if(!localHas) need.push(key);
      });
      return loadDraftRows(need).then(function(extra){
        rows = rows.concat(extra || []);
        return index;
      });
    }).then(function(index){
      return finishPull(index);
    });
  }

  function patch(client, mutations){
    var body = (mutations || []).map(function(mut){
      return {
        key: mut.key,
        value: mut.deleted ? null : mut.value,
        deleted: !!mut.deleted,
        baseEntityRevision: parseInt(mut.baseEntityRevision, 10) || 0,
        mutationId: mut.mutationId || ''
      };
    });
    return client.rpc('planner_apply_batch', { p_rows: body }).then(function(res){
      if(res.error) throw new Error(res.error.message || '항목을 저장하지 못했습니다.');
      var data = res.data || {};
      if(data.result === 'error'){
        return { result: 'error', message: data.message || '저장 실패', retry: false };
      }
      var accepted = (data.accepted || []).map(function(item){
        return {
          mutationId: item.mutationId || '',
          key: item.key,
          entityRevision: parseInt(item.revision, 10) || 0,
          version: 1
        };
      });
      var conflicts = (data.conflicts || []).map(function(item){
        return {
          key: item.key,
          mutationId: item.mutationId || '',
          version: 1,
          serverValue: item.value,
          serverDeleted: !!item.deleted,
          serverEntityRevision: parseInt(item.revision, 10) || 0,
          serverUpdatedAt: item.updatedAt || ''
        };
      });
      if(typeof noteSupabaseAcceptedRevisions_ === 'function'){
        noteSupabaseAcceptedRevisions_(accepted);
      }
      var result = conflicts.length ? (accepted.length ? 'partial' : 'conflict') : 'success';
      return {
        result: result,
        supabaseApplied: true,
        serverRevision: parseInt(data.changeSeq, 10) || 0,
        savedAt: new Date().toISOString(),
        payload: null,
        accepted: accepted,
        conflicts: conflicts,
        syncCapabilities: CAPS
      };
    });
  }

  function importRows(rows){
    return sessionClient().then(function(client){
      var chunks = [];
      var i;
      for(i = 0; i < rows.length; i += 20) chunks.push(rows.slice(i, i + 20));
      var seq = 0;
      var chain = Promise.resolve();
      var started = false;
      chunks.forEach(function(chunk){
        chain = chain.then(function(){
          var cont = started;
          started = true;
          return client.rpc('planner_import_batch', { p_rows: chunk, p_continue: cont }).then(function(res){
            if(res.error) throw new Error(res.error.message || '넣기 실패');
            var data = res.data || {};
            if(data.result === 'error') throw new Error(data.message || '넣기 실패');
            seq = parseInt(data.changeSeq, 10) || seq;
          });
        });
      });
      return chain.then(function(){
        writeSeq(seq);
        return { ok: true, changeSeq: seq };
      });
    });
  }

  function signIn(email, password){
    return getClient().then(function(client){
      return client.auth.signInWithPassword({ email: email, password: password }).then(function(res){
        if(res.error) throw new Error(res.error.message || '로그인 실패');
        cachedEmail = email;
        return { ok: true, email: email };
      });
    });
  }

  function handle(request){
    if(!configured()){
      return Promise.resolve({
        result: 'error',
        retry: false,
        message: 'planner-sync-config.js에 Supabase 주소와 공개 키를 넣어 주세요.'
      });
    }
    var action = request && request.action;
    abortActive();
    activeAbort = typeof AbortController !== 'undefined' ? new AbortController() : null;
    return sessionClient().then(function(client){
      if(action === 'plannerSyncPull') return pull(client);
      if(action === 'plannerSyncPatch') return patch(client, (request && request.mutations) || []);
      return Promise.resolve({
        result: 'error',
        retry: false,
        message: '전체 파일 저장은 쓰지 않습니다. 바뀐 항목만 올립니다.'
      });
    }).catch(function(err){
      return shapeError(err);
    });
  }

  setTimeout(function(){
    if(!configured()) return;
    getClient().then(function(client){
      return client.auth.getSession();
    }).then(function(res){
      var session = res && res.data && res.data.session;
      cachedEmail = session && session.user && session.user.email ? session.user.email : '';
      try { if(typeof updateSyncStatusUI_ === 'function') updateSyncStatusUI_(); } catch(e){}
    }).catch(function(){});
  }, 0);

  return {
    configured: configured,
    /** 팀 로그인된 Supabase 클라이언트 (인스타·쓰레드 미디어 업로드·게시 요청용) */
    client: sessionClient,
    cachedEmail: function(){ return cachedEmail; },
    handle: handle,
    abort: abortActive,
    signIn: signIn,
    importRows: importRows
  };
})();
