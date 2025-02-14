import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ProjectEditView } from 'src/sections/project/view';

// ----------------------------------------------------------------------

const metadata = { title: `Update Project | Dashboard - ${CONFIG.appName}` };

export default function Page() {

  const projectId = localStorage.getItem('projectId');

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ProjectEditView projectId={projectId}/>
    </>
  );
}
