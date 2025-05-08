import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DefaultMaterialNewEditForm } from '../default-material-new-edit-form';



// ----------------------------------------------------------------------

export function DefaultMaterialCreateView() {

  const currentDefaultMaterialId = localStorage.getItem('currentDefaultMaterialId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.defaultMaterial.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentDefaultMaterialId ? "Create a new project default material" : "Edit project default material"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Default Material', href: paths.dashboard.defaultMaterial.list },
          { name: 'New default material' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DefaultMaterialNewEditForm currentDefaultMaterialId={currentDefaultMaterialId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
