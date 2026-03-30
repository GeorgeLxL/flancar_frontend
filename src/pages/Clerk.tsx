import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getSchedules, getSchedule, updateScheduleStatus } from '../api/client';
import PDFPreview, { type Schedule as PreviewSchedule } from './PDFPreview';

const MOCK_USER_KEY = 'flancar-mock-user';

type ScheduleStatus = 'draft' | 'pending' | 'sent' | 'finished';

type ScheduleRow = {
  id: number;
  title: string;
  carType: string;
  startAt: string;
  endAt: string;
  customerName: string;
  pdfNumber: string;
  status: ScheduleStatus;
};

type PreviewScheduleWithMeta = PreviewSchedule & {
  id: number;
  status: ScheduleStatus;
};

const STATUS_LABEL: Record<ScheduleStatus, { label: string; className: string }> = {
  draft: { label: '作成中', className: 'bg-gray-100 text-gray-500' },
  pending: { label: '確認待ち', className: 'bg-yellow-100 text-yellow-700' },
  sent: { label: '送信済み', className: 'bg-blue-100 text-blue-700' },
  finished: { label: '完了', className: 'bg-green-100 text-green-700' },
};

const MOCK_SCHEDULES: ScheduleRow[] = [
  {
    id: 8323218,
    pdfNumber: '20260330001',
    title: '2026年3月分 納品請求書',
    carType: 'トヨタ プリウス ZVW30',
    customerName: 'TN墨田菊川',
    startAt: '2026-03-30T09:30:00',
    endAt: '2026-03-30T17:00:00',
    status: 'draft',
  },
];

const MOCK_PREVIEW_SCHEDULE: PreviewScheduleWithMeta = {
  id: 8323218,
  status: 'draft',
  pdfNumber: '20260330001',
  title: '2026年3月分 納品請求書',
  carType: 'トヨタ プリウス ZVW30',
  description: '3月実施分の整備・部品交換費用をまとめた納品請求書サンプルです。',
  startAt: '2026-03-30T09:30:00',
  endAt: '2026-03-30T17:00:00',
  storeName: '墨田菊川店',
  assignee: '山田 一郎',
  responsible: '田中 部長',
  customerName: 'TN墨田菊川',
  requester: '寺西 様',
  items: [
    { productName: '12ヶ月点検 基本整備', quantity: 1, unitPrice: 12800 },
    { productName: 'エンジンオイル SP 0W-20', quantity: 4, unitPrice: 2200 },
    { productName: 'オイルフィルター取替', quantity: 1, unitPrice: 1800 },
    { productName: 'フロントワイパーゴム 左右', quantity: 2, unitPrice: 1400 },
    { productName: '発煙筒交換', quantity: 1, unitPrice: 980 },
    { productName: '納車・請求書発行手数料', quantity: 1, unitPrice: 1200 },
  ],
};

export default function Clerk() {
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [selected, setSelected] = useState<PreviewScheduleWithMeta | null>(null);

  useEffect(() => {
    const hasMockUser = Boolean(window.localStorage.getItem(MOCK_USER_KEY));

    if (hasMockUser) {
      setSchedules(MOCK_SCHEDULES);
      return;
    }

    getSchedules().then(setSchedules).catch(() => setSchedules([]));
  }, []);

  const syncLocalStatus = (id: number, status: ScheduleStatus) => {
    setSchedules(current => current.map(schedule => (schedule.id === id ? { ...schedule, status } : schedule)));
    setSelected(current => (current && current.id === id ? { ...current, status } : current));
  };

  const handleSendPdf = async () => {
    if (!selected) return;

    const nextStatus: ScheduleStatus = 'pending';
    const hasMockUser = Boolean(window.localStorage.getItem(MOCK_USER_KEY));

    try {
      if (hasMockUser) {
        syncLocalStatus(selected.id, nextStatus);
        toast.success('PDFを送信しました。');
        setSelected(null);
        return;
      }

      const updated = await updateScheduleStatus(selected.id, nextStatus);
      syncLocalStatus(selected.id, updated.status);
      toast.success(updated.status === 'pending' ? 'PDFを送信しました。' : 'ステータスを更新しました。');
      setSelected(null);
    } catch {
      toast.error('PDF送信に失敗しました。');
    }
  };

  const handleFinishSchedule = async (id: number) => {
    const result = await Swal.fire({
      title: 'このスケジュールを完了にしますか？',
      text: '完了にすると送信ボタンは表示されなくなります。',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '完了にする',
      cancelButtonText: 'キャンセル',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    const hasMockUser = Boolean(window.localStorage.getItem(MOCK_USER_KEY));

    try {
      if (hasMockUser) {
        syncLocalStatus(id, 'finished');
        toast.success('スケジュールを完了にしました。');
        return;
      }

      const updated = await updateScheduleStatus(id, 'finished');
      syncLocalStatus(id, updated.status);
      if (selected?.id === id) {
        setSelected(updated);
      }
      toast.success('スケジュールを完了にしました。');
    } catch {
      toast.error('完了処理に失敗しました。');
    }
  };

  const openPDF = (schedule: ScheduleRow) => {
    const hasMockUser = Boolean(window.localStorage.getItem(MOCK_USER_KEY));

    if (hasMockUser && schedule.id === MOCK_SCHEDULES[0].id) {
      setSelected({ ...MOCK_PREVIEW_SCHEDULE, status: schedule.status });
      return;
    }

    getSchedule(schedule.id)
      .then((data: PreviewScheduleWithMeta) => setSelected(data))
      .catch(() => setSelected(null));
  };

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">スケジュール一覧</h1>
          <p className="mt-0.5 text-sm text-gray-400">PDFを確認してeFaxで送信してください</p>
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openPDF(schedule)}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        PDF確認
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFinishSchedule(schedule.id)}
                        disabled={schedule.status !== 'pending'}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        完了
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-6" onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex justify-end border-b border-gray-100 p-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                × 閉じる
              </button>
            </div>
            <PDFPreview schedule={selected} status={selected.status} onSendPdf={handleSendPdf} />
          </div>
        </div>
      )}
    </div>
  );
}
