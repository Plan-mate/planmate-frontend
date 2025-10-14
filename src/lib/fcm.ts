import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { saveFcmToken } from '@/api/services/auth';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const FCM_TOKEN_KEY = 'fcm_token';

function getStoredFcmToken(): string | null {
  return localStorage.getItem(FCM_TOKEN_KEY);
}

function setStoredFcmToken(token: string): void {
  localStorage.setItem(FCM_TOKEN_KEY, token);
}

function clearStoredFcmToken(): void {
  localStorage.removeItem(FCM_TOKEN_KEY);
}

async function registerServiceWorkerWithConfig(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!('serviceWorker' in navigator)) return null;
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.scope.includes('firebase-cloud-messaging-push-scope')) {
        await reg.unregister();
      }
    }
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    
    const readyRegistration = await navigator.serviceWorker.ready;
    if (!readyRegistration.active) return null;
    
    const sendConfig = (worker: ServiceWorker) => {
      worker.postMessage({
        type: 'INIT_FIREBASE_CONFIG',
        config: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        },
      });
    };
    
    if (registration.active) {
      sendConfig(registration.active);
    }
    
    if (registration.installing) {
      registration.installing.addEventListener('statechange', function(e) {
        const worker = e.target as ServiceWorker;
        if (worker.state === 'activated') {
          sendConfig(worker);
        }
      });
    }
    
    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
}

export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;

    const registration = await registerServiceWorkerWithConfig();
    if (!registration) return null;

    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const checkController = () => {
          if (navigator.serviceWorker.controller) {
            resolve();
          } else {
            setTimeout(checkController, 100);
          }
        };
        checkController();
        setTimeout(() => resolve(), 5000);
      });
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      if (!VAPID_KEY) {
        console.error('VAPID 키가 설정되지 않았습니다.');
        return null;
      }

      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        const storedToken = getStoredFcmToken();
        
        if (storedToken !== currentToken) {
          try {
            await saveFcmToken(currentToken);
            setStoredFcmToken(currentToken);
          } catch (error: any) {
            console.error('FCM 토큰 저장 실패:', error?.response?.data?.message || error.message);
            return null;
          }
        }
        
        return currentToken;
      }
    } else if (permission === 'denied') {
      clearStoredFcmToken();
    }
    
    return null;
  } catch (error) {
    console.error('FCM 토큰 획득 실패:', error);
    return null;
  }
}

const NOTIFICATION_LOCK_KEY = 'fcm_notification_lock';

function isNotificationLocked(notificationId: string): boolean {
  try {
    const locks = JSON.parse(localStorage.getItem(NOTIFICATION_LOCK_KEY) || '{}');
    const now = Date.now();
    
    Object.keys(locks).forEach(key => {
      if (now - locks[key] > 5000) {
        delete locks[key];
      }
    });
    
    localStorage.setItem(NOTIFICATION_LOCK_KEY, JSON.stringify(locks));
    return locks[notificationId] !== undefined;
  } catch {
    return false;
  }
}

function lockNotification(notificationId: string): void {
  try {
    const locks = JSON.parse(localStorage.getItem(NOTIFICATION_LOCK_KEY) || '{}');
    locks[notificationId] = Date.now();
    localStorage.setItem(NOTIFICATION_LOCK_KEY, JSON.stringify(locks));
  } catch (error) {
    console.warn('알림 락 저장 실패:', error);
  }
}

export async function onForegroundMessage(
  callback: (payload: any) => void
): Promise<(() => void) | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const unsubscribe = onMessage(messaging, (payload) => {
      const notificationId = payload.data?.id || payload.messageId || `notif-${Date.now()}`;
      
      if (isNotificationLocked(notificationId)) return;
      
      lockNotification(notificationId);

      try {
        if (Notification.permission === 'granted') {
          const { title, body, icon } = payload.notification || {};
          const notificationTitle = title || payload.data?.title || '새로운 알림';
          const notificationOptions: NotificationOptions = {
            body: body || payload.data?.body || '새로운 알림이 도착했습니다.',
            icon: icon || payload.data?.icon || '/favicon.ico',
            badge: '/favicon.ico',
            data: payload.data,
            tag: notificationId,
            requireInteraction: false,
            silent: false,
          };
          
          const notification = new Notification(notificationTitle, notificationOptions);
          
          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            notification.close();
          };
        }
      } catch (notificationError) {
        console.error('알림 생성 실패:', notificationError);
      }

      try {
        callback(payload);
      } catch (callbackError) {
        console.error('콜백 실행 실패:', callbackError);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('포어그라운드 메시지 리스너 등록 실패:', error);
    return null;
  }
}

export async function refreshFcmToken(): Promise<string | null> {
  clearStoredFcmToken();
  return await requestNotificationPermissionAndGetToken();
}

export function clearFcmToken(): void {
  clearStoredFcmToken();
}