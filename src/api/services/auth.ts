import { publicClient, authenticatedClient } from '../client';
import { setTokens, removeTokens } from '../utils/tokenStorage';

interface LoginCredentials {
    token: string;
}
export interface DailyLoginResponse {
    firstLoginToday: boolean;
}
export interface MeResponse {
    id: number;
    nickname: string;
    profileImage: string;
}

export const getMe = async (): Promise<MeResponse> => {
    const { data } = await authenticatedClient.get<MeResponse>('/user/me');
    return data;
};

export const login = async (credentials: LoginCredentials) => {
    const response = await publicClient.post('/auth/kakao', credentials);        
    setTokens(response.data.accessToken, response.data.refreshToken);
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
