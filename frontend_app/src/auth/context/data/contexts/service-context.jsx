import React, { useMemo, useContext, createContext } from 'react';

import { useServicesQuery } from 'src/_mock/__services';

import { useAuth } from './user-context';
import { useTypedServices } from '../hooks/use-typed-services';

const ServicesContext = createContext();
export const useServices = () => useContext(ServicesContext);

export function ServicesProvider({ children }) {
  const { data: services = [], refetch: refetchServices, loading: loadingServices, error: errorServices } = useServicesQuery();
  const { loadedUsers } = useAuth();

  const loadedServices = useTypedServices(services, loadedUsers);

  const value = useMemo(() => ({ 
    loadedServices, 
    refetchServices, 
    loadingServices, 
    errorServices 
}), [
    loadedServices, 
    refetchServices, 
    loadingServices, 
    errorServices
]);

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}