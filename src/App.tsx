import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'sweetalert2/dist/sweetalert2.min.css';
import { AuthProvider } from './components/AuthContext';
import { CalendarProvider } from './components/CalendarContext';
import AppRoutes from './AppRoutes';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <CalendarProvider>
          <AppRoutes />
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '14px',
              background: '#111827',
              color: '#ffffff',
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
            },
            success: {
              style: {
                background: '#065f46',
              },
            },
            error: {
              style: {
                background: '#b91c1c',
              },
            },
          }}
        />
        </CalendarProvider>
      </AuthProvider>
    </HashRouter>
  );
}
