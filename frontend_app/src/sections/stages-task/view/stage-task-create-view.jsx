import { useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useRouter } from 'src/routes/hooks';

import { StageTaskNewEditForm } from '../stage-task-new-edit-form';



// ----------------------------------------------------------------------

export function StageTaskCreateView() {

  const currentStageId = localStorage.getItem('currentStageTaskId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.stageTask.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentStageId ? "Create a new task stage" : "Edit task stage"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Task Stage', href: paths.dashboard.stageTask.list },
          { name: 'New stage' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StageTaskNewEditForm currentStageId={currentStageId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
