import { useMemo } from 'react';

import { CONFIG } from 'src/config-global';

export function useFilteredMeasurements(measurements, projects, services, userLogged) {
  let finalMeasurements = measurements;
  if (userLogged?.data?.user_role?.name.toLowerCase().includes(CONFIG.roles.installer.toLowerCase())) {
    finalMeasurements = finalMeasurements.filter(m => (
      projects.some(project => project.id === m.project.id) || 
      services.some(service => service.id === m.service.id) 
    ));
  }
  return useMemo(() => finalMeasurements, [finalMeasurements]);
}
