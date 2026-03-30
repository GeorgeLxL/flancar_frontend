import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSchedules, deleteSchedule } from '../api/client';
import { useAuth } from '../components/AuthContext';
import { format } from 'date-fns';

interface Schedule {
  id: number;
  title: string;
  carType: string;
  startAt: string;
  endAt: string;
  customerName: string;
  pdfNumber: string;
}

export default function ScheduleList() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const load = () => getSchedules().then(setSchedules);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    await deleteSchedule(id);
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">スケジュール一覧</h1>
        {(user?.role === 'worker' || user?.role === 'admin') && (
          <Link to="/schedules/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            新規作成
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
      <table className="min-w-[880px] w-full border-collapse text-sm">
        <thead className="text-center">
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border">PDF番号</th>
            <th className="p-3 border">タイトル</th>
            <th className="p-3 border">車種</th>
            <th className="p-3 border">お客様名</th>
            <th className="p-3 border">開始日時</th>
            <th className="p-3 border">終了日時</th>
            <th className="p-3 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(s => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="p-3 border">{s.pdfNumber}</td>
              <td className="p-3 border">{s.title}</td>
              <td className="p-3 border">{s.carType}</td>
              <td className="p-3 border">{s.customerName}</td>
              <td className="p-3 border">{format(new Date(s.startAt), 'yyyy/MM/dd HH:mm')}</td>
              <td className="p-3 border">{format(new Date(s.endAt), 'yyyy/MM/dd HH:mm')}</td>
              <td className="p-3 border space-x-2">
                {(user?.role === 'clerk' || user?.role === 'admin') && (
                  <Link to={`/schedules/${s.id}/pdf`} className="text-green-600 hover:underline">PDF</Link>
                )}
                {(user?.role === 'worker' || user?.role === 'admin') && (
                  <>
                    <Link to={`/schedules/${s.id}/edit`} className="text-blue-600 hover:underline">編集</Link>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">削除</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
