import React, { useMemo, useContext, createContext } from 'react';

import { useServiceStagesQuery } from 'src/_mock/__service_stages';

const ServiceStagesContext = createContext();
export const useServiceStages = () => useContext(ServiceStagesContext);

export function ServiceStagesProvider({ children }) {
  const {
    data: serviceStages = [],
    refetch: refetchServiceStages
  } = useServiceStagesQuery();

  const loadedServiceStages = useMemo(() => serviceStages || [], [serviceStages]);

  const value = useMemo(() => ({
    loadedServiceStages,
    refetchServiceStages,
  }), [
    loadedServiceStages,
    refetchServiceStages,
  ]);

  return <ServiceStagesContext.Provider value={value}>{children}</ServiceStagesContext.Provider>;
}