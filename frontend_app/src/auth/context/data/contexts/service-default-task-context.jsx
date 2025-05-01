import React, { useMemo, useContext, createContext } from 'react';

import { useServiceDefaultTasksQuery } from 'src/_mock/__service_default_tasks';

const ServiceDefaultTasksContext = createContext();
export const useServiceDefaultTasks = () => useContext(ServiceDefaultTasksContext);

export function ServiceDefaultTasksProvider({ children }) {
  const {
    data: serviceDefaultTasks = [],
    refetch: refetchServiceDefaultTasks
  } = useServiceDefaultTasksQuery();

  const loadedServiceDefaultTasks = useMemo(() => serviceDefaultTasks || [], [serviceDefaultTasks]);

  const value = useMemo(() => ({
    loadedServiceDefaultTasks,
    refetchServiceDefaultTasks,
  }), [
    loadedServiceDefaultTasks,
    refetchServiceDefaultTasks,
  ]);

  return <ServiceDefaultTasksContext.Provider value={value}>{children}</ServiceDefaultTasksContext.Provider>;
}