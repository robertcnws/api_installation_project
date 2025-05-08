import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DefaultMaterialListView } from 'src/sections/default-material/view';

// ----------------------------------------------------------------------

const metadata = { title: `Default Material list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DefaultMaterialListView />
    </>
  );
}
