import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DefaultGuideProductCreateView } from 'src/sections/default-guide-product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new guide product | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DefaultGuideProductCreateView />
    </>
  );
}
