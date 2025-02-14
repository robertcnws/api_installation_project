import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { StageListView } from 'src/sections/stages/view';

// ----------------------------------------------------------------------

const metadata = { title: `Installation Stages list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <StageListView />
    </>
  );
}
