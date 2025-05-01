import React, { useMemo, useContext, createContext } from 'react';

import { useUserRolesQuery } from 'src/_mock/__user_roles';

import { useAuth } from './user-context';
import { usePossibleUserRoles } from '../hooks/use-possible-user-roles';


const UserRolesContext = createContext();
export const useUserRoles = () => useContext(UserRolesContext);

export function UserRolesProvider({ children }) {
  const { userLogged } = useAuth();
  const { 
    data: userRoles = [], 
    refetch: refetchUserRoles, 
    loading: loadingUserRoles, 
    error: errorUserRoles 
  } = useUserRolesQuery(['Superadmin']);

  const loadedUserRoles = usePossibleUserRoles(userRoles, userLogged);

  const value = useMemo(() => ({ 
    loadedUserRoles, 
    refetchUserRoles, 
    loadingUserRoles, 
    errorUserRoles 
}), [
    loadedUserRoles, 
    refetchUserRoles, 
    loadingUserRoles, 
    errorUserRoles 
]);

  return <UserRolesContext.Provider value={value}>{children}</UserRolesContext.Provider>;
}