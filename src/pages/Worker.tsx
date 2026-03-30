import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { deleteSchedule, getSchedules } from '../api/client';

type ScheduleStatus = 'draft' | 'pending' | 'sent' | 'finished';

interface Schedule {
  id: number;
  title: string;
  carType: string;
  startAt: string;
  endAt: string;
  customerName: string;
  pdfNumber: string;
  status: ScheduleStatus;
}

const STATUS_LABEL: Record<ScheduleStatus, { label: string; className: string }> = {
  draft: { label: '作成中', className: 'bg-gray-100 text-gray-500' },
  pending: { label: '確認待ち', className: 'bg-yellow-100 text-yellow-700' },
  sent: { label: '送信済み', className: 'bg-blue-100 text-blue-700' },
  finished: { label: '完了', className: 'bg-green-100 text-green-700' },
};

export default function Worker() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const load = () => {
    return getSchedules().then(setSchedules);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'このスケジュールを削除しますか？',
      text: '削除すると元に戻せません。',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '削除する',
      cancelButtonText: 'キャンセル',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteSchedule(id);
      await load();
      toast.success('スケジュールを削除しました。');
    } catch {
      toast.error('削除に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">スケジュール一覧</h1>
            <p className="mt-0.5 text-sm text-gray-400">{schedules.length}件</p>
          </div>
          <Link
            to="/schedules/new"
            className="inline-flex items-center rounded-xl bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-700"
          >
            ＋ 新規作成
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="text-center">
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">PDF番号</th>
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">タイトル</th>
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">車種</th>
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">お客様名</th>
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">開始日時</th>
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">終了日時</th>
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">ステータス</th>
                <th className="px-5 py-3.5 font-medium whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-300">
                    スケジュールがありません
                  </td>
                </tr>
              )}
              {schedules.map(schedule => (
                <tr key={schedule.id} className="transition-colors hover:bg-gray-50">
                  <td className="max-w-[120px] px-5 py-4 font-mono text-xs text-gray-400 whitespace-nowrap">{schedule.pdfNumber}</td>
                  <td className="max-w-[240px] px-5 py-4 font-medium text-gray-900 whitespace-nowrap truncate">{schedule.title}</td>
                  <td className="max-w-[180px] px-5 py-4 text-gray-500 whitespace-nowrap truncate">{schedule.carType}</td>
                  <td className="max-w-[160px] px-5 py-4 text-gray-500 whitespace-nowrap truncate">{schedule.customerName}</td>
                  <td className="max-w-[150px] px-5 py-4 text-gray-400 whitespace-nowrap">{format(new Date(schedule.startAt), 'yyyy/MM/dd HH:mm')}</td>
                  <td className="max-w-[150px] px-5 py-4 text-gray-400 whitespace-nowrap">{format(new Date(schedule.endAt), 'yyyy/MM/dd HH:mm')}</td>
                  <td className="max-w-[110px] px-5 py-4 whitespace-nowrap">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_LABEL[schedule.status].className}`}>
                      {STATUS_LABEL[schedule.status].label}
                    </span>
                  </td>
                  <td className="max-w-[190px] px-5 py-4 whitespace-nowrap">
                    {schedule.status === 'draft' ? (
                      <div className="flex gap-2">
                        <Link
                          to={`/schedules/${schedule.id}/edit`}
                          className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-100"
                        >
                          編集
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(schedule.id)}
                          className="inline-flex items-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-100"
                        >
                          削除
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">作成中のみ編集可能</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
