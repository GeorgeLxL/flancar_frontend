import { useState } from 'react';
import Calendar, { type CalendarEvent } from '../components/Calendar';
import ScheduleFormModal from '../components/ScheduleFormModal';

type ModalState =
  | { type: 'create'; start: Date; end: Date }
  | { type: 'edit'; id: number }
  | null;

export default function Worker() {
  const [modal, setModal] = useState<ModalState>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRangeSelect = (start: Date, end: Date) => {
    setModal({ type: 'create', start, end });
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === 'draft') setModal({ type: 'edit', id: event.id });
  };

  const closeModal = () => setModal(null);
  const onSaved = () => { setModal(null); setRefreshKey(k => k + 1); };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">スケジュール</h1>
          <p className="mt-0.5 text-sm text-gray-400">カレンダーをドラッグして新規作成、作成中のスケジュールをクリックして編集</p>
        </div>

        <Calendar
          refreshKey={refreshKey}
          onRangeSelect={handleRangeSelect}
          onEventClick={handleEventClick}
        />
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
