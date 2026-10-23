/* 브랜딩 플래너 — Service Worker (알림·딥링크·정적 캐시) */
var PLANNER_CACHE = 'planner-static-v192';

function isPlannerStaticRequest(url){
  if(!url || url.origin !== self.location.origin) return false;
  var path = url.pathname || '';
  return /\/(planner\.(css|js)|planner-sync-config\.js|planner-sync-supabase\.js|ops-naver-kw-seed\.js)(\?.*)?$/.test(path);
}

function isPlannerJsRequest(url){
  if(!url || url.origin !== self.location.origin) return false;
  return /\/(planner\.js|planner-sync-config\.js|planner-sync-supabase\.js)(\?.*)?$/.test(url.pathname || '');
}

self.addEventListener('install', function(event){
  // 설치 시 대용량 addAll 금지 (첫 접속 지연 원인)
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== PLANNER_CACHE && /^planner-static-v/.test(k); }).map(function(k){
        return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  // 문서 이동(HTML)은 절대 가로채지 않음 — URL 입력 후 흰/이전 화면에서 수십 초 대기 방지
  if(event.request.mode === 'navigate') return;
  var dest = event.request.destination;
  if(dest === 'document' || dest === 'iframe' || dest === 'embed') return;

  var url;
  try { url = new URL(event.request.url); } catch(e){ return; }
  if(!isPlannerStaticRequest(url)) return;

  // planner.js: network-first — 8초 타임아웃 금지(1.5MB가 잘리면 로딩 화면에서 멈춤)
  if(isPlannerJsRequest(url)){
    event.respondWith(
      fetch(event.request).then(function(res){
        if(res && res.status === 200 && res.type !== 'opaque'){
          var copy = res.clone();
          caches.open(PLANNER_CACHE).then(function(cache){ cache.put(event.request, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(event.request).then(function(cached){
          return cached || Response.error();
        });
      })
    );
    return;
  }

  // css·seed: cache-first + 네트워크 타임아웃 (무한 대기로 탭 스피너 방지)
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkPromise = new Promise(function(resolve, reject){
        var done = false;
        var timer = setTimeout(function(){
          if(done) return;
          done = true;
          reject(new Error('sw-fetch-timeout'));
        }, 8000);
        fetch(event.request).then(function(res){
          if(done) return;
          done = true;
          clearTimeout(timer);
          if(res && res.status === 200 && res.type !== 'opaque'){
            var copy = res.clone();
            caches.open(PLANNER_CACHE).then(function(cache){ cache.put(event.request, copy); });
          }
          resolve(res);
        }).catch(function(err){
          if(done) return;
          done = true;
          clearTimeout(timer);
          reject(err);
        });
      });

      if(cached){
        networkPromise.catch(function(){});
        return cached;
      }
      return networkPromise.catch(function(){
        return caches.match(event.request).then(function(again){
          return again || Response.error();
        });
      });
    })
  );
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var data = event.notification.data || {};
  var draftId = data.draftId != null ? String(data.draftId) : '';
  var catId = data.catId != null ? String(data.catId) : '0';
  var targetHash = draftId ? ('#open/' + encodeURIComponent(draftId) + '/' + catId) : '';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for(var i = 0; i < list.length; i++){
        var client = list[i];
        if('focus' in client){
          client.focus();
          if(targetHash && 'navigate' in client){
            try {
              var base = new URL(client.url);
              return client.navigate(base.pathname + base.search + targetHash);
            } catch(e){
              return client.navigate(client.url.split('#')[0] + targetHash);
            }
          }
          return;
        }
      }
      if(targetHash && self.registration.scope){
        return self.clients.openWindow(self.registration.scope.replace(/\/$/, '') + targetHash);
      }
    })
  );
});
