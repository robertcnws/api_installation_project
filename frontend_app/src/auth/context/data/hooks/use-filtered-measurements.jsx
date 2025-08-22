import { useMemo } from 'react';

import { CONFIG } from 'src/config-global';

export function useFilteredMeasurements(measurements, projects, services, userLogged) {
  let finalMeasurements = measurements;
  if (userLogged?.data?.user_role?.name.toLowerCase().includes(CONFIG.roles.installer.toLowerCase())) {
    finalMeasurements = finalMeasurements?.filter(m => (
      // projects.some(project => project?.id === m?.project?.id) || 
      // services.some(service => service?.id === m?.service?.id) 
      m?.userManager?.username === userLogged?.data?.username ||
      m?.firstAssignee?.username === userLogged?.data?.username ||
      m?.checkAssignee?.username === userLogged?.data?.username
    ));
  }
  return useMemo(() => finalMeasurements, [finalMeasurements]);
}
