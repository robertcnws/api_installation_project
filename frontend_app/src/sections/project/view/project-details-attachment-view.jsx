import { useState, useEffect, useCallback, useContext } from 'react';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDate, fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { Autocomplete, Box, ListItem, MenuItem, Select, Table, TableBody, TableCell, TableRow, TextField } from '@mui/material';
import { Label } from 'src/components/label';
import { useProjectByIdQuery } from 'src/_mock/__projects';
import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import { ProjectEditAttachments } from './project-edit-attachments';
import { ProjectEditTaskAttachments } from './project-edit-task-attachments';

// ----------------------------------------------------------------------

export function ProjectDetailsAttachmentView({ projectId }) {

    const TASK_STATUS_OPTIONS = [
        { value: 'not started', label: 'Not Started Tasks' },
        { value: 'in progress', label: 'In Progress Tasks' },
        { value: 'finished', label: 'Finished Tasks' },
        // { value: 'all', label: 'All Tasks' },
    ];

    const { loadedStages } = useDataContext();

    const { isMobile } = useContext(LoadingContext);

    const { data: project, refetch: refetchProject } = useProjectByIdQuery(projectId, {
        skip: !projectId,
    });

    const [loadedTasks, setLoadedTasks] = useState([]);

    const [selectedTask, setSelectedTask] = useState(null);

    const [filteredTasks, setFilteredTasks] = useState([]);

    const [selectedStatusTask, setSelectedStatusTask] = useState('not started');

    const [newFiles, setNewFiles] = useState([]);

    useEffect(() => {
        if (refetchProject) {
            refetchProject?.();
        }
    }, [refetchProject]);

    useEffect(() => {
        if (project) {
            const tasks = project?.projectDefaultTasks?.map((task) => ({
                ...task,
                number: `T-${String(task.project_default_task.order).padStart(3, "0")}`,
            }));
            const sortedTasks = tasks?.sort(
                (a, b) => a.project_default_task.order - b.project_default_task.order
            );
            let foundNotStarted = false;
            const filtered = sortedTasks?.filter((task) => {
                if (task.status !== "not started") return true;
                if (!foundNotStarted) {
                    foundNotStarted = true;
                    return true;
                }
                return false;
            });
            if (project?.hasPermission) {
                const permissionTasks = tasks?.filter(
                    (task) => task.project_default_task?.project_stage?.name === 'Permission' && task.status === 'not started'
                );
                filtered.push(...permissionTasks);
            }
            setLoadedTasks(filtered);
            setFilteredTasks(filtered.filter((task) => task.status === selectedStatusTask));
        }
    }, [project, selectedStatusTask]);


    const handleChangeSelectedStatusTask = useCallback(
        (event) => {
            const value = event.target.value;
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
                    id={projectId}
                    name={project?.name}
                    type="project"
                    loadedStages={loadedStages}
                    isMobile={isMobile}
                />
            )}
        </Card>
    );

    const renderOverview = (
        <Card sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', maxHeight: 585, overflowY: 'auto' }}>
            <Box component="span" sx={{ width: '100%', color: 'text.secondary', mr: 2, display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                Tasks
                <Select
                    value={selectedStatusTask}
                    onChange={handleChangeSelectedStatusTask}
                    sx={{ ml: 2.5, width: 200, height: 30 }}
                >
                    {TASK_STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </Box>
            <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8, display: 'flex', flexDirection: 'row' }}>
                <Autocomplete
                    options={filteredTasks ?? []}
                    getOptionLabel={(option) =>
                        `${option.project_default_task.project_stage.name} ${option.number} -- ${option.project_default_task.name} (${option.status})`
                    }
                    isOptionEqualToValue={(option, value) =>
                        value.project_default_task.id ? option.project_default_task.id === value.project_default_task.id :
                            option.project_default_task.id === value.project_default_task._id
                    }
                    value={selectedTask ?? null}
                    onChange={handleTaskChange}
                    renderOption={(props, stage, index) => {
                        let icon; let color;
                        if (stage.status === 'not started') {
                            icon = 'mdi:restart-off';
                            color = '#ed6c02'; // color warning
                        } else if (stage.status === 'in progress') {
                            icon = 'carbon:executable-program';
                            color = '#0288d1'; // color info
                        } else if (stage.status === 'finished') {
                            icon = 'rivet-icons:inbox-complete';
                            color = '#2e7d32'; // color success
                        } else {
                            icon = 'material-symbols:sms-failed';
                            color = '#d32f2f'; // color error
                        }

                        return (
                            <li
                                {...props}
                                key={`${stage.project_default_task.id}-${index}-${stage.status}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color,
                                    padding: '4px 8px'
                                }}
                            >
                                <Iconify icon={icon} sx={{ mr: 1 }} />
                                <span>
                                    {stage.project_default_task.project_stage.name} {stage.number} -- {stage.project_default_task.name} <br />
                                    <strong>({stage.status})</strong>
                                </span>
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Select Task" variant="outlined" />
                    )}
                    sx={{ width: '100%' }}
                />
            </Box>
            {selectedTask && (
                <Box sx={{ width: '100%', color: 'text.secondary', mt: 2, display: 'flex', flexDirection: 'row' }}>
                    <ProjectEditTaskAttachments
                        project={project}
                        refetchProject={refetchProject}
                        task={selectedTask}
                        setTask={setSelectedTask}
                        newFiles={newFiles}
                        setNewFiles={setNewFiles}
                        id={projectId}
                        name={project?.name}
                        type="task"
                        isMobile={isMobile}
                    />
                </Box>
            )}
        </Card >
    );

    return (
        <Grid container spacing={3}>
            <Grid xs={12} md={7.5}>
                {renderContent}
            </Grid>

            <Grid xs={12} md={4.5}>
                {renderOverview}

                {/* {renderCompany} */}
            </Grid>
        </Grid>
    );
}
