/* Pedacinho de Amor — service worker
   Guarda o app no tablet para abrir sem internet.
   Os dados (vendas, fiado) NÃO passam por aqui: ficam no localStorage do app. */
const VERSAO = 'pedacinho-v1';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // fontes do Google: guarda na primeira vez e usa a cópia depois
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSAO).then(c => c.match(req).then(r => r || fetch(req).then(res => {
      c.put(req, res.clone()); return res;
    }))));
    return;
  }
  if (url.origin !== location.origin) return;

  // o app: tenta a internet (para receber atualizações) e cai na cópia guardada se estiver sem rede
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
