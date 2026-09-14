import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

let authToken: string | null = null;
let refreshToken: string | null = null;
let onAuthError: (() => void) | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

export function setOnAuthError(handler: (() => void) | null) {
  onAuthError = handler;
}

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    if (!authToken) {
      authToken = await AsyncStorage.getItem('token');
    }
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.error?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await AsyncStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          refreshToken = newRefreshToken;
        }
        authToken = accessToken;

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authToken = null;
        refreshToken = null;
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        onAuthError?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export function clearAuthToken() {
  authToken = null;
  refreshToken = null;
}

export default api;
