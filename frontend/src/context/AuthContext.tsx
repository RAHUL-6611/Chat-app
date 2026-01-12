import { createContext, use, useState, useEffect, ReactNode } from 'react';
import api from '../api/api';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (optional: could hit a /profile or /me endpoint)
    const storedUser = localStorage.getItem('chat_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post<User>('/auth/login', { email, password });
    setUser(data);
    localStorage.setItem('chat_user', JSON.stringify(data));
    return data;
  };

  const signup = async (username: string, email: string, password: string): Promise<User> => {
    const { data } = await api.post<User>('/auth/signup', { username, email, password });
    setUser(data);
    localStorage.setItem('chat_user', JSON.stringify(data));
    return data;
  };

  const logout = async (): Promise<void> => {
    await api.post('/auth/logout');
    setUser(null);
    localStorage.removeItem('chat_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
