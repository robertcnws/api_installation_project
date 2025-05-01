import React, { useMemo, useContext, createContext } from 'react';

import { useDefaultTasksQuery } from 'src/_mock/__default_tasks';

import { useSortedDefaultTasks } from '../hooks/use-sorted-default-tasks';

const DefaultTasksContext = createContext();
export const useDefaultTasks = () => useContext(DefaultTasksContext);

export function DefaultTasksProvider({ children }) {
  const { 
    data: defaultTasks = [], 
    refetch: refetchDefaultTasks, 
    loading: loadingDefaultTasks, 
    error: errorDefaultTasks 
  } = useDefaultTasksQuery();

  const loadedDefaultTasks = useSortedDefaultTasks(defaultTasks);

  const value = useMemo(() => ({ 
    loadedDefaultTasks, 
    refetchDefaultTasks, 
    loadingDefaultTasks, 
    errorDefaultTasks 
}), [
    loadedDefaultTasks, 
    refetchDefaultTasks, 
    loadingDefaultTasks, 
    errorDefaultTasks 
]);

  return <DefaultTasksContext.Provider value={value}>{children}</DefaultTasksContext.Provider>;
}