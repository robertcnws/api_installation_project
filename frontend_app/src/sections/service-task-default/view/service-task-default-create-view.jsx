import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceTaskDefaultNewEditForm } from '../service-task-default-new-edit-form';



// ----------------------------------------------------------------------

export function ServiceTaskDefaultCreateView() {

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
        heading={!currentDefaultTaskId ? "Create a new service task" : "Edit service task"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Service Task', href: paths.dashboard.serviceTask.list },
          { name: 'New service task' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceTaskDefaultNewEditForm currentDefaultTaskId={currentDefaultTaskId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
