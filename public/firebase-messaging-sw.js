importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;
    
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || '새로운 알림';
        const notificationOptions = {
          body: payload.notification?.body || '새로운 알림이 도착했습니다.',
          icon: payload.notification?.icon || '/favicon.ico',
          badge: '/favicon.ico',
          data: payload.data,
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

