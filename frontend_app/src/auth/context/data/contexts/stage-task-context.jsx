import React, { useMemo, useContext, createContext } from 'react';

import { useStagesTaskQuery } from 'src/_mock/__stages_task';

import { useSortedStages } from '../hooks/use-sorted-stages';

const StageTasksContext = createContext();
export const useStageTasks = () => useContext(StageTasksContext);

export function StageTasksProvider({ children }) {
  const { 
    data: stageTasks = [], 
    refetch: refetchStagesTask, 
    loading: loadingStagesTask, 
    error: errorStagesTask 
  } = useStagesTaskQuery();

  const loadedStagesTask = useSortedStages(stageTasks);

  const value = useMemo(() => ({ 
    loadedStagesTask, 
    refetchStagesTask, 
    loadingStagesTask, 
    errorStagesTask 
}), [
    loadedStagesTask, 
    refetchStagesTask, 
    loadingStagesTask, 
    errorStagesTask 
]);

  return <StageTasksContext.Provider value={value}>{children}</StageTasksContext.Provider>;
}