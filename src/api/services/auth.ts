import { publicClient, authenticatedClient } from '../client';
import { setTokens, removeTokens } from '../utils/tokenStorage';

interface LoginCredentials {
    token: string;
}

export const login = async (credentials: LoginCredentials) => {
    const response = await publicClient.post('/auth/kakao', credentials);    
    setTokens(response.data.accessToken, response.data.refreshToken);
};


