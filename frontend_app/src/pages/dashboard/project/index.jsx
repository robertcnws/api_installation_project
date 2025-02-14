import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ProjectView } from 'src/sections/project/view';

// ----------------------------------------------------------------------

const metadata = { title: `Project | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ProjectView />
    </>
  );
}
