import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import LoadingButton from '@mui/lab/LoadingButton';
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    Box,
    Stack,
    Typography,
    IconButton,
    Avatar,
    TextField,
    Chip,
    Select,
    MenuItem,
} from '@mui/material';
import { CheckBox } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { CONFIG } from 'src/config-global';
import { useBoolean } from 'src/hooks/use-boolean';
import { useProjectByIdQuery } from 'src/_mock/__projects';
import { useDataContext } from 'src/auth/context/data/data-context';
import { Label } from 'src/components/label';
import { ProjectTaskUserAssigneesList } from '../project-task-user-assignees-list';
import { ProjectTaskDetailsPriority } from '../project-task-details-priority';
import { ProjectTaskShareDialog } from '../project-task-share-dialog';




// Ejemplo de componente simplificado sin React Hook Form
export function ProjectEditModalTaskView({ projectId, open, onClose }) {

    const TASK_STATUS_OPTIONS = [
        { value: 'not started', label: 'Not Started Tasks' },
        { value: 'in progress', label: 'In Progress Tasks' },
        { value: 'finished', label: 'Finished Tasks' },
        { value: 'all', label: 'All Tasks' },
    ];

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const {
        loadedProjects,
        refetchProjects,
    } = useDataContext();

    const item = useMemo(() => loadedProjects?.find((p) => p.id === projectId), [loadedProjects, projectId]);

    const { data: project, refetch: refetchProject } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const shareTask = useBoolean();

    const [isTaskStarted, setIsTaskStarted] = useState(false);

    const [loadedTasks, setLoadedTasks] = useState([]);

    const [selectedTask, setSelectedTask] = useState(null);

    const [filteredTasks, setFilteredTasks] = useState([]);

    const [usersAssignees, setUsersAssignees] = useState([]);

    const [priority, setPriority] = useState('');

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
            if (project.hasPermission) {
                const permissionTasks = tasks?.filter(
                    (task) => task.project_default_task?.project_stage?.name === 'Permission' && task.status === 'not started'
                );
                filtered.push(...permissionTasks);
            }
            setLoadedTasks(filtered);
            setFilteredTasks(filtered);
        }
    }, [project]);

    useEffect(() => {
        if (selectedTask) {
            setUsersAssignees(selectedTask.users_assignees || []);
            setPriority(selectedTask.priority || 'medium');
        } else {
            setUsersAssignees([]);
            setPriority('');
        }
    }, [selectedTask]);

    const [selectedStatusTask, setSelectedStatusTask] = useState('not started');

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
        }, [loadedTasks]);

    const handleAddUsers = useCallback(
        async (usersToAdd) => {
            if (!Array.isArray(usersToAdd)) return;

            const filteredToAdd = usersToAdd.filter(
                (user) => !usersAssignees.some((u) => u.id === user.id)
            );

            const newAssignees = [...usersAssignees, ...filteredToAdd];

            const taskId = selectedTask.project_default_task._id;

            try {
                const promise = axios.post(`${CONFIG.apiUrl}/projects/add/project/${projectId}/task/${taskId}/users/`, {
                    usersAssignees: newAssignees,
                    userReporter: userLogged?.data,
                });
                const response = await promise;
                if (response.data) {
                    refetchProject?.();
                    refetchProjects?.();
                    setUsersAssignees(newAssignees);
                }
            } catch (error) {
                console.error(error);
            }

        },
        [usersAssignees, projectId, selectedTask, userLogged, refetchProject, refetchProjects]
    );

    const handleRemoveTaskUserAssignee = useCallback(
        async (userId) => {
            const taskId = selectedTask.project_default_task._id;
            try {
                const promise = axios.delete(
                    `${CONFIG.apiUrl}/projects/delete/project/${projectId}/task/${taskId}/user/${userId}/`, {
                    data: {
                        userReporter: userLogged?.data,
                    }
                });
                const response = await promise;
                if (!response.data) {
                    return;
                }
                const newUsersAssignees = selectedTask.users_assignees.filter(
                    (user) => user.id !== userId
                );
                refetchProject?.();
                refetchProjects?.();
                setUsersAssignees(newUsersAssignees);
            } catch (error) {
                console.error(error);
            }
        }, [selectedTask, projectId, userLogged, refetchProject, refetchProjects]
    );

    const handleTaskChange = useCallback((event, newValue) => {
        setSelectedTask(newValue);
        setUsersAssignees(newValue?.users_assignees || []);
        setPriority(newValue?.priority || 'medium');
        setIsTaskStarted(newValue?.status !== 'not started');
    }, []);


    const handleManageTask = useCallback(
        async (taskType) => {
            const task = selectedTask;
            if (!task) {
                return;
            }
            task.status = taskType === 'start' || taskType === 'rollback' ? 'in progress' : 'finished';
            task.percentage = taskType === 'start' || taskType === 'rollback' ? 50 : 100;

            const taskId = selectedTask.project_default_task._id;
            try {
                const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${projectId}/task/${taskId}/change-status/`, {
                    userReporter: userLogged?.data,
                    status: task.status,
                    percentage: task.percentage,
                });
                const response = await promise;
                if (!response.data) {
                    return;
                }
                refetchProject?.();
                refetchProjects?.();
                const lTasks = loadedTasks.map((t) => (t.project_default_task.id === task.project_default_task.id ? task : t));
                const fTasks = lTasks.filter((t) => t.status === task.status);
                setLoadedTasks(lTasks)
                setSelectedStatusTask(task.status);
                setFilteredTasks(fTasks);
                setIsTaskStarted(true);
                setSelectedTask(task);
            } catch (error) {
                console.error(error);
            }
        }
        , [selectedTask, projectId, userLogged, refetchProject, refetchProjects, loadedTasks]
    );

    const handleUpdate = async () => {
        if (!selectedTask || usersAssignees.length === 0 || !priority) return;
        const payload = {
            taskId: selectedTask.id,
            usersAssignees,
            priority,
        };

        try {
            await axios.post(
                `${CONFIG.apiUrl}/projects/update/project/task/${selectedTask.id}/`,
                payload
            );
            toast.success('Task updated successfully!');
            onClose();
        } catch (error) {
            toast.error('Error updating task');
            console.error(error);
        }
    };

    const isUpdateDisabled = !selectedTask || usersAssignees.length === 0 || !priority || !isTaskStarted || selectedTask?.status === 'finished';

    const renderAddTaskUsers = (
        <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 0.5 }}>
                <IconButton
                    size="small"
                    color="primary"
                    onClick={shareTask.onTrue}
                    sx={{
                        width: 24,
                        height: 24,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                    }}
                >
                    <Iconify icon="mingcute:add-line" />
                </IconButton>
            </Stack>
        </>
    );

    return (
        <>
            <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
                <DialogTitle>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}
                    >
                        <Typography variant="h6">
                            Update Task {project?.name}
                        </Typography>
                        <IconButton onClick={onClose}>
                            <Iconify icon="eva:close-fill" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Box>
                    <Stack
                        spacing={2.5}
                        justifyContent="center"
                        sx={{ p: 2.5 }}
                    >
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
                                    // Determinamos el icono y el color según el estado
                                    let icon; let color;
                                    if (stage.status === 'not started') {
                                        icon = 'mdi:restart-off'; // ejemplo de icono para "not started"
                                        color = '#ed6c02'; // color warning
                                    } else if (stage.status === 'in progress') {
                                        icon = 'carbon:executable-program'; // reemplaza por el icono que prefieras para "in progress"
                                        color = '#0288d1'; // color info
                                    } else if (stage.status === 'finished') {
                                        icon = 'rivet-icons:inbox-complete'; // ejemplo de icono para "finished"
                                        color = '#2e7d32'; // color success
                                    } else {
                                        icon = 'material-symbols:sms-failed'; // icono para estados no previstos
                                        color = '#d32f2f'; // color error
                                    }

                                    return (
                                        <li
                                            {...props}
                                            key={`${stage.project_default_task.id}-${index}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                color,
                                                padding: '4px 8px'
                                            }}
                                        >
                                            {/* Icono a la izquierda */}
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
                            {(selectedTask && selectedTask?.status === 'not started') && (
                                <Button
                                    variant="soft"
                                    color="info"
                                    size="medium"
                                    startIcon={<Iconify icon="vaadin:start-cog" />}
                                    sx={{ ml: 2.5, height: 50 }}
                                    disabled={!selectedTask || selectedTask.status !== 'not started'}
                                    onClick={() => handleManageTask('start')}
                                >
                                    Start Task
                                </Button>
                            )}
                            {(selectedTask && selectedTask?.status !== 'not started' && selectedTask?.status !== 'finished') && (
                                <Button
                                    variant="soft"
                                    color="success"
                                    size="medium"
                                    startIcon={<Iconify icon="octicon:tracked-by-closed-completed-16" />}
                                    sx={{ ml: 2.5, height: 50 }}
                                    disabled={!selectedTask || usersAssignees.length === 0 || !priority}
                                    onClick={() => handleManageTask('finish')}
                                >
                                    Finish Task
                                </Button>
                            )}
                            {(selectedTask && selectedTask?.status === 'finished') && (
                                <Button
                                    variant="soft"
                                    color="warning"
                                    size="medium"
                                    startIcon={<Iconify icon="eos-icons:snapshot-rollback" />}
                                    sx={{ ml: 2.5, height: 50 }}
                                    disabled={!selectedTask || usersAssignees.length === 0 || !priority}
                                    onClick={() => handleManageTask('rollback')}
                                >
                                    Rollback Task
                                </Button>
                            )}
                        </Box>
                    </Stack>

                    {(selectedTask && isTaskStarted && selectedTask?.status !== 'finished') && (
                        <>
                            <Stack
                                spacing={2.5}
                                sx={{
                                    p: 2.5,
                                    typography: 'caption',
                                    textTransform: 'capitalize',
                                    ml: 2.5,
                                    mt: 2.5,
                                }}
                                direction="row"
                            >
                                <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                                    Task Assigned Users
                                    {renderAddTaskUsers}
                                </Box>
                                <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                                    {usersAssignees?.length > 0 ? (
                                        <Box component="ul" sx={{ pl: 2, pr: 1 }}>
                                            {usersAssignees?.map((person) => (
                                                <ProjectTaskUserAssigneesList
                                                    key={person.id}
                                                    task={selectedTask}
                                                    person={person}
                                                    handleRemoveUserAssignee={handleRemoveTaskUserAssignee}
                                                />
                                            ))}
                                        </Box>
                                    ) : (
                                        <Box component="label" sx={{ pl: 2, pr: 1 }}>
                                            <Label color="warning">Add users to task</Label>
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                            <Stack
                                spacing={2.5}
                                sx={{
                                    p: 2.5,
                                    typography: 'caption',
                                    textTransform: 'capitalize',
                                    ml: 2.5,
                                    mt: 2.5,
                                }}
                                direction="row"
                            >
                                <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                                    Priority
                                </Box>
                                <Box sx={{ width: 480, color: 'text.secondary', mt: -0.8 }}>
                                    <ProjectTaskDetailsPriority
                                        project={project}
                                        task={selectedTask}
                                        priority={priority}
                                        setPriority={setPriority}
                                        setSelectedTask={setSelectedTask}
                                    />
                                </Box>
                            </Stack>
                        </>
                    )}
                </Box>
                <DialogActions />
            </Dialog>

            <ProjectTaskShareDialog
                open={shareTask.value}
                projectData={project}
                usersAssignees={usersAssignees}
                handleAddTaskUsersAssignees={handleAddUsers}
                onClose={() => {
                    shareTask.onFalse();
                }}
            />
        </>
    );
}
