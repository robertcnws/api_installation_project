import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceTaskDefaultCreateView } from 'src/sections/service-task-default/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new service task | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceTaskDefaultCreateView />
    </>
  );
}
