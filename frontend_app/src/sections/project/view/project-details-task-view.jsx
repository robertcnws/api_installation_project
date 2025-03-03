
import { Box } from '@mui/material';

import { KanbanView } from '../kanban/view';




// ----------------------------------------------------------------------

export function ProjectDetailsTaskView({ 
    project, 
    refetchProject, 
    tasks, 
    hasPermission,
    listPermissions, 
}) {

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <KanbanView 
            project={project} 
            refetchProject={refetchProject} 
            tasks={tasks} 
            hasPermission={hasPermission}
            listPermissions={listPermissions} 
            />
        </Box>
    );
}
