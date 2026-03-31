import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe } from '../api/client';

export interface User {
  email: string;
  staffName: string;
  roleId: String;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {}, loading: true, refetch: () => {} });


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    setLoading(true);
    getMe()
      .then(r => {
        setUser(r);
        localStorage.setItem('user', JSON.stringify(r));
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('user');
        } else {
          console.error('ユーザー情報の取得に失敗:', error);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();

    const handleRefreshAuth = () => {
      refetch();
    };

    window.addEventListener('pageshow', handleRefreshAuth);

    return () => {
      window.removeEventListener('pageshow', handleRefreshAuth);
    };
  }, []);

  return <AuthContext.Provider value={{ user, setUser, loading, refetch }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
