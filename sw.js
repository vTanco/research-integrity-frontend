self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('ria-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/report.html',
        '/settings.html',
        '/main.js',
        '/resources/hero-bg.jpg'
      ]);
    })
  );
});
