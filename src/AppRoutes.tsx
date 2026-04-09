import { useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Worker from './pages/Worker';
import Clerk from './pages/Clerk';
import StaffColors from './pages/StaffColors';

function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, setUser } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get('user');

    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser && parsedUser.staffName && parsedUser.roleId) {
          localStorage.setItem('user', JSON.stringify(parsedUser));
          setUser(parsedUser);
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.href = '/';
          return;
        }
      } catch {
        console.warn('Invalid user data in URL, skipping storage');
      }
    }

    // fallback: load from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(stored);
    } catch {
      setUser(null);
    }
  }, [setUser]);

  if (roles && !roles.includes(user?.roleId === '3' ? 'worker' : user?.roleId === '2' ? 'clerk' : user?.roleId === '1' ? 'admin' : '')) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function AppRoutes() {
  const { loading, user, setUser } = useAuth();

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [setUser]);

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  const home =
    user?.roleId === '3'
      ? '/worker'
      : user?.roleId === '2'
        ? '/clerk'
        : user?.roleId === '1'
          ? '/worker'
          : '/login';

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={home} />} />
        <Route path="/login" element={user ? <Navigate to={home} /> : <Login />} />
        <Route
          path="/worker"
          element={
            <RequireRole roles={['worker', 'admin']}>
              <Worker />
            </RequireRole>
          }
        />
        <Route
          path="/clerk"
          element={
            <RequireRole roles={['clerk', 'admin']}>
              <Clerk />
            </RequireRole>
          }
        />
        <Route
          path="/staff_colors"
          element={
            <RequireRole roles={['admin']}>
              <StaffColors />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to={home} />} />
      </Routes>
    </>
  );
}
