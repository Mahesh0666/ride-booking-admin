import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { setAuthToken, clearAuthToken, setOnAuthError } from '../services/apiClient';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profileImage?: string;
  isDriver: boolean;
  isOnline: boolean;
  rating?: number;
  totalRides?: number;
  vehicle?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  termsAccepted: boolean;
  acceptTerms: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  otpLogin: {
    requestOtp: (phone: string) => Promise<any>;
    verifyOtp: (phone: string, otp: string) => Promise<{ isNewUser: boolean }>;
    registerNew: (phone: string, name: string) => Promise<void>;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    bootstrapAsync();
    setOnAuthError(() => {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
      clearAuthToken();
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    });
    return () => setOnAuthError(null);
  }, []);

  const bootstrapAsync = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedTerms = await AsyncStorage.getItem('terms_accepted');
      if (storedTerms === '1') setTermsAccepted(true);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (err) {
      console.error('Failed to load stored auth', err);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptTerms = async () => {
    await AsyncStorage.setItem('terms_accepted', '1');
    setTermsAccepted(true);
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { token: newToken, user: newUser } = response.data;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setAuthToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      name,
      email,
      password,
      phone,
      role: 'rider',
    });
    const { token: newToken, user: newUser } = response.data;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setAuthToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    clearAuthToken();
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      AsyncStorage.setItem('user', JSON.stringify(updated));
    }
  };

  const otpLogin = {
    requestOtp: async (phone: string) => {
      const res = await axios.post(`${API_BASE_URL}/auth/otp/request`, { phone, role: 'rider' });
      return res.data;
    },
    verifyOtp: async (phone: string, otp: string) => {
      const res = await axios.post(`${API_BASE_URL}/auth/otp/verify`, { phone, otp, role: 'rider' });
      const data = res.data;
      if (!data.isNewUser && data.token && data.user) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setAuthToken(data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    },
    registerNew: async (phone: string, name: string) => {
      const res = await axios.post(`${API_BASE_URL}/auth/otp/register`, { phone, name, role: 'rider' });
      const data = res.data;
      if (data.token && data.user) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setAuthToken(data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setToken(data.token);
        setUser(data.user);
      }
    },
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, termsAccepted, acceptTerms, login, register, logout, updateUser, otpLogin }}>
      {children}
    </AuthContext.Provider>
  );
};