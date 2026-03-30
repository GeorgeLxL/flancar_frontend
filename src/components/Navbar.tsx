import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { logout } from '../api/client';

export default function Navbar() {
  const { user, refetch } = useAuth();

  const handleLogout = async () => {
    await logout().catch(() => undefined);
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
              <div className="truncate">{user.name}</div>
              <span className="mt-1 hidden rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 sm:inline-flex">{user.role}</span>
            </div>
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
