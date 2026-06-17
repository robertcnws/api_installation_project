import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { InstallationCrewCreateView } from 'src/sections/installation-crew/view';

// ----------------------------------------------------------------------

const metadata = { title: `Single installation crew | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <InstallationCrewCreateView />
    </>
  );
}
