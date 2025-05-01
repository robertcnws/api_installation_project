import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { MeasurementDetailsView } from 'src/sections/measurement/view';

// ----------------------------------------------------------------------

const metadata = { title: `Measurement Details | Dashboard - ${CONFIG.appName}` };

export default function Page() {

  const measurementId = localStorage.getItem('measurementId');

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <MeasurementDetailsView measurementId={measurementId}/>
    </>
  );
}
