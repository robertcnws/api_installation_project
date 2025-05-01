import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { MeasurementView } from 'src/sections/measurement/view';

// ----------------------------------------------------------------------

const metadata = { title: `Measurements | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <MeasurementView />
    </>
  );
}
