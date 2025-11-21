import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ServiceAttachmentsView } from 'src/sections/service/attachments/view';

// ----------------------------------------------------------------------

const metadata = { title: `Service Attachments | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ServiceAttachmentsView />
    </>
  );
}
