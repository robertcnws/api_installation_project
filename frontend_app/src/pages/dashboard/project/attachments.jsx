import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ProjectAttachmentsView } from 'src/sections/project/attachments/view';

// ----------------------------------------------------------------------

const metadata = { title: `Projects Attachments | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ProjectAttachmentsView />
    </>
  );
}
