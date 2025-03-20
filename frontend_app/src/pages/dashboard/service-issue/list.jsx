import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceIssueListView } from 'src/sections/service-issue/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service Issues list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceIssueListView />
    </>
  );
}
