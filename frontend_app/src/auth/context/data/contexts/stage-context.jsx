import React, { useMemo, useContext, createContext } from 'react';

import { useStagesQuery } from 'src/_mock/__stages';

import { useSortedStages } from '../hooks/use-sorted-stages';

const StagesContext = createContext();
export const useStages = () => useContext(StagesContext);

export function StagesProvider({ children }) {
  const { data: stages = [], refetch: refetchStages, loading: loadingStages, error: errorStages } = useStagesQuery();

  const loadedStages = useSortedStages(stages);

  const value = useMemo(() => ({ 
    loadedStages, 
    refetchStages, 
    loadingStages, 
    errorStages 
}), [
    loadedStages, 
    refetchStages, 
    loadingStages, 
    errorStages 
]);

  return <StagesContext.Provider value={value}>{children}</StagesContext.Provider>;
}