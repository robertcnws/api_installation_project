import React, { useMemo, useContext, createContext } from 'react';

import { useProjectPermissionsQuery } from 'src/_mock/__project_permissions';

const ProjectPermissionsContext = createContext();
export const useProjectPermissions = () => useContext(ProjectPermissionsContext);

export function ProjectPermissionsProvider({ children }) {
  const {
    data: projectPermissions,
    loading: loadingProjectPermissions,
    error: errorProjectPermissions,
  } = useProjectPermissionsQuery();

  const loadedProjectPermissions = useMemo(() => projectPermissions || [], [projectPermissions]);

  const value = useMemo(() => ({
    loadedProjectPermissions,
    loadingProjectPermissions,
    errorProjectPermissions
  }), [
    loadedProjectPermissions,
    loadingProjectPermissions,
    errorProjectPermissions
  ]);

  return <ProjectPermissionsContext.Provider value={value}>{children}</ProjectPermissionsContext.Provider>;
}