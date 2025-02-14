import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ShipmentListView } from 'src/sections/shipment/view';

// ----------------------------------------------------------------------

const metadata = { title: `Order list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ShipmentListView />
    </>
  );
}
