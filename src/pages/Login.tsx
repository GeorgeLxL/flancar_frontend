import axios from 'axios';
import type { User } from '../components/AuthContext';

const MOCK_USER_KEY = 'flancar-mock-user';

export default function Login() {
  const handleLogin = async () => {
    const { data } = await axios.get('http://localhost:8000/auth/login', { withCredentials: true });
    window.location.href = data.url;
  };

  const handleMockLogin = () => {
    const mockUser: User = {
      sub: 'mock-worker-001',
      email: 'worker@flancar.local',
      name: 'モック作業者',
      role: 'clerk',
      accessToken: 'mock-token',
      contractId: 'mock-contract',
    };

    window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
    window.location.href = '/worker';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="space-y-2">
          <div className="mb-4 text-4xl">FlanCar</div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">FlanCar</h1>
          <p className="text-sm text-gray-400">Smaregiアカウントでログインしてください</p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full rounded-xl bg-gray-900 px-8 py-3 font-medium text-white transition-all duration-200 hover:bg-gray-700"
        >
          Smaregiでログイン
        </button>
        <button
          onClick={handleMockLogin}
          className="w-full rounded-xl border border-gray-300 px-8 py-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
        >
          モックでログイン
        </button>
      </div>
    </div>
  );
}
