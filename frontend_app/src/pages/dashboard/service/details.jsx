import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceDetailsView } from 'src/sections/service/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service Details | Dashboard - ${CONFIG.appName}` };

export default function Page() {

  const serviceId = localStorage.getItem('serviceId');

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceDetailsView serviceId={serviceId}/>
    </>
  );
}
