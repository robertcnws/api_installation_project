import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TaskDefaultCreateView } from 'src/sections/task-default/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new task | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TaskDefaultCreateView />
    </>
  );
}
