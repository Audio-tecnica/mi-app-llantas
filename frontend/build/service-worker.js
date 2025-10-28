self.addEventListener('install', event => {
  console.log('⚙️ Service Worker instalado');
});

self.addEventListener('fetch', event => {
  // Aquí se puede agregar lógica de caché si quieres más adelante
});
