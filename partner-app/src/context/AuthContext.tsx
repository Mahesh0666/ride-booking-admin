import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import socketService from '../services/socketService';

interface Driver {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profileImage?: string;
  isDriver: boolean;
  isVerified: boolean;
  isOnline: boolean;
  rating?: number;
  totalRides?: number;
  earnings?: number;
  licenseNumber?: string;
  onboardingStatus?: string;
  rejectionReason?: string;
  documents?: Record<string, string>;
  vehicle?: any;
  currentLocation?: any;
  token?: string;
}

interface AuthContextType {
  driver: Driver | null;
  token: string | null;
  isLoading: boolean;
  termsAccepted: boolean;
  acceptTerms: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerAndOnboard: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateDriver: (data: Partial<Driver>) => void;
  refreshProfile: () => Promise<Driver | null>;
  otpLogin: {
    requestOtp: (phone: string) => Promise<any>;
    verifyOtp: (phone: string, otp: string) => Promise<{ isNewUser: boolean }>;
    registerNew: (phone: string, name: string) => Promise<void>;
  };
}

const DriverAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useDriverAuth = () => {
  const context = useContext(DriverAuthContext);
  if (!context) throw new Error('useDriverAuth must be used within DriverAuthProvider');
  return context;
};

export const DriverAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('driver_token');
      const storedDriver = await AsyncStorage.getItem('driver_data');
      const storedTerms = await AsyncStorage.getItem('driver_terms_accepted');
      if (storedTerms === '1') setTermsAccepted(true);
      if (storedToken && storedDriver) {
        setToken(storedToken);
        setDriver(JSON.parse(storedDriver));
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (err) {
      console.error('Failed to load stored auth', err);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptTerms = async () => {
    await AsyncStorage.setItem('driver_terms_accepted', '1');
    setTermsAccepted(true);
  };

  const setAuth = async (newToken: string, driverData: Driver) => {
    const withToken = { ...driverData, token: newToken };
    await AsyncStorage.setItem('driver_token', newToken);
    await AsyncStorage.setItem('driver_data', JSON.stringify(withToken));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setDriver(withToken);
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { token: newToken, user: driverData } = response.data;
    await setAuth(newToken, driverData);
  };

  const registerAndOnboard = async (name: string, email: string, password: string, phone: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      name,
      email,
      password,
      phone,
      role: 'driver',
    });
    const { token: newToken, user: driverData } = response.data;
    await setAuth(newToken, driverData);
  };

  const logout = async () => {
    socketService.disconnect();
    await AsyncStorage.removeItem('driver_token');
    await AsyncStorage.removeItem('driver_data');
    await AsyncStorage.removeItem('driver_terms_accepted');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setDriver(null);
  };

  const updateDriver = (data: Partial<Driver>) => {
    if (driver) {
      const updated = { ...driver, ...data };
      setDriver(updated);
      AsyncStorage.setItem('driver_data', JSON.stringify(updated));
    }
  };

  const refreshProfile = async () => {
    if (!token) return null;
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = { ...response.data.user, token };
      setDriver(profile);
      AsyncStorage.setItem('driver_data', JSON.stringify(profile));
      return profile;
    } catch (err) {
      return null;
    }
  };

  const otpLogin = {
    requestOtp: async (phone: string) => {
      const res = await axios.post(`${API_BASE_URL}/auth/twilio/otp/request`, {
        phone,
        role: 'driver',
      });
      return res.data;
    },
    verifyOtp: async (phone: string, otp: string) => {
      const res = await axios.post(`${API_BASE_URL}/auth/twilio/otp/verify`, {
        phone,
        otp,
        role: 'driver',
      });
      const data = res.data;

      if (data.token && data.user) {
        await setAuth(data.token, data.user);
      }

      return { isNewUser: data.isNewUser, requestId: data.requestId, ...data };
    },
    registerNew: async (phone: string, name: string) => {
      const res = await axios.post(`${API_BASE_URL}/auth/twilio/otp/register`, {
        phone,
        name,
        role: 'driver',
      });
      const data = res.data;

      if (data.token && data.user) {
        await setAuth(data.token, data.user);
      }
    },
  };

  return (
    <DriverAuthContext.Provider value={{ driver, token, isLoading, termsAccepted, acceptTerms, login, registerAndOnboard, logout, updateDriver, refreshProfile, otpLogin }}>
      {children}
    </DriverAuthContext.Provider>
  );
};
