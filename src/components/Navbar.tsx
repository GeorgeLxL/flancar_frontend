import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { logout } from '../api/client';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_ENDPOINT, withCredentials: true });

export default function Navbar() {
  const location = useLocation();
  const { user, refetch } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await api.post('/webhook', { accessToken: user.accessToken }, {
        headers: { 'x-sdsch-secret': import.meta.env.VITE_WEBHOOK_SECRET },
      });
      // Poll until server reports sync is done
      const poll = setInterval(async () => {
        try {
          const { data } = await api.get('/webhook/status');
          if (!data.syncing) {
            clearInterval(poll);
            setSyncing(false);
            toast.success('DB同期が完了しました。');
          }
        } catch {
          clearInterval(poll);
          setSyncing(false);
        }
      }, 3000);
    } catch {
      toast.error('DB同期に失敗しました。');
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    localStorage.removeItem('user');
    refetch();
  };

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 md:py-4">
        <Link to="/" className="text-base font-semibold tracking-tight text-gray-900">
          FlanCar
        </Link>
        {user && (
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <div className="min-w-0 text-right text-gray-500">
              <div className="truncate">{user.staffName}</div>
              <span className="mt-1 hidden rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 sm:inline-flex">
                {user?.roleId === '3' ? 'worker' : user?.roleId === '2' ? 'clerk' : user?.roleId === '1' ? 'admin' : ''}
              </span>
            </div>
            {user.roleId === '1' && (
              <>
                <Link
                  to={location.pathname.includes('/worker') ? '/clerk' : location.pathname.includes('/clerk') ? '/worker' : '/worker'}
                  className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-100"
                >
                  {location.pathname.includes('/worker') ? '事務員へ' : location.pathname.includes('/clerk') ? '作業者へ' : '作業者へ'}
                </Link>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {syncing ? 'DB同期中...' : 'DB同期'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
