import { Tooltip, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MeasurementNewForm } from '../measurement-new-form';



// ----------------------------------------------------------------------

export function MeasurementCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new measurement"
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Measurement', href: paths.dashboard.service.list },
          { name: 'New measurement' },
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

      <MeasurementNewForm />
    </DashboardContent>
  );
}
