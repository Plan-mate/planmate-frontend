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
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      
      if (registration.active) {
        registration.active.postMessage({
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
      }
      
      return registration;
    }
    return null;
  } catch (error) {
    console.error('❌ 서비스 워커 등록 실패:', error);
    return null;
  }
}

export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('현재 환경은 알림을 지원하지 않습니다.');
      return null;
    }

    await registerServiceWorkerWithConfig();

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('Firebase Messaging 초기화 실패');
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log('알림 권한 상태:', permission);

    if (permission === 'granted') {
      if (!VAPID_KEY) {
        console.error('VAPID 키가 설정되지 않았습니다.');
        return null;
      }

      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (currentToken) {
        const storedToken = getStoredFcmToken();
        
        if (storedToken !== currentToken) {
          try {
            const message = await saveFcmToken(currentToken);
            console.log('✅ FCM 토큰:', message);
            setStoredFcmToken(currentToken);
          } catch (error: any) {
            console.error('❌ FCM 토큰 저장 실패:', error?.response?.data?.message || error.message);
            return null;
          }
        } else {
          console.log('✅ FCM 토큰 변경 없음 (백엔드 전송 생략)');
        }
        
        return currentToken;
      } else {
        console.warn('⚠️ FCM 토큰을 가져올 수 없습니다.');
        return null;
      }
    } else if (permission === 'denied') {
      console.warn('❌ 알림 권한이 거부되었습니다.');
      clearStoredFcmToken();
      return null;
    } else {
      console.warn('⚠️ 알림 권한 요청이 무시되었습니다.');
      return null;
    }
  } catch (error) {
    console.error('❌ FCM 토큰 획득 중 오류 발생:', error);
    return null;
  }
}

export async function onForegroundMessage(
  callback: (payload: any) => void
): Promise<(() => void) | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('Firebase Messaging 초기화 실패');
      return null;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📨 포어그라운드 메시지 수신:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ 포어그라운드 메시지 리스너 등록 실패:', error);
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

