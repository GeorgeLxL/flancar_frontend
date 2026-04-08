import { useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getSchedule, updateScheduleStatus } from '../api/client';
import Calendar, { type CalendarEvent } from '../components/Calendar';
import PDFPreview, { type Schedule as PreviewSchedule } from '../components/PDFPreview';
import ScheduleSearch from '../components/ScheduleSearch';

type ScheduleStatus = 'draft' | 'pending' | 'sent' | 'finished';

type PreviewScheduleWithMeta = PreviewSchedule & {
  id: number;
  status: ScheduleStatus;
};

export default function Clerk() {
  const [selected, setSelected] = useState<PreviewScheduleWithMeta | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const handleSearchSelect = (id: number) => {
    setSearchOpen(false);
    document.body.style.overflow = 'hidden';
    getSchedule(id)
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">スケジュール一覧</h1>
            <p className="mt-0.5 text-sm text-gray-400">スケジュールをクリックしてPDFを確認・送信</p>
          </div>

          <div className="w-full sm:w-auto">
            {searchOpen ? (
              <div className="flex items-start gap-2">
                <ScheduleSearch onSelect={handleSearchSelect} />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="shrink-0 rounded-xl border border-gray-200 bg-white p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                  aria-label="検索を閉じる"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                検索
              </button>
            )}
          </div>
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
