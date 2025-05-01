import React, { useMemo, useContext, createContext } from 'react';

import { useServiceIssuesQuery } from 'src/_mock/__service_issues';


const ServiceIssuesContext = createContext();
export const useServiceIssues = () => useContext(ServiceIssuesContext);

export function ServiceIssuesProvider({ children }) {
  const { 
    data: serviceIssues = [], 
    refetch: refetchServiceIssues
 } = useServiceIssuesQuery();
 
 const loadedServiceIssues = useMemo(() => serviceIssues || [], [serviceIssues]);

  const value = useMemo(() => ({ 
    loadedServiceIssues, 
    refetchServiceIssues,
}), [
    loadedServiceIssues, 
    refetchServiceIssues, 
]);

  return <ServiceIssuesContext.Provider value={value}>{children}</ServiceIssuesContext.Provider>;
}