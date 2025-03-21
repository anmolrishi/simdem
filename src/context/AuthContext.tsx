import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/auth';
import { initializeAuth, setupTokenRefresh, stopTokenRefresh, getUserFromToken } from '../services/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleTokenRefresh = useCallback((newToken: string) => {
    setToken(newToken);
    setUser(getUserFromToken(newToken));
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { token, user } = await initializeAuth();
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        setupTokenRefresh(handleTokenRefresh);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsAuthenticated(false);
      }
    };

    initialize();

    return () => {
      stopTokenRefresh();
    }
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    setUser(getUserFromToken(newToken));
    setIsAuthenticated(true);
    setupTokenRefresh(handleTokenRefresh);
  };

  const logout = () => {
    stopTokenRefresh();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};