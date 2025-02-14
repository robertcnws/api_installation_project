import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { StageTaskListView } from 'src/sections/stages-task/view';

// ----------------------------------------------------------------------

const metadata = { title: `Task Stages list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <StageTaskListView />
    </>
  );
}
