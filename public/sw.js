/* eslint-disable no-restricted-globals */

// Service worker — service deux rôles :
//  1. Réception des notifications push (Web Push standard).
//  2. Hook PWA minimal (install/activate). Pas de précache offline pour
//     l'instant : on garde un comportement network-first par défaut, ce
//     qui évite de servir du HTML obsolète après un déploiement.

const CACHE_VERSION = 'v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'MyKpopTrade', body: '', link: '/', data: {} };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { link: payload.link, ...(payload.data || {}) },
    tag: payload.data && payload.data.notificationId
      ? String(payload.data.notificationId)
      : undefined,
    renotify: false
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.link) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});
