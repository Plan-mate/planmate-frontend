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
        await authenticatedClient.post('/auth/logout');
    } catch {} 
    finally {
        removeTokens();
        document.cookie = 'pm_auth=; path=/; max-age=0';
    }
};

export const checkDailyLogin = async (): Promise<DailyLoginResponse> => {
    const { data } = await authenticatedClient.get('/user/check-daily-login');
    return data;
};
