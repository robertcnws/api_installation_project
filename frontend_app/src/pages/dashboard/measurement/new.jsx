import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { MeasurementCreateView } from 'src/sections/measurement/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new measurement | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <MeasurementCreateView />
    </>
  );
}
