import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, any>) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('stockpilot_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('stockpilot_org');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('stockpilot_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getProfile();
      setUser(data.user);
      setOrganization(data.organization);
      localStorage.setItem('stockpilot_user', JSON.stringify(data.user));
      localStorage.setItem('stockpilot_org', JSON.stringify(data.organization));
    } catch {
      // Invalid token or expired
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    const handleExpired = () => {
      logout();
    };
    window.addEventListener('stockpilot:auth_expired', handleExpired);
    return () => window.removeEventListener('stockpilot:auth_expired', handleExpired);
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization);
      localStorage.setItem('stockpilot_token', res.token);
      localStorage.setItem('stockpilot_user', JSON.stringify(res.user));
      localStorage.setItem('stockpilot_org', JSON.stringify(res.organization));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization);
      localStorage.setItem('stockpilot_token', res.token);
      localStorage.setItem('stockpilot_user', JSON.stringify(res.user));
      localStorage.setItem('stockpilot_org', JSON.stringify(res.organization));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    setToken(null);
    localStorage.removeItem('stockpilot_token');
    localStorage.removeItem('stockpilot_user');
    localStorage.removeItem('stockpilot_org');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
