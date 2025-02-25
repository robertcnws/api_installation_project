
import { Box } from '@mui/material';

import { KanbanView } from '../kanban/view';




// ----------------------------------------------------------------------

export function ProjectDetailsTaskView({ project, refetchProject, tasks, hasPermission }) {

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <KanbanView project={project} refetchProject={refetchProject} tasks={tasks} hasPermission={hasPermission} />
        </Box>
    );
}
