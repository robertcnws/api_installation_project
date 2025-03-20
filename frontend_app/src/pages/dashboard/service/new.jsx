import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceCreateView } from 'src/sections/service/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new service | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceCreateView />
    </>
  );
}
