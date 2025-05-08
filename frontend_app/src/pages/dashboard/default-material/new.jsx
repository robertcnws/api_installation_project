import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DefaultMaterialCreateView } from 'src/sections/default-material/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new material | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DefaultMaterialCreateView />
    </>
  );
}
