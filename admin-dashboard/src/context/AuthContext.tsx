import React, { createContext, useContext, useState, useEffect } from 'react';
import adminService from '../services/adminService';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isOnline?: boolean;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  lastOtp: string | null;
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
  const [lastOtp, setLastOtp] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      adminService.init();
      adminService.getMe()
        .then((userData) => {
          if (userData.role !== 'admin') {
            localStorage.removeItem('admin_token');
            setIsLoading(false);
            return;
          }
          setUser(userData);
          setToken(storedToken);
          setIsLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const otp = await adminService.login(email, password);
    setLastOtp(otp);
    return email;
  };

  const verifyLoginOtp = async (email: string, otp: string) => {
    const userData = await adminService.verifyLoginOtp(email, otp);
    if (userData.role !== 'admin') {
      throw new Error('Admin access required');
    }
    setUser(userData);
    setToken(localStorage.getItem('admin_token'));
  };

  const logout = () => {
    adminService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, verifyLoginOtp, logout, lastOtp }}>
      {children}
    </AuthContext.Provider>
  );
};
