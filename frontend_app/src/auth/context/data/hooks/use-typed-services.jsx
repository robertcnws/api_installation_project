import dayjs from 'dayjs';
import { useMemo } from 'react';

export function useTypedServices(services, loadedUsers) {
  const typed = useMemo(() => services.map(s => ({
    ...s,
    userReporter: loadedUsers.find(u => u.username === s.userReporter.username),
    usersAssignees: s.usersAssignees.map(u => ({
      ...u,
      avatarUrl: loadedUsers.find(x => x.username === u.username)?.avatarUrl,
    })),
  })), [services, loadedUsers]);

  return useMemo(() => typed.sort((a, b) => {
    if (a.startDate && b.startDate) return dayjs(a.startDate).diff(dayjs(b.startDate));
    if (!a.startDate && b.startDate) return 1;
    if (a.startDate && !b.startDate) return -1;
    return 0;
  }), [typed]);
}