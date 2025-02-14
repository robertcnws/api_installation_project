import { useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useRouter } from 'src/routes/hooks';

import { TaskDefaultNewEditForm } from '../task-default-new-edit-form';



// ----------------------------------------------------------------------

export function TaskDefaultCreateView() {

  const currentDefaultTaskId = localStorage.getItem('currentDefaultTaskId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.task.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentDefaultTaskId ? "Create a new task" : "Edit task"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Task', href: paths.dashboard.task.list },
          { name: 'New task' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TaskDefaultNewEditForm currentDefaultTaskId={currentDefaultTaskId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
