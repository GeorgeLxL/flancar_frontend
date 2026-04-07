import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { logout, getMyColor, setMyColor } from '../api/client';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_ENDPOINT, withCredentials: true });

export default function Navbar() {
  const location = useLocation();
  const { user, refetch } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [myColor, setMyColorState] = useState('#6b7280');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getMyColor().then(r => setMyColorState(r.color)).catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleColorChange = async (color: string) => {
    setMyColorState(color);
    await setMyColor(color).catch(() => {});
  };

  const handleSyncProducts = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await api.post('/webhook/products', { accessToken: user.accessToken }, {
        headers: { 'x-sdsch-secret': import.meta.env.VITE_WEBHOOK_SECRET },
      });
      toast.success('商品DB同期が完了しました。');
    } catch {
      toast.error('商品DB同期に失敗しました。');
    } finally {
      setSyncing(false);
      setMenuOpen(false);
    }
  };

  const handleSyncCustomers = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await api.post('/webhook/customers', { accessToken: user.accessToken }, {
        headers: { 'x-sdsch-secret': import.meta.env.VITE_WEBHOOK_SECRET },
      });
      toast.success('会員DB同期が完了しました。');
    } catch {
      toast.error('会員DB同期に失敗しました。');
    } finally {
      setSyncing(false);
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    localStorage.removeItem('user');
    setMenuOpen(false);
    refetch();
  };

  const roleLabel = user?.roleId === '3' ? 'worker' : user?.roleId === '2' ? 'clerk' : user?.roleId === '1' ? 'admin' : '';
  const switchTo = location.pathname.includes('/worker') ? '/clerk' : '/worker';
  const switchLabel = location.pathname.includes('/worker') ? '事務員へ' : '作業者へ';

  return (
    <nav className="bg-white border-b border-gray-100 relative z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8 md:py-4">
        <Link to="/" className="text-base font-semibold tracking-tight text-gray-900">
          FlanCar
        </Link>

        {user && (
          <>
            {/* ── Desktop ── */}
            <div className="hidden sm:flex min-w-0 items-center gap-3 text-sm">
              <div className="min-w-0 text-right text-gray-500">
                <div className="truncate">{user.staffName}</div>
                <span className="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{roleLabel}</span>
              </div>
              <input
                type="color"
                value={myColor}
                onChange={e => handleColorChange(e.target.value)}
                title="カレンダーの色"
                className="w-7 h-7 rounded-full border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              {user.roleId === '1' && (
                <>
                  <Link to={switchTo} className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-blue-600 hover:bg-blue-100 transition-colors">
                    {switchLabel}
                  </Link>
                  <button type="button" onClick={handleSyncProducts} disabled={syncing} className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    {syncing ? '同期中...' : '商品DB同期'}
                  </button>
                  <button type="button" onClick={handleSyncCustomers} disabled={syncing} className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    {syncing ? '同期中...' : '会員DB同期'}
                  </button>
                </>
              )}
              <button type="button" onClick={handleLogout} className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                ログアウト
              </button>
            </div>

            {/* ── Mobile ── */}
            <div className="flex sm:hidden items-center gap-2" ref={menuRef}>
              <span className="text-sm text-gray-700 font-medium truncate max-w-[120px]">{user.staffName}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {menuOpen
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                }
              </button>

              {menuOpen && (
                <div className="absolute top-full right-0 left-0 bg-white border-b border-gray-100 shadow-md flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user.staffName}</div>
                    <div className="text-xs text-gray-400">{roleLabel}</div>
                  </div>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-sm text-gray-600">カレンダーの色</span>
                    <input
                      type="color"
                      value={myColor}
                      onChange={e => handleColorChange(e.target.value)}
                      className="w-7 h-7 rounded-full border border-gray-200 cursor-pointer p-0.5 bg-white"
                    />
                  </div>
                  {user.roleId === '1' && (
                    <>
                      <Link to={switchTo} onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                        {switchLabel}
                      </Link>
                      <button type="button" onClick={handleSyncProducts} disabled={syncing} className="px-4 py-3 text-sm text-left text-gray-600 hover:bg-gray-50 border-b border-gray-100 disabled:opacity-50 transition-colors">
                        {syncing ? '同期中...' : '商品DB同期'}
                      </button>
                      <button type="button" onClick={handleSyncCustomers} disabled={syncing} className="px-4 py-3 text-sm text-left text-gray-600 hover:bg-gray-50 border-b border-gray-100 disabled:opacity-50 transition-colors">
                        {syncing ? '同期中...' : '会員DB同期'}
                      </button>
                    </>
                  )}
                  <button type="button" onClick={handleLogout} className="px-4 py-3 text-sm text-left text-red-500 hover:bg-gray-50 transition-colors">
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
