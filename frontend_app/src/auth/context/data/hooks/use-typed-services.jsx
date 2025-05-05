import dayjs from 'dayjs';
import { useMemo } from 'react';

import { isInstaller } from 'src/utils/check-permissions';


export function useTypedServices(services, loadedUsers, userLogged) {
  const typed = useMemo(() => services?.map(s => ({
    ...s,
    userReporter: loadedUsers?.find(u => u.username === s.userReporter.username),
    usersAssignees: s.usersAssignees.map(u => ({
      ...u,
      avatarUrl: loadedUsers?.find(x => x.username === u.username)?.avatarUrl,
    })),
  })), [services, loadedUsers]);

  const filteredServices = useMemo(() => typed.filter(s => {
    if (isInstaller(userLogged?.data?.user_role?.name)) {
      return s.usersServiceTeam?.some(u => u.username === userLogged?.data?.username);
    }
    return true;
  }), [typed, userLogged]);

  return useMemo(() => filteredServices?.sort((a, b) => {
    if (a.startDate && b.startDate) return dayjs(a.startDate).diff(dayjs(b.startDate));
    if (!a.startDate && b.startDate) return 1;
    if (a.startDate && !b.startDate) return -1;
    return 0;
  }), [filteredServices]);
}