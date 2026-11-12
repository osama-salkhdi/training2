// Service Worker: الشبكة أولاً لملفات الموقع نفسه فقط، والنسخة المخزنة عند انقطاع الإنترنت.
// لا يتدخل في طلبات Supabase أو المكتبات الخارجية.
const CACHE = 'olymp-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
