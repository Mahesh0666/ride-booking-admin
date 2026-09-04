import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

let authToken: string | null = null;
let onAuthError: (() => void) | null = null;

export function setOnAuthError(handler: (() => void) | null) {
  onAuthError = handler;
}

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
  (error) => {
    if (error.response?.status === 401) {
      authToken = null;
      onAuthError?.();
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

export default api;
