import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { StageTaskCreateView } from 'src/sections/stages-task/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new task stage | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <StageTaskCreateView />
    </>
  );
}
