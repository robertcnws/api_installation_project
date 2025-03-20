import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DefaultGuideProductNewEditForm } from '../default-guide-product-new-edit-form';



// ----------------------------------------------------------------------

export function DefaultGuideProductCreateView() {

  const currentDefaultGuideProductId = localStorage.getItem('currentDefaultGuideProductId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.defaultGuideProduct.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentDefaultGuideProductId ? "Create a new project default guide product" : "Edit project default guide product"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Default Guide Product', href: paths.dashboard.defaultGuideProduct.list },
          { name: 'New default guide product' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DefaultGuideProductNewEditForm currentDefaultGuideProductId={currentDefaultGuideProductId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
