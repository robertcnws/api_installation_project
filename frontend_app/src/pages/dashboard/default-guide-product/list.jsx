import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DefaultGuideProductListView } from 'src/sections/default-guide-product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Default Guide Product list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DefaultGuideProductListView />
    </>
  );
}
