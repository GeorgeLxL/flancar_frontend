import { useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getSchedule, updateScheduleStatus } from '../api/client';
import Calendar, { type CalendarEvent } from '../components/Calendar';
import PDFPreview, { type Schedule as PreviewSchedule } from '../components/PDFPreview';

type ScheduleStatus = 'draft' | 'pending' | 'sent' | 'finished';

type PreviewScheduleWithMeta = PreviewSchedule & {
  id: number;
  status: ScheduleStatus;
};

export default function Clerk() {
  const [selected, setSelected] = useState<PreviewScheduleWithMeta | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const syncLocalStatus = (id: number, status: ScheduleStatus) => {
    setSelected(current =>
      current && current.id === id ? { ...current, status } : current
    );
    setRefreshKey(k => k + 1);
  };

  const handleEventClick = (event: CalendarEvent) => {
    document.body.style.overflow = 'hidden';
    getSchedule(event.id)
      .then((data: PreviewScheduleWithMeta) => setSelected(data))
      .catch(() => toast.error('スケジュールの取得に失敗しました。'));
  };

  const closeSelected = () => {
    document.body.style.overflow = '';
    setSelected(null);
  };

  const handleSendPdf = async () => {
    if (!selected) return;
    try {
      const updated = await updateScheduleStatus(selected.id, 'pending');
      syncLocalStatus(selected.id, updated.status);
      toast.success('PDFを送信しました。');
      closeSelected();
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

    try {
      const updated = await updateScheduleStatus(id, 'finished');
      syncLocalStatus(id, updated.status);
      toast.success('スケジュールを完了にしました。');
    } catch {
      toast.error('完了処理に失敗しました。');
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">スケジュール一覧</h1>
          <p className="mt-0.5 text-sm text-gray-400">スケジュールをクリックしてPDFを確認・送信</p>
        </div>

        <Calendar refreshKey={refreshKey} onEventClick={handleEventClick} />
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-6"
          onClick={closeSelected}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div className="flex gap-2">
                {selected.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleFinishSchedule(selected.id)}
                    className="rounded-xl bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    完了にする
                  </button>
                )}
              </div>
            </div>
            <PDFPreview schedule={selected} status={selected.status} onSendPdf={handleSendPdf} />
          </div>
        </div>
      )}
    </div>
  );
}
