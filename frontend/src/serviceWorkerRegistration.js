// src/serviceWorkerRegistration.js
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => {
          console.log('Service worker registrado ✅');
        })
        .catch(err => {
          console.error('Error al registrar service worker ❌', err);
        });
    });
  }
}
