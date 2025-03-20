import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceIssueNewEditForm } from '../service-issue-new-edit-form';



// ----------------------------------------------------------------------

export function ServiceIssueCreateView() {

  const currentServiceIssueId = localStorage.getItem('currentServiceIssueId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.serviceIssue.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentServiceIssueId ? "Create a new service issue" : "Edit service issue"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Service Issue', href: paths.dashboard.serviceIssue.list },
          { name: 'New service issue' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceIssueNewEditForm currentServiceIssueId={currentServiceIssueId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
