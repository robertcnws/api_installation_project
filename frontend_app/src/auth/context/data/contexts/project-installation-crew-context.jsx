import React, { useMemo, useContext, createContext } from 'react';

import { useProjectInstallationCrewsQuery } from 'src/_mock/__project_installation_crews';

const ProjectInstallationCrewContext = createContext();
export const useProjectInstallationCrews = () => useContext(ProjectInstallationCrewContext);

export function ProjectInstallationCrewProvider({ children }) {
  const { 
    data: projectInstallationCrews = [], 
    refetch: refetchProjectInstallationCrews, 
    loading: loadingProjectInstallationCrews, 
    error: errorProjectInstallationCrews,
  } = useProjectInstallationCrewsQuery();

  const value = useMemo(() => ({ 
    projectInstallationCrews, 
    refetchProjectInstallationCrews, 
    loadingProjectInstallationCrews, 
    errorProjectInstallationCrews 
}), [
    projectInstallationCrews,
    refetchProjectInstallationCrews,
    loadingProjectInstallationCrews,
    errorProjectInstallationCrews,
]);

  return <ProjectInstallationCrewContext.Provider value={value}>{children}</ProjectInstallationCrewContext.Provider>;
}