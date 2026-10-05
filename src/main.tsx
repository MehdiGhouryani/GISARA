import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register or unregister PWA Service Worker depending on environment
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Actively unregister service workers in development to prevent Vite HMR caching issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[PWA Dev] Successfully unregistered hijacked development service worker.');
            // Clear caches to fully recover from stale pre-bundled React issues
            if ('caches' in window) {
              caches.keys().then((keys) => {
                keys.forEach((key) => caches.delete(key));
              });
            }
          }
        });
      }
    });
  } else {
    // Register PWA Service Worker for offline capability & caching in production
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
