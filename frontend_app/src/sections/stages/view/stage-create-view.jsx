import { useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useRouter } from 'src/routes/hooks';

import { StageNewEditForm } from '../stage-new-edit-form';



// ----------------------------------------------------------------------

export function StageCreateView() {

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
          { name: 'Installation Stage', href: paths.dashboard.stage.list },
          { name: 'New stage' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StageNewEditForm currentStageId={currentStageId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
