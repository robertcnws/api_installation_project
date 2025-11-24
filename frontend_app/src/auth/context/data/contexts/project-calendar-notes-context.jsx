import React, { useMemo, useContext, createContext } from 'react';

import { useCalendarNotesQuery } from 'src/_mock/__project_calendar_notes';

const CalendarNotesContext = createContext();
export const useCalendarNotes = () => useContext(CalendarNotesContext);

export function CalendarNotesProvider({ children }) {
  const { 
    data: loadedCalendarNotes = [], 
    refetch: refetchCalendarNotes, 
    loading: loadingCalendarNotes, 
    error: errorCalendarNotes 
  } = useCalendarNotesQuery();

  const value = useMemo(() => ({ 
    loadedCalendarNotes, 
    refetchCalendarNotes, 
    loadingCalendarNotes, 
    errorCalendarNotes 
}), [
    loadedCalendarNotes, 
    refetchCalendarNotes, 
    loadingCalendarNotes, 
    errorCalendarNotes 
]);

  return <CalendarNotesContext.Provider value={value}>{children}</CalendarNotesContext.Provider>;
}