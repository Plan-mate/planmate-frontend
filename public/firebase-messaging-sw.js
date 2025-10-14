importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const notificationLocks = new Map();

function isNotificationLocked(notificationId) {
  const now = Date.now();
  for (const [id, timestamp] of notificationLocks.entries()) {
    if (now - timestamp > 5000) {
      notificationLocks.delete(id);
    }
  }
  return notificationLocks.has(notificationId);
}

function lockNotification(notificationId) {
  notificationLocks.set(notificationId, Date.now());
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    event.stopImmediatePropagation();
    event.preventDefault();
    
    const notificationId = payload.data?.id || payload.messageId || `notif-${Date.now()}`;
    
    if (isNotificationLocked(notificationId)) return;
    
    lockNotification(notificationId);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || '새로운 알림';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '새로운 알림이 도착했습니다.',
      icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
      tag: notificationId,
      requireInteraction: false,
      silent: false,
    };
    
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('Push 처리 중 오류:', error);
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  if (event.data && event.data.type === 'INIT_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;
    
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
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