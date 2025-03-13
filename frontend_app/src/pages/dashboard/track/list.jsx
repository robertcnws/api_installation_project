import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TrackListView } from 'src/sections/track/view';

// ----------------------------------------------------------------------

const metadata = { title: `Tracking Logs list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TrackListView />
    </>
  );
}
