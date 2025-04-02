import { Tooltip, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
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
        action={
          <Tooltip title="Close new service form" arrow>
            <IconButton
              component={RouterLink}
              href={paths.dashboard.service.list}
            >
              <Iconify icon="mingcute:close-fill" />
            </IconButton>
          </Tooltip>
        }
      />

      <ServiceNewForm />
    </DashboardContent>
  );
}
