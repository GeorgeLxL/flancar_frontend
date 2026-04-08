import { useState } from 'react';
import toast from 'react-hot-toast';
import { getSchedule } from '../api/client';
import Calendar, { type CalendarEvent } from '../components/Calendar';
import ScheduleFormModal from '../components/ScheduleFormModal';
import ScheduleSearch from '../components/ScheduleSearch';

type ModalState =
  | { type: 'create'; start: Date; end: Date }
  | { type: 'edit'; id: number }
  | null;

export default function Worker() {
  const [modal, setModal] = useState<ModalState>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleRangeSelect = (start: Date, end: Date) => {
    setModal({ type: 'create', start, end });
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === 'draft') setModal({ type: 'edit', id: event.id });
  };

  const handleSearchSelect = (id: number) => {
    getSchedule(id)
      .then((schedule: { id: number; status: string }) => {
        if (schedule.status !== 'draft') {
          toast.error('作成中のスケジュールだけ編集できます。');
          return;
        }
        setModal({ type: 'edit', id: schedule.id });
      })
      .catch(() => toast.error('スケジュールの取得に失敗しました。'));
  };

  const closeModal = () => setModal(null);
  const onSaved = () => {
    setModal(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {searchOpen ? 'スケジュール検索' : 'スケジュール'}
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">
              {searchOpen
                ? 'キーワードからスケジュールを検索して開けます'
                : 'カレンダーをドラッグして新規作成、作成中のスケジュールをクリックして編集'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(open => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            aria-label={searchOpen ? '検索を閉じる' : '検索を開く'}
          >
            {searchOpen ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                閉じる
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                検索
              </>
            )}
          </button>
        </div>

        {searchOpen ? (
          <ScheduleSearch onSelect={handleSearchSelect} />
        ) : (
          <Calendar
            refreshKey={refreshKey}
            onRangeSelect={handleRangeSelect}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {modal?.type === 'create' && (
        <ScheduleFormModal
          defaultDate={modal.start}
          defaultEndDate={modal.end}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      {modal?.type === 'edit' && (
        <ScheduleFormModal
          scheduleId={modal.id}
          onClose={closeModal}
          onSaved={onSaved}
          onDeleted={onSaved}
        />
      )}
    </div>
  );
}
