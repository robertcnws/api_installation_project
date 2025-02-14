import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { StageCreateView } from 'src/sections/stages/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new project stage | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <StageCreateView />
    </>
  );
}
