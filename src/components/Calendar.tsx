import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { getSchedulesByRange } from '../api/client';

export interface CalendarEvent {
  id: number;
  title: string;
  startAt: string;
  endAt: string;
  status: 'draft' | 'pending' | 'sent' | 'finished';
}

export type CalendarView = 'day' | 'week' | 'month';

const STATUS_COLOR: Record<CalendarEvent['status'], string> = {
  draft: 'bg-gray-400',
  pending: 'bg-yellow-400',
  sent: 'bg-blue-500',
  finished: 'bg-emerald-500',
};

const STATUS_LABEL: Record<CalendarEvent['status'], string> = {
  draft: '作成中',
  pending: '確認待ち',
  sent: '送信済み',
  finished: '完了',
};

const DAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土'];

// 96 slots per day, each = 15 min. Visual: 4 slots share one hour row (56px → 14px each).
const SLOTS = Array.from({ length: 96 }, (_, i) => i);

function slotToDate(day: Date, slot: number): Date {
  const d = new Date(day);
  d.setHours(Math.floor(slot / 4), (slot % 4) * 15, 0, 0);
  return d;
}

function dateToSlot(date: Date): number {
  return date.getHours() * 4 + Math.floor(date.getMinutes() / 15);
}

interface CalendarProps {
  refreshKey?: number;
  onRangeSelect?: (start: Date, end: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

function getDefaultView(): CalendarView {
  return window.innerWidth < 640 ? 'day' : 'month';
}

function rangeForView(view: CalendarView, anchor: Date): { from: Date; to: Date } {
  if (view === 'day') return { from: startOfDay(anchor), to: addDays(startOfDay(anchor), 1) };
  if (view === 'week') {
    const from = startOfWeek(anchor, { weekStartsOn: 0 });
    return { from, to: addDays(from, 7) };
  }
  return {
    from: startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 }),
    to: endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 }),
  };
}

function eventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter(e => {
    const start = new Date(e.startAt);
    const end = new Date(e.endAt);
    return isSameDay(day, start) || isSameDay(day, end) || (day > start && day < end);
  });
}

function eventsForSlot(events: CalendarEvent[], day: Date, slot: number) {
  return events.filter(e => {
    const start = new Date(e.startAt);
    return isSameDay(day, start) && dateToSlot(start) === slot;
  });
}

function EventPill({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-full text-left rounded px-1.5 py-0.5 text-xs text-white truncate ${STATUS_COLOR[event.status]} hover:opacity-80 transition-opacity`}
    >
      {format(new Date(event.startAt), 'HH:mm')} {event.title}
    </button>
  );
}

// ── Time grid: hour labels + 15-min draggable slots ───────────────────────────
function TimeGrid({
  days,
  events,
  onRangeSelect,
  onEventClick,
}: {
  days: Date[];
  events: CalendarEvent[];
  onRangeSelect?: (start: Date, end: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const nowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ di: number; start: number; end: number } | null>(null);
  const [drag, setDrag] = useState<{ di: number; start: number; end: number } | null>(null);

  useEffect(() => { nowRef.current?.scrollIntoView({ block: 'center' }); }, []);

  const now = new Date();
  const nowSlot = dateToSlot(now);

  const onClick = (di: number, slot: number) => {
    if (!onRangeSelect) return;
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      const hour = Math.floor(slot / 4);
      const start = new Date(days[di]); start.setHours(hour, 0, 0, 0);
      const end = new Date(days[di]); end.setHours(hour + 1, 0, 0, 0);
      onRangeSelect(start, end);
    } else {
      onRangeSelect(slotToDate(days[di], slot), slotToDate(days[di], slot + 1));
    }
  };

  const onMouseDown = (di: number, slot: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { di, start: slot, end: slot };
    setDrag({ di, start: slot, end: slot });
  };

  const onMouseEnter = (di: number, slot: number) => {
    if (!dragRef.current || dragRef.current.di !== di) return;
    dragRef.current.end = slot;
    setDrag({ ...dragRef.current });
  };

  const onMouseUp = () => {
    if (!dragRef.current) { setDrag(null); return; }
    const { di, start, end } = dragRef.current;
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    const wasDrag = lo !== hi;
    dragRef.current = null;
    setDrag(null);
    if (wasDrag && onRangeSelect) {
      onRangeSelect(slotToDate(days[di], lo), slotToDate(days[di], hi + 1));
    }
  };

  const isDragging = (di: number, slot: number) => {
    if (!drag || drag.di !== di) return false;
    const lo = Math.min(drag.start, drag.end);
    const hi = Math.max(drag.start, drag.end);
    return slot >= lo && slot <= hi;
  };

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden border border-gray-200 rounded-2xl select-none"
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Column headers */}
      <div className="grid border-b border-gray-200 bg-white shrink-0" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
        <div className="border-r border-gray-200" />
        {days.map(day => {
          const today = isToday(day);
          const dow = day.getDay();
          return (
            <div key={day.toISOString()} className="py-2 text-center border-r border-gray-200 last:border-r-0">
              <div className={`text-xs font-medium ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {DAY_HEADERS[dow]}
              </div>
              <div className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${today ? 'bg-gray-900 text-white' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/*
          Each hour = 56px tall, split into 4 × 14px slots.
          Hour label sits in the first slot of each hour group.
        */}
        <div className="grid" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
          {SLOTS.map(slot => {
            const isHourStart = slot % 4 === 0;
            const hour = Math.floor(slot / 4);

            return (
              <>
                {/* Time label column */}
                <div
                  key={`lbl-${slot}`}
                  className={`h-3.5 flex items-start justify-end pr-2 shrink-0 border-r border-gray-200  ${isHourStart ? 'border-t' : ''}`}
                >
                  {isHourStart && (
                    <span className="text-xs text-gray-500 -mt-2 leading-none">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  )}
                </div>

                {/* Day slot cells */}
                {days.map((day, di) => {
                  const slotEvents = eventsForSlot(events, day, slot);
                  const isNow = isToday(day) && nowSlot === slot;
                  const dragging = isDragging(di, slot);

                  return (
                    <div
                      key={`${day.toISOString()}-${slot}`}
                      onMouseDown={e => onMouseDown(di, slot, e)}
                      onMouseEnter={() => onMouseEnter(di, slot)}
                      onClick={() => onClick(di, slot)}
                      className={`border-r border-gray-200 last:border-r-0 h-3.5 px-px cursor-pointer relative transition-colors ${
                        isHourStart ? 'border-t' : ''
                      } ${dragging ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                    >
                      {isNow && (
                        <div
                          ref={nowRef}
                          className="absolute left-0 right-0 border-t-2 border-red-400 z-10 pointer-events-none"
                        />
                      )}
                      {slotEvents.map(e => (
                        <EventPill key={e.id} event={e} onClick={() => onEventClick?.(e)} />
                      ))}
                    </div>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Month view ─────────────────────────────────────────────────────────────────
function MonthView({
  anchor,
  events,
  onRangeSelect,
  onEventClick,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onRangeSelect?: (start: Date, end: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 }),
  });

  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = (day: Date) => {
    longPressRef.current = setTimeout(() => {
      const s = new Date(day); s.setHours(9, 0, 0, 0);
      const e = new Date(day); e.setHours(10, 0, 0, 0);
      onRangeSelect?.(s, e);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  const handleClick = (day: Date, inMonth: boolean) => {
    if (!inMonth) return;
    const s = new Date(day); s.setHours(9, 0, 0, 0);
    const e = new Date(day); e.setHours(10, 0, 0, 0);
    onRangeSelect?.(s, e);
  };

  return (
    <div className="flex-1 border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-100 shrink-0">
        {DAY_HEADERS.map((d, i) => (
          <div key={d} className={`py-2 text-center text-xs font-medium uppercase tracking-wider ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 overflow-y-auto" style={{ gridAutoRows: 'minmax(90px, 1fr)' }}>
        {days.map(day => {
          const dayEvents = eventsForDay(events, day);
          const inMonth = isSameMonth(day, anchor);
          const today = isToday(day);
          const dow = day.getDay();
          return (
            <div
              key={day.toISOString()}
              onClick={() => handleClick(day, inMonth)}
              onMouseDown={() => inMonth && startLongPress(day)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => inMonth && startLongPress(day)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              className={`border-b border-r border-gray-100 p-1.5 transition-colors ${inMonth ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50/50 cursor-default'}`}
            >
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${today ? 'bg-gray-900 text-white' : !inMonth ? 'text-gray-300' : dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-600'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => (
                  <EventPill key={event.id} event={event} onClick={() => onEventClick?.(event)} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} 件</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Calendar ──────────────────────────────────────────────────────────────
export default function Calendar({ refreshKey, onRangeSelect, onEventClick }: CalendarProps) {
  const [view, setView] = useState<CalendarView>(getDefaultView);
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { from, to } = rangeForView(view, anchor);
    setLoading(true);
    getSchedulesByRange(from, to)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [view, anchor, refreshKey]);

  const navigate = (dir: 1 | -1) => {
    setAnchor(a => {
      if (view === 'day') return dir === 1 ? addDays(a, 1) : subDays(a, 1);
      if (view === 'week') return dir === 1 ? addWeeks(a, 1) : subWeeks(a, 1);
      return dir === 1 ? addMonths(a, 1) : subMonths(a, 1);
    });
  };

  const headerLabel = () => {
    if (view === 'day') return format(anchor, 'yyyy年 M月 d日');
    if (view === 'week') {
      const from = startOfWeek(anchor, { weekStartsOn: 0 });
      const to = endOfWeek(anchor, { weekStartsOn: 0 });
      return `${format(from, 'yyyy年 M月 d日')} – ${format(to, 'M月 d日')}`;
    }
    return format(anchor, 'yyyy年 M月');
  };

  const prevLabel = view === 'day' ? '‹ 前日' : view === 'week' ? '‹ 前週' : '‹ 前月';
  const nextLabel = view === 'day' ? '翌日 ›' : view === 'week' ? '翌週 ›' : '翌月 ›';

  const weekDays = eachDayOfInterval({
    start: startOfWeek(anchor, { weekStartsOn: 0 }),
    end: endOfWeek(anchor, { weekStartsOn: 0 }),
  });

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">{prevLabel}</button>
          <button type="button" onClick={() => setAnchor(new Date())} className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">今日</button>
          <button type="button" onClick={() => navigate(1)} className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">{nextLabel}</button>
          <h2 className="text-sm font-semibold text-gray-900">{headerLabel()}</h2>
          {loading && <span className="text-xs text-gray-300">読み込み中...</span>}
        </div>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {(['day', 'week', 'month'] as CalendarView[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 transition-colors ${view === v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {v === 'day' ? '日' : v === 'week' ? '週' : '月'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        {(Object.keys(STATUS_LABEL) as CalendarEvent['status'][]).map(s => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_COLOR[s]}`} />
            {STATUS_LABEL[s]}
          </div>
        ))}
      </div>

      {view === 'month' && <MonthView anchor={anchor} events={events} onRangeSelect={onRangeSelect} onEventClick={onEventClick} />}
      {view === 'week' && <TimeGrid days={weekDays} events={events} onRangeSelect={onRangeSelect} onEventClick={onEventClick} />}
      {view === 'day' && <TimeGrid days={[anchor]} events={events} onRangeSelect={onRangeSelect} onEventClick={onEventClick} />}
    </div>
  );
}
