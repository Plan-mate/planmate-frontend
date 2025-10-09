import { publicClient, authenticatedClient } from '../client';
import { setTokens, removeTokens } from '../utils/tokenStorage';
import type { LoginCredentials, DailyLoginResponse, MeResponse } from '../types/api.types';

export const getMe = async (): Promise<MeResponse> => {
    const { data } = await authenticatedClient.get<MeResponse>('/user/me');
    return data;
};

export const login = async (credentials: LoginCredentials) => {
    const { data } = await publicClient.post('/auth/kakao', credentials);
    setTokens(data.accessToken, data.refreshToken);
};

export const logout = async () => {
    try {
        await authenticatedClient.post('/user/logout');
    } catch (error) {
        console.error('로그아웃 API 호출 실패:', error);
    } finally {
        removeTokens();
        document.cookie = 'pm_auth=; path=/; max-age=0';
        
        if (typeof window !== 'undefined') {
            localStorage.removeItem('fcm_token');
        }
    }
};

export const checkDailyLogin = async (): Promise<DailyLoginResponse> => {
    const { data } = await authenticatedClient.get('/user/check-daily-login');
    return data;
};

export const saveFcmToken = async (fcmToken: string): Promise<string> => {
    const { data } = await authenticatedClient.post<string>('/user/fcm-token', { fcmToken });
    return data;
};
