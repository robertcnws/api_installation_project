import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { InstallationCrewListView } from 'src/sections/installation-crew/view';

// ----------------------------------------------------------------------

const metadata = { title: `Installation Crew list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <InstallationCrewListView />
    </>
  );
}
