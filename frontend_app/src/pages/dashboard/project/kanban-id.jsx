import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { KanbanView } from 'src/sections/project/kanban/view';

// ----------------------------------------------------------------------

const metadata = { title: `Project (Kanban) | Dashboard - ${CONFIG.appName}` };

export default function Page() {

  const projectId = localStorage.getItem('projectId');

  const { data: project, refetch: refetchProject } = useProjectByIdQuery(projectId, {
    skip: !projectId,
  });

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <KanbanView project={project} refetchProject={refetchProject} />
    </>
  );
}
