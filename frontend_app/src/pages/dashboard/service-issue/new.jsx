import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceIssueCreateView } from 'src/sections/service-issue/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new service issue | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceIssueCreateView />
    </>
  );
}
