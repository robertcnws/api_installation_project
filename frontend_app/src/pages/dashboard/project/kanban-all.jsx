import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { KanbanView } from 'src/sections/project/kanban/view';

// ----------------------------------------------------------------------

const metadata = { title: `Project (Kanban) | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <KanbanView />
    </>
  );
}
