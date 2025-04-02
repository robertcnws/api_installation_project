import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceView } from 'src/sections/service/view';

// ----------------------------------------------------------------------

const metadata = { title: `Services | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceView />
    </>
  );
}
