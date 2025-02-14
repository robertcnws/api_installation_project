import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TaskDefaultListView } from 'src/sections/task-default/view';

// ----------------------------------------------------------------------

const metadata = { title: `Tasks list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TaskDefaultListView />
    </>
  );
}
