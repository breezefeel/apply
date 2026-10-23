/* 수강생·회원 문자 기록. 플래너와 같은 Supabase, 팀 로그인만 읽고 씁니다. */
(function () {
  var URL = 'https://zjjziazvnhbkyygrtoxs.supabase.co';
  var KEY = 'sb_publishable_wohPCoYeIohjOW0KulBAvw_5qSTVV5F';
  var OUTBOX = 'rm_sms_history_outbox';
  var clientPromise = null;
  var boxId = '';
  var courseOf = function () { return ''; };
  var filter = 'all';
  var rows = [];
  var openId = '';

  function sb() {
    if (!clientPromise) {
      clientPromise = new Promise(function (resolve, reject) {
        function make() {
          if (!window.supabase || !window.supabase.createClient) {
            reject(new Error('Supabase 라이브러리를 불러오지 못했습니다.'));
            return;
          }
          resolve(window.supabase.createClient(URL, KEY, {
            auth: { persistSession: true, autoRefreshToken: true }
          }));
        }
        if (window.supabase && window.supabase.createClient) { make(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        s.onload = make;
        s.onerror = function () { reject(new Error('Supabase 라이브러리를 불러오지 못했습니다.')); };
        document.head.appendChild(s);
      });
    }
    return clientPromise;
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function phoneText(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length === 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    if (d.length === 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    return d || String(raw || '');
  }
  function whenText(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function courseText(code) {
    if (code === 'cmt') return 'CMT';
    if (code === 'ifc') return 'IFC';
    if (code === 'real') return 'Re:Al';
    return '';
  }
  function outbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX) || '[]') || []; } catch (e) { return []; }
  }
  function setOutbox(list) {
    if (!list.length) localStorage.removeItem(OUTBOX);
    else localStorage.setItem(OUTBOX, JSON.stringify(list.slice(-40)));
  }
  function session() {
    return sb().then(function (c) { return c.auth.getSession(); }).then(function (r) {
      return r && r.data && r.data.session;
    });
  }
  function flush() {
    var pending = outbox();
    if (!pending.length) return Promise.resolve();
    return session().then(function (sess) {
      if (!sess) return;
      return sb().then(function (c) {
        return c.from('sms_history').insert(pending).then(function (res) {
          if (res.error) throw res.error;
          setOutbox([]);
        });
      });
    });
  }

  function record(entry) {
    entry = entry || {};
    var people = (entry.recipients || []).map(function (p) {
      return { name: String((p && p.name) || '').trim(), phone: String((p && p.phone) || '').replace(/\D/g, '') };
    }).filter(function (p) { return p.name || p.phone; });
    var row = {
      sent_at: new Date().toISOString(),
      audience: entry.audience === 'member' ? 'member' : 'student',
      course: String(entry.course || ''),
      label: String(entry.label || ''),
      channel: entry.channel === 'alimtalk' ? 'alimtalk' : 'sms',
      body: String(entry.body || ''),
      recipients: people,
      sent_count: parseInt(entry.sentCount, 10) || people.length,
      failed: entry.failed || []
    };
    return session().then(function (sess) {
      if (!sess) {
        var q = outbox();
        q.push(row);
        setOutbox(q);
        paint();
        return { queued: true };
      }
      return sb().then(function (c) {
        return c.from('sms_history').insert(row).then(function (res) {
          if (res.error) throw res.error;
          refresh();
          return { ok: true };
        });
      });
    }).catch(function () {
      var q = outbox();
      q.push(row);
      setOutbox(q);
      paint();
      return { queued: true };
    });
  }

  function load() {
    return flush().catch(function () {}).then(function () {
      return session();
    }).then(function (sess) {
      if (!sess) { rows = []; return; }
      return sb().then(function (c) {
        return c.from('sms_history').select('id,sent_at,audience,course,label,channel,body,recipients,sent_count,failed')
          .order('sent_at', { ascending: false }).limit(40);
      }).then(function (res) {
        if (res.error) throw res.error;
        rows = res.data || [];
      });
    });
  }

  function visibleRows() {
    var course = courseOf() || '';
    return rows.filter(function (r) {
      if (filter === 'member') return r.audience === 'member';
      if (filter === 'course') return r.audience === 'student' && r.course === course;
      return true;
    });
  }
  function peopleLine(r) {
    var list = r.recipients || [];
    if (!list.length) return (r.sent_count || 0) + '명';
    var names = list.slice(0, 3).map(function (p) {
      return (p.name || phoneText(p.phone) || '이름 없음');
    });
    var more = list.length > 3 ? ' 외 ' + (list.length - 3) + '명' : '';
    return names.join(', ') + more;
  }

  function paint() {
    var body = document.getElementById('smsHistoryBody');
    if (!body) return;
    session().then(function (sess) {
      var pending = outbox().length;
      if (!sess) {
        body.innerHTML =
          '<form class="sms-history-login" id="smsHistoryLogin">' +
            '<p class="cert-note">기록을 보려면 플래너와 같은 팀 계정으로 한 번 로그인하세요. 로그인 전 발송은 이 기기에 모아 두었다가 함께 올립니다.' +
            (pending ? ' 기다리는 기록 ' + pending + '건.' : '') + '</p>' +
            '<input type="email" id="smsHistEmail" placeholder="팀 이메일" autocomplete="username">' +
            '<input type="password" id="smsHistPass" placeholder="비밀번호" autocomplete="current-password">' +
            '<button type="submit" class="btn btn-ghost">기록 보기</button>' +
            '<p class="cert-note" id="smsHistMsg"></p>' +
          '</form>';
        var form = document.getElementById('smsHistoryLogin');
        if (form) form.onsubmit = function (e) {
          e.preventDefault();
          var email = (document.getElementById('smsHistEmail') || {}).value || '';
          var pass = (document.getElementById('smsHistPass') || {}).value || '';
          var msg = document.getElementById('smsHistMsg');
          if (!email || !pass) { if (msg) msg.textContent = '이메일과 비밀번호를 입력해 주세요.'; return; }
          if (msg) msg.textContent = '로그인 중입니다.';
          sb().then(function (c) {
            return c.auth.signInWithPassword({ email: String(email).trim(), password: pass });
          }).then(function (res) {
            if (res.error) throw res.error;
            return refresh();
          }).catch(function (err) {
            if (msg) msg.textContent = (err && err.message) || '로그인에 실패했습니다.';
          });
        };
        return;
      }
      var list = visibleRows();
      var chips =
        '<div class="sms-history-tools">' +
          '<button type="button" class="sms-history-chip' + (filter === 'all' ? ' is-on' : '') + '" data-sms-filter="all">전체</button>' +
          '<button type="button" class="sms-history-chip' + (filter === 'course' ? ' is-on' : '') + '" data-sms-filter="course">이 과정</button>' +
          '<button type="button" class="sms-history-chip' + (filter === 'member' ? ' is-on' : '') + '" data-sms-filter="member">회원</button>' +
          '<button type="button" class="sms-history-chip" data-sms-logout>로그아웃</button>' +
        '</div>';
      var note = pending ? '<p class="cert-note">이 기기에 아직 올리지 못한 기록 ' + pending + '건이 있습니다.</p>' : '';
      if (!list.length) {
        body.innerHTML = chips + note + '<p class="cert-note">아직 보낸 기록이 없습니다.</p>';
        return;
      }
      body.innerHTML = chips + note + list.map(function (r) {
        var kind = r.audience === 'member' ? '회원' : '수강생';
        var where = courseText(r.course);
        var meta = [whenText(r.sent_at), kind, where, r.label, r.channel === 'alimtalk' ? '알림톡' : '문자'].filter(Boolean).join(' · ');
        var open = openId === r.id;
        var failN = (r.failed || []).length;
        return '<article class="sms-history-item' + (open ? ' is-open' : '') + '" data-sms-id="' + esc(r.id) + '">' +
          '<button type="button" class="sms-history-sum" data-sms-open="' + esc(r.id) + '">' +
            '<b>' + esc(peopleLine(r)) + '</b>' +
            '<small>' + esc(meta) + (failN ? ' · 실패 ' + failN + '명' : '') + '</small>' +
          '</button>' +
          (open ? '<pre class="sms-history-body">' + esc(r.body) + '</pre>' : '') +
        '</article>';
      }).join('');
    }).catch(function (err) {
      var msg = String((err && err.message) || err || '');
      if (/sms_history|schema cache|does not exist|42P01/i.test(msg)) {
        msg = '기록 표가 아직 없습니다. 컴퓨터에서 문자 기록 설치를 한 번 실행해 주세요.';
      }
      body.innerHTML = '<p class="cert-note">' + esc(msg || '기록을 불러오지 못했습니다.') + '</p>';
    });
  }

  function refresh() {
    return load().then(paint, paint);
  }

  function mount(id, opts) {
    boxId = id || 'smsHistoryBody';
    opts = opts || {};
    if (typeof opts.course === 'function') courseOf = opts.course;
    var root = document.getElementById('smsHistory');
    if (root && !root._smsBound) {
      root._smsBound = true;
      root.addEventListener('click', function (e) {
        var f = e.target.closest('[data-sms-filter]');
        if (f) { filter = f.getAttribute('data-sms-filter'); paint(); return; }
        if (e.target.closest('[data-sms-logout]')) {
          sb().then(function (c) { return c.auth.signOut(); }).then(refresh);
          return;
        }
        var open = e.target.closest('[data-sms-open]');
        if (!open) return;
        var next = open.getAttribute('data-sms-open');
        openId = openId === next ? '' : next;
        paint();
      });
    }
    refresh();
  }

  window.SmsHistory = { record: record, mount: mount, refresh: refresh };
})();
