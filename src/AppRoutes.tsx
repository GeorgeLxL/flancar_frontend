import { useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Worker from './pages/Worker';
import Clerk from './pages/Clerk';
import ScheduleForm from './pages/ScheduleForm';
import PDF from './pages/PDF';

function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, setUser } = useAuth();

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [location]);

  if (roles && !roles.includes(user?.role || '')) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function AppRoutes() {
  const { loading, user, setUser } = useAuth();
  
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, [location]);

  if (loading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  const home =
    user?.role === 'worker'
      ? '/worker'
      : user?.role === 'clerk'
        ? '/clerk'
        : user?.role === 'admin'
          ? '/clerk'
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
          path="/schedules/new"
          element={
            <RequireRole roles={['worker', 'admin']}>
              <ScheduleForm />
            </RequireRole>
          }
        />
        <Route
          path="/schedules/:id/edit"
          element={
            <RequireRole roles={['worker', 'admin']}>
              <ScheduleForm />
            </RequireRole>
          }
        />
        <Route
          path="/schedules/:id/pdf"
          element={
            <RequireRole roles={['clerk', 'admin']}>
              <PDF />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to={home} />} />
      </Routes>
    </>
  );
}
