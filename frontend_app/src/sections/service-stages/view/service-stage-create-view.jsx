import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceStageNewEditForm } from '../service-stage-new-edit-form';



// ----------------------------------------------------------------------

export function ServiceStageCreateView() {

  const currentStageId = localStorage.getItem('currentStageId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.stage.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentStageId ? "Create a new project stage" : "Edit project stage"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Service Stage', href: paths.dashboard.serviceStage.list },
          { name: 'New service stage' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceStageNewEditForm currentStageId={currentStageId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
