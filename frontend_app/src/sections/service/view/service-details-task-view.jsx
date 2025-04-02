
import { Box } from '@mui/material';

import { KanbanView } from 'src/sections/service/kanban/view/kanban-view';




// ----------------------------------------------------------------------

export function ServiceDetailsTaskView({ 
    service, 
    refetchService, 
    tasks, 
}) {

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <KanbanView 
            service={service} 
            refetchService={refetchService} 
            tasks={tasks} 
            />
        </Box>
    );
}
