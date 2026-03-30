import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe } from '../api/client';

const MOCK_USER_KEY = 'flancar-mock-user';

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
  loading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refetch: () => {} });

function getMockUser(): User | null {
  const raw = window.localStorage.getItem(MOCK_USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(MOCK_USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    setLoading(true);
    getMe()
      .then(setUser)
      .catch(() => setUser(getMockUser()))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();

    const handleRefreshAuth = () => {
      refetch();
    };

    window.addEventListener('focus', handleRefreshAuth);
    window.addEventListener('pageshow', handleRefreshAuth);

    return () => {
      window.removeEventListener('focus', handleRefreshAuth);
      window.removeEventListener('pageshow', handleRefreshAuth);
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading, refetch }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
