import { useState, useCallback, useMemo } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';

import { DashboardContent } from 'src/layouts/dashboard';
import { JOB_DETAILS_TABS, JOB_PUBLISH_OPTIONS } from 'src/_mock';

import { Box } from '@mui/material';

import { Label } from 'src/components/label';

import { useDataContext } from 'src/auth/context/data/data-context';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { ProjectDetailsToolbar } from '../project-details-toolbar';
import { ProjectDetailsContent } from '../project-details-content';
import { ProjectDetailsTasks } from '../project-details-tasks';
import { KanbanView } from '../kanban/view';




// ----------------------------------------------------------------------

export function ProjectDetailsTaskView({ project, refetchProject, tasks, hasPermission }) {

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <KanbanView project={project} refetchProject={refetchProject} tasks={tasks} hasPermission={hasPermission} />
        </Box>
    );
}
