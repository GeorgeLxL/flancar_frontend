import { createContext, useContext, useState, type ReactNode } from 'react';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarContextType {
  anchor: Date;
  setAnchor: (d: Date) => void;
  view: CalendarView;
  setView: (v: CalendarView) => void;
}

const CalendarContext = createContext<CalendarContextType>({
  anchor: new Date(),
  setAnchor: () => {},
  view: window.innerWidth < 640 ? 'day' : 'month',
  setView: () => {},
});

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>(() => window.innerWidth < 640 ? 'day' : 'month');

  return (
    <CalendarContext.Provider value={{ anchor, setAnchor, view, setView }}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendar = () => useContext(CalendarContext);
