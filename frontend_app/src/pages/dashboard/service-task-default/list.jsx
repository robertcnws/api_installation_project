import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceTaskDefaultListView } from 'src/sections/service-task-default/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service Tasks list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceTaskDefaultListView />
    </>
  );
}
