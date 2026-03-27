import apiClient from '../api/client';
import {clearAccessToken, extractAccessToken, setAccessToken} from './tokenStore';

const AUTH_EVENT = 'auth-token-changed';

const notifyAuthChange = () => {
    window.dispatchEvent(new Event(AUTH_EVENT));
};

const extractToken = (payload: any) => {
    return extractAccessToken(payload);
};

export const login = async (email: string, password: string) => {
    const response: any = await apiClient.post('/api/v1/auth/identifier/login', {
        email,
        password,
    });

    const token = extractToken(response?.data);

    if (token) {
        setAccessToken(token);
        notifyAuthChange();
    }

    return response?.data;
};

export const signup = async (email: string, password: string) => {
    const response: any = await apiClient.post('/api/v1/auth/identifier/sign-up', {
        email,
        password,
    });

    return response?.data;
};

export const logout = async () => {
    try {
        await apiClient.post('/api/v1/auth/identifier/logout');
    } finally {
        clearAccessToken();
        notifyAuthChange();
    }
};

export const authEvents = {
    AUTH_EVENT,
};
