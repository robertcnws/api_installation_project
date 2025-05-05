import dayjs from 'dayjs';
import { useMemo } from 'react';

import { listRolesAndSubroles } from 'src/utils/check-permissions';
import { getProjectInstaller, totalPercentageProjectStage } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

export function useFilteredProjects(projects, loadedUsers, userLogged) {
  const typedProjects = useMemo(() => projects?.map(project => ({
    ...project,
    type: 'folder',
    userReporter: loadedUsers?.find(u => u.username === project?.userReporter?.username),
    usersAssignees: project?.usersAssignees?.map(u => ({
      ...u,
      avatarUrl: loadedUsers?.find(x => x.username === u.username)?.avatarUrl,
    })),
  })), [projects, loadedUsers]);

  const sortedProjects = useMemo(() => typedProjects?.sort((a, b) => {
    if (a.startDate && b.startDate) return dayjs(a.startDate).diff(dayjs(b.startDate));
    if (!a.startDate && b.startDate) return 1;
    if (a.startDate && !b.startDate) return -1;
    return 0;
  }), [typedProjects]);

  let finalProjects = sortedProjects;
  const roles = listRolesAndSubroles(userLogged?.data?.user_role?.name);
  if (!roles.some(r => [CONFIG.roles.financialStaff, CONFIG.roles.warehouseStaff, CONFIG.roles.installer].includes(r))) {
    finalProjects = sortedProjects?.filter(p =>
      p.usersAssignees?.some(u => u.username === userLogged?.data?.username) ||
      p.userManager?.username === userLogged?.data?.username
    );
  }
  else if (userLogged?.data?.user_role?.name.toLowerCase().includes(CONFIG.roles.installer.toLowerCase())) {
    finalProjects = sortedProjects?.filter(p => (
      (
        (p.currentStage?.name?.toLowerCase().includes(CONFIG.stages.installation.toLowerCase())) ||
        (p.currentStage?.name?.toLowerCase().includes(CONFIG.stages.coordination.toLowerCase()) &&
          totalPercentageProjectStage(p, CONFIG.stages.coordination, CONFIG) >= 50)
      ) && getProjectInstaller(p, CONFIG)?.username === userLogged?.data?.username
    ));
  }
  return finalProjects;
}
