import React, { useMemo, useContext, createContext, useEffect, useCallback, useState } from 'react';

import { useProjectsQuery } from 'src/_mock/__projects';

import { useAuth } from './user-context';
import { useFilteredProjects } from '../hooks/use-filtered-projects';

const ProjectsContext = createContext();
export const useProjects = () => useContext(ProjectsContext);

export function ProjectsProvider({ children }) {
  const { 
    data: projects = [], 
    refetch: refetchProjects, 
    loading: loadingProjects, 
    error: errorProjects,
  } = useProjectsQuery();

  const { userLogged, loadedUsers } = useAuth();

  const loadedProjects = useFilteredProjects(projects, loadedUsers, userLogged);

  const value = useMemo(() => ({ 
    loadedProjects, 
    refetchProjects, 
    loadingProjects, 
    errorProjects,
}), [
    loadedProjects, 
    refetchProjects, 
    loadingProjects, 
    errorProjects,
]);

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}