import dayjs from 'dayjs';
import React, { useMemo, useContext, createContext } from 'react';

import { useMeasurementsQuery } from 'src/_mock/__measurements';

const MeasurementsContext = createContext();
export const useMeasurements = () => useContext(MeasurementsContext);

export function MeasurementsProvider({ children }) {
  const {
    data: measurements = [],
    refetch: refetchMeasurements,
    loading: loadingMeasurements,
    error: errorMeasurements
  } = useMeasurementsQuery();

  const memoMeasurements = useMemo(() => measurements || [], [measurements]);

  const sortedMeasurements = useMemo(
    () => memoMeasurements ?
      [...memoMeasurements].sort((a, b) => {
        if (a.firstDate && b.firstDate) return dayjs(a.firstDate).diff(dayjs(b.firstDate));
        if (!a.startDate && b.startDate) return 1;
        if (a.startDate && !b.startDate) return -1;
        if (a.checkDate && b.checkDate) return dayjs(a.checkDate).diff(dayjs(b.checkDate));
        if (!a.checkDate && b.checkDate) return 1;
        if (a.checkDate && !b.checkDate) return -1;
        return 0;
      }) : [],
    [memoMeasurements]
  );

  const loadedMeasurements = useMemo(() => sortedMeasurements, [sortedMeasurements]);

  const value = useMemo(() => ({
    loadedMeasurements,
    refetchMeasurements,
    loadingMeasurements,
    errorMeasurements
  }), [
    loadedMeasurements,
    refetchMeasurements,
    loadingMeasurements,
    errorMeasurements
  ]);

  return <MeasurementsContext.Provider value={value}>{children}</MeasurementsContext.Provider>;
}