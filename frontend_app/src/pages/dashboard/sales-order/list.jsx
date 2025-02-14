import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { SalesOrderListView } from 'src/sections/sales-order/view';

// ----------------------------------------------------------------------

const metadata = { title: `Sales Order list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SalesOrderListView />
    </>
  );
}
