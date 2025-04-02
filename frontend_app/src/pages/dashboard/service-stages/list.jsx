import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceStageListView } from 'src/sections/service-stages/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service Stages list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceStageListView />
    </>
  );
}
