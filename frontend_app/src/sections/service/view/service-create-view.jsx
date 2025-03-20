import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ServiceNewForm } from '../service-new-form';


// ----------------------------------------------------------------------

export function ServiceCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new service"
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Service', href: paths.dashboard.service.list },
          { name: 'New service' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceNewForm />
    </DashboardContent>
  );
}
