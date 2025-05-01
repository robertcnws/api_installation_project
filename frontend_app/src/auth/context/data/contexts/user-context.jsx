import React, { useMemo, useEffect, useContext, createContext } from 'react';

import { _mock } from 'src/_mock/_mock';
import { useUsersQuery } from 'src/_mock/__users';

import { useAvailableUsers } from '../hooks/use-available-user';

const UserContext = createContext();
export const useAuth = () => useContext(UserContext);

export function UserProvider({ children }) {
  const { data: users = [], refetch: refetchUsers, loading: loadingUsers, error: errorUsers } = useUsersQuery();
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const initialUsers = useMemo(() =>
    users.map((user, index) => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      avatarUrl: user.avatarUrl || _mock.image.avatar(index),
    })),
    [users]
  );

  const loadedUsers = useAvailableUsers(initialUsers, userLogged);

  useEffect(() => {
    if (userLogged) {
      const me = loadedUsers.find(u => u.username === userLogged.data.username);
      if (me) {
        userLogged.data.avatarUrl = me.avatarUrl;
        userLogged.data.name = me.name;
        sessionStorage.setItem('userLogged', JSON.stringify(userLogged));
      }
    }
  }, [loadedUsers, userLogged]);

  const value = useMemo(() => ({ 
    userLogged, 
    loadedUsers, 
    refetchUsers, 
    loadingUsers, 
    errorUsers 
  }), [
    userLogged, 
    loadedUsers, 
    refetchUsers, 
    loadingUsers, 
    errorUsers
  ]);
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}