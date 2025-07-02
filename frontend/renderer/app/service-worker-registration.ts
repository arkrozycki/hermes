export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/'
        })
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available');
                  // Optionally prompt user to refresh
                }
              });
            }
          });
        })
        .catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from service worker:', event.data);
    });
  }
}

// Extend Navigator interface for standalone property
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Add iOS-specific PWA detection
export function isIOSPWA() {
  return window.navigator.standalone === true;
}

// Add beforeinstallprompt handling
export function setupInstallPrompt() {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt triggered');
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Show custom install button if needed
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            } else {
              console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
          });
        }
      });
    }
  });

  // Track if app was installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Hide install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
} 