import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { OverviewReportsView } from 'src/sections/overview/reports/view';

// ----------------------------------------------------------------------

const metadata = { title: `Reports - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>                           
      <OverviewReportsView />
    </>
  );
}
