import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, removeTokens } from './utils/tokenStorage';
import type { AxiosRequestHeaders } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const TIMEOUT = 10000;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
});

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

interface ErrorResponse {
    message?: string;
}

const addAuthHeaderInterceptor = (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
        (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
    }
    return config;
};

const refreshToken = async (): Promise<string> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        handleTokenFailure();
        throw new Error('No refresh token available');
    }

    try {
        const { data } = await axios.post<TokenResponse>(
            `${API_BASE_URL}auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } },
        );
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
    } catch (error) {
        handleTokenFailure();
        return Promise.reject(error);
    }
};

const handleTokenFailure = () => {
    removeTokens();
    window.location.href = '/';
};

const handleResponseError = async (error: AxiosError<ErrorResponse>) => {
    if (!error.response) return Promise.reject(error);

    const { status, data, config } = error.response;
    const originalRequest = config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (status === 401 && data?.message === '엑세스 토큰이 만료되었습니다.' && !originalRequest._retry) {      
        originalRequest._retry = true;
        
        try {
            const newAccessToken = await refreshToken();
            (originalRequest.headers as AxiosRequestHeaders).Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    return Promise.reject(error);
};

apiClient.interceptors.request.use(addAuthHeaderInterceptor, (error) => Promise.reject(error));
apiClient.interceptors.response.use((response) => response, handleResponseError);

export { apiClient as authenticatedClient, apiClient as publicClient }; 