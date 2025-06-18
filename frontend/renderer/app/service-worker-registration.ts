export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful');
        })
        .catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
} 