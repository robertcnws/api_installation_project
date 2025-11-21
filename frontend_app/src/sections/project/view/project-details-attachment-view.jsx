import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';

import { availableTasks } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectEditAttachments } from './project-edit-attachments';
import { ProjectDetailsContentOverview } from '../project-details-content-overview';


// ----------------------------------------------------------------------

export function ProjectDetailsAttachmentView({
    project,
    refetchProject,
    listPermissions,
    openDialogs,
    setOpenDialogs,
}) {

    const TASK_STATUS_OPTIONS = [
        { value: 'not started', label: 'Not Started Tasks' },
        { value: 'in progress', label: 'In Progress Tasks' },
        { value: 'finished', label: 'Finished Tasks' },
        // { value: 'all', label: 'All Tasks' },
    ];

    const { loadedStages } = useDataContext();

    const { isMobile } = useContext(LoadingContext);

    const [loadedTasks, setLoadedTasks] = useState([]);

    const [selectedTask, setSelectedTask] = useState(null);

    const [filteredTasks, setFilteredTasks] = useState([]);

    const [selectedStatusTask, setSelectedStatusTask] = useState('not started');

    const [newFiles, setNewFiles] = useState([]);

    const finalStages = useMemo(() => {
        if (loadedStages) {
            const filteredStages = loadedStages.filter(
                (stage) =>
                    stage.name.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1 &&
                    stage.otherName !== null &&
                    stage.otherName !== ''

            );
            if (!project?.hasPermission) {
                return filteredStages.filter((stage) => stage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) === -1);
            }
            return filteredStages;
        }
        return [];
    }, [loadedStages, project?.hasPermission]);

    useEffect(() => {
        if (refetchProject) {
            refetchProject?.();
        }
    }, [refetchProject]);

    useEffect(() => {
        if (project) {
            const filtered = availableTasks(project, project?.projectDefaultTasks, CONFIG);
            const finalTasks = filtered?.filter((task) => task.project_default_task.has_attachments);
            setLoadedTasks(finalTasks);
            setFilteredTasks(finalTasks.filter((task) => task.status === selectedStatusTask));
        }
    }, [project, selectedStatusTask]);


    const handleChangeSelectedStatusTask = useCallback(
        (event) => {
            const { value } = event.target;
            let filtered = [];
            setSelectedStatusTask(event.target.value);
            if (value !== 'all') {
                filtered = loadedTasks.filter((task) => task.status === event.target.value);
            }
            else {
                filtered = loadedTasks;
            }
            setFilteredTasks(filtered);
            setSelectedTask(null);
            setNewFiles([]);
        }, [loadedTasks]);


    const handleTaskChange = useCallback((event, newValue) => {
        setSelectedTask(newValue);
        setNewFiles([]);
    }, []);


    const renderContent = (
        <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
            {project && (
                <ProjectEditAttachments
                    project={project}
                    refetchProject={refetchProject}
                    id={project?.id}
                    name={project?.name}
                    type="project"
                    loadedStages={finalStages}
                    isMobile={isMobile}
                    listPermissions={listPermissions}
                />
            )}
        </Card>
    );

    const renderOverview = (
        // <Card sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', maxHeight: 585, overflowY: 'auto' }}>
        //     <Box component="span" sx={{ width: '100%', color: 'text.secondary', mr: 2, display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
        //         Tasks
        //         <Select
        //             value={selectedStatusTask}
        //             onChange={handleChangeSelectedStatusTask}
        //             sx={{ ml: 2.5, width: 200, height: 30 }}
        //         >
        //             {TASK_STATUS_OPTIONS.map((option) => (
        //                 <MenuItem key={option.value} value={option.value}>
        //                     {option.label}
        //                 </MenuItem>
        //             ))}
        //         </Select>
        //     </Box>
        //     {filteredTasks.length > 0 && (
        //         <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8, display: 'flex', flexDirection: 'row' }}>
        //             <Autocomplete
        //                 options={filteredTasks ?? []}
        //                 getOptionLabel={(option) =>
        //                     `${option.project_default_task.project_stage.name} ${option.number} -- ${option.project_default_task.name} (${option.status})`
        //                 }
        //                 isOptionEqualToValue={(option, value) =>
        //                     value.project_default_task.id ? option.project_default_task.id === value.project_default_task.id :
        //                         option.project_default_task.id === value.project_default_task._id
        //                 }
        //                 value={selectedTask ?? null}
        //                 onChange={handleTaskChange}
        //                 renderOption={(props, stage, index) => {
        //                     let icon; let color;
        //                     if (stage.status === CONFIG.taskStatus.notStarted) {
        //                         icon = 'mdi:restart-off';
        //                         color = '#ed6c02'; // color warning
        //                     } else if (stage.status === 'in progress') {
        //                         icon = 'carbon:executable-program';
        //                         color = '#0288d1'; // color info
        //                     } else if (stage.status === 'finished') {
        //                         icon = 'rivet-icons:inbox-complete';
        //                         color = '#2e7d32'; // color success
        //                     } else {
        //                         icon = 'material-symbols:sms-failed';
        //                         color = '#d32f2f'; // color error
        //                     }

        //                     return (
        //                         <ListItem
        //                             {...props}
        //                             key={`${stage.project_default_task.id}-${index}-${stage.status}`}
        //                             style={{
        //                                 display: 'flex',
        //                                 alignItems: 'center',
        //                                 color,
        //                                 padding: '4px 8px'
        //                             }}
        //                         >
        //                             <Iconify icon={icon} sx={{ mr: 1 }} />
        //                             <span>
        //                                 {stage.project_default_task.project_stage.name} {stage.number} -- {stage.project_default_task.name} <br />
        //                                 <strong>({stage.status})</strong>
        //                             </span>
        //                         </ListItem>
        //                     );
        //                 }}
        //                 renderInput={(params) => (
        //                     <TextField {...params} label="Select Task" variant="outlined" />
        //                 )}
        //                 sx={{ width: '100%' }}
        //             />
        //         </Box>
        //     )}
        //     {selectedTask && (
        //         <Box sx={{ width: '100%', color: 'text.secondary', mt: 2, display: 'flex', flexDirection: 'row' }}>
        //             <ProjectEditTaskAttachments
        //                 project={project}
        //                 refetchProject={refetchProject}
        //                 task={selectedTask}
        //                 setTask={setSelectedTask}
        //                 newFiles={newFiles}
        //                 setNewFiles={setNewFiles}
        //                 id={projectId}
        //                 name={project?.name}
        //                 type="task"
        //                 isMobile={isMobile}
        //                 listPermissions={listPermissions}
        //             />
        //         </Box>
        //     )}
        // </Card >
        <ProjectDetailsContentOverview
            project={project}
            listPermissions={listPermissions}
            openDialogs={openDialogs}
            setOpenDialogs={setOpenDialogs}
        />
    );

    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={8}>
                {renderContent}
            </Grid>

            <Grid xs={12} md={4}>
                {renderOverview}

                {/* {renderCompany} */}
            </Grid>
        </Grid>
    );
}
