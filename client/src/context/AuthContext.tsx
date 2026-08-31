import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (tenantSlug: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('portlog_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Carrega a sessão ativa checando o token/cookie no servidor
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        sessionStorage.setItem('portlog_user', JSON.stringify(response.data.user));
      } catch (err) {
        // Se falhou ao buscar /me, limpa cache
        sessionStorage.removeItem('portlog_user');
        sessionStorage.removeItem('portlog_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (tenantSlug: string, email: string, password: string) => {
    const response = await api.post('/auth/login', { tenantSlug, email, password });
    const { user: userData, token } = response.data;
    
    if (token) {
      sessionStorage.setItem('portlog_token', token);
    }
    sessionStorage.setItem('portlog_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    }
    sessionStorage.removeItem('portlog_token');
    sessionStorage.removeItem('portlog_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
