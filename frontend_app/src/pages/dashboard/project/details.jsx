import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ProjectDetailsView } from 'src/sections/project/view';

// ----------------------------------------------------------------------

const metadata = { title: `Project Details | Dashboard - ${CONFIG.appName}` };

export default function Page() {

  const projectId = localStorage.getItem('projectId');

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ProjectDetailsView projectId={projectId}/>
    </>
  );
}
