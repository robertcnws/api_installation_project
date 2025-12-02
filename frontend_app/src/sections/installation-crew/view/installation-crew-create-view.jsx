import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InstallationCrewNewEditForm } from '../installation-crew-new-edit-form';



// ----------------------------------------------------------------------

export function InstallationCrewCreateView() {

  const currentInstallationCrewId = localStorage.getItem('currentInstallationCrewId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.installationCrew.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={currentInstallationCrewId ? "Edit installation crew" : "Create a new installation crew"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Installation Crew', href: paths.dashboard.installationCrew.list },
          { name: currentInstallationCrewId ? 'Edit installation crew' : 'New installation crew' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InstallationCrewNewEditForm currentInstallationCrewId={currentInstallationCrewId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
