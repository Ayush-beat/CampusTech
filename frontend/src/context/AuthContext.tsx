import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  quickDemoLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  year: number;
  month: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ledger_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ledger_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Global active period (defaults to current date)
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);

  const saveAuth = (tokenVal: string, userVal: User) => {
    localStorage.setItem('ledger_token', tokenVal);
    localStorage.setItem('ledger_user', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const refreshUser = async () => {
    if (!localStorage.getItem('ledger_token')) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await api.getCurrentUser();
      setUser(u);
      localStorage.setItem('ledger_user', JSON.stringify(u));
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.login(data);
      saveAuth(res.access_token, res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      saveAuth(res.access_token, res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await api.quickDemoLogin();
      saveAuth(res.access_token, res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ledger_token');
    localStorage.removeItem('ledger_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        quickDemoLogin,
        logout,
        refreshUser,
        year,
        month,
        setYear,
        setMonth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
