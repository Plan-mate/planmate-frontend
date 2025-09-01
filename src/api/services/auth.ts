import { publicClient, authenticatedClient } from '../client';
import { setTokens, removeTokens } from '../utils/tokenStorage';

interface LoginCredentials {
    token: string;
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
    } catch {
        // 서버에 세션이 없을 수도 있으므로 실패를 무시합니다
    } finally {
        removeTokens();
        document.cookie = 'pm_auth=; path=/; max-age=0';
    }
};

