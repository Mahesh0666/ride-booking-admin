import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

let authToken: string | null = null;
let refreshTokenVal: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

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
      authToken = await AsyncStorage.getItem('driver_token');
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
        const storedRefreshToken = await AsyncStorage.getItem('driver_refresh_token');
        if (!storedRefreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await AsyncStorage.setItem('driver_token', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('driver_refresh_token', newRefreshToken);
          refreshTokenVal = newRefreshToken;
        }
        authToken = accessToken;

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authToken = null;
        refreshTokenVal = null;
        await AsyncStorage.multiRemove(['driver_token', 'driver_refresh_token', 'driver_data']);
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
  refreshTokenVal = token;
}

export function clearAuthToken() {
  authToken = null;
  refreshTokenVal = null;
}

export default api;
