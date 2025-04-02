import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceStageCreateView } from 'src/sections/service-stages/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new service stage | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceStageCreateView />
    </>
  );
}
