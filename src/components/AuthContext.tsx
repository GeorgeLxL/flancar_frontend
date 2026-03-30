import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe } from '../api/client';

export interface User {
  sub: string;
  email: string;
  name: string;
  role: string;
  accessToken: string;
  contractId: string;
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
