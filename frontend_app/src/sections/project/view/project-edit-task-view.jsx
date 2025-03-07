import axios from 'axios';
import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Chip, Stack, Button, IconButton, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { availableTasks } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { useDateRangePicker } from 'src/components/custom-date-range-picker';

import { ProjectTaskShareDialog } from 'src/sections/project/project-task-share-dialog';
import { ProjectDetailsAttachments } from 'src/sections/project/project-details-attachments';
import { ProjectTaskDetailsPriority } from 'src/sections/project/project-task-details-priority';
import { ProjectTaskUserAssigneesList } from 'src/sections/project/project-task-user-assignees-list';

import ProjectEditTaskViewTaskList from './project-edit-task-view-task-list';




export function ProjectEditTaskView({
    projectData,
    setProjectData,
    refetchProjects,
    project,
    tabs,
    shareTask,
    setTableData,
    expanded,
}) {
    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [loadedTasks, setLoadedTasks] = useState([]);

    const [allTasks, setAllTasks] = useState([]);

    useEffect(() => {
        let tasks = []
        if (projectData) {
            tasks = projectData?.projectDefaultTasks?.map((task) => ({
                ...task,
                number: `T-${String(task.project_default_task.order).padStart(3, "0")}`,
            }));
            if (!projectData.hasPermission) {
                tasks = tasks.filter(
                    (task) => task.project_default_task?.project_stage?.name !== CONFIG.stages.permission
                );
            }
            setAllTasks(tasks);
        }
    }, [projectData]);


    useEffect(() => {
        if (projectData) {
            const sortedTasks = availableTasks(projectData, projectData?.projectDefaultTasks, CONFIG);

            setLoadedTasks(sortedTasks);
        }
    }, [projectData]);

    const confirm = useBoolean();

    const [taskData, setTaskData] = useState({
        // currentTask: task || null,
        // currentTaskName: task?.name || '',
        // currentTaskDescription: task?.description || null,
        // currentTaskUsersAssignees: task?.users_assignees || [],
        // currentTaskStage: task?.current_stage || loadedStages[0],
        // currentTaskPriority: task?.priority || 'medium',
        // currentTaskAttachments: task?.project_task_attachments || [],
        // currentTaskStartDate: task?.start_date || projectData?.startDate,
        // currentTaskEndDate: task?.end_date || projectData?.endDate,
        currentTaskProjectId: projectData?.id || '',
    });

    // Manejo de fechas
    const rangePickerTask = useDateRangePicker(
        dayjs(taskData.currentTaskStartDate),
        dayjs(taskData.currentTaskEndDate)
    );

    const handleChangeTaskPriority = useCallback(
        (newValue) => {
            setTaskData({ ...taskData, currentTaskPriority: newValue });
        },
        [taskData]
    );

    const handleChangeTaskName = useCallback(
        (e) => {
            setTaskData({ ...taskData, currentTaskName: e.target.value });
        },
        [taskData]
    );

    // Ajusta el esquema según los campos que realmente uses
    const TaskDialogSchema = zod.object({
        id: zod.string().optional(),
        name: zod.string().min(1, { message: 'Name is required!' }),
        description: schemaHelper.editor().optional().nullable(),
        usersAssignees: zod
            .array(
                zod.object({
                    id: zod.string(),
                    name: zod.string(),
                    firstName: zod.string(),
                    lastName: zod.string(),
                    avatarUrl: zod.string(),
                    username: zod.string(),
                    email: zod.string(),
                    isStaff: zod.boolean(),
                    isActive: zod.boolean(),
                    user_role: zod.object({
                        id: zod.string(),
                        name: zod.string(),
                        description: zod.string(),
                    }).optional(),
                    userRole: zod.object({
                        id: zod.string(),
                        name: zod.string(),
                        description: zod.string(),
                    }).optional(),
                })
            )
            .nonempty({ message: 'Must have at least 1 user!' }),
        projectTaskAttachments: schemaHelper.files({
            requireFiles: false,
        }),
        currentStage: zod.object({
            id: zod.string(),
            name: zod.string(),
            order: zod.number(),
        }),
        priority: zod.string().optional().nullable(),
        // Si quisieras validar startDate y endDate en el esquema, podrías añadirlos:
        // startDate: zod.date().optional(),
        // endDate: zod.date().optional(),
    });

    const defaultValues = useMemo(
        () => ({
            id: taskData.currentTask?.id || '',
            name: taskData.currentTaskName || '',
            description: taskData.currentTaskDescription || null,
            usersAssignees: taskData.currentTaskUsersAssignees || [],
            userReporter: userLogged?.data,
            currentStage: taskData.currentTaskStage || null,
            projectTaskAttachments: taskData.currentTaskAttachments || [],
            priority: taskData.currentTaskPriority || 'medium',
            projectId: taskData.currentTaskProjectId || '',
        }),
        [taskData, userLogged?.data]
    );


    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(TaskDialogSchema),
        defaultValues,
    });

    const {
        watch,
        reset,
        handleSubmit,
        setValue,
        control,
        formState: { isSubmitting },
    } = methods;

    const selectedTask = watch('task');


    const handleAddResetTaskUsersAssignees = useCallback(
        (users) => {
            if (taskData.currentTaskUsersAssignees.length > 0) {
                users = [...taskData.currentTaskUsersAssignees, ...users];
            }

            setTaskData((prev) => ({
                ...prev,
                currentTaskUsersAssignees: users,
            }));
            setValue("usersAssignees", users);
        },
        [setValue, taskData]
    );

    const handleRemoveTaskUserAssignee = useCallback(
        async (userId) => {
            try {
                const promise = axios.delete(
                    `${CONFIG.apiUrl}/projects/delete/project/${taskData.currentTaskProjectId}/task/${taskData.currentTask.id}/user/${userId}/`, {
                    data: {
                        userReporter: userLogged?.data,
                    }
                });
                const response = await promise;
                if (!response.data) {
                    return;
                }
                const newUsersAssignees = taskData.currentTaskUsersAssignees.filter(
                    (user) => user.id !== userId
                );

                setTaskData((prev) => ({
                    ...prev,
                    currentTaskUsersAssignees: newUsersAssignees,
                }));
                setValue("usersAssignees", newUsersAssignees);
                refetchProjects?.();
            } catch (error) {
                console.error(error);
            }
        }, [taskData, setValue, refetchProjects, userLogged?.data]
    );

    const handleStartTask = useCallback(
        async () => {
            const task = selectedTask;
            if (!task) {
                return;
            }
            task.status = 'in progress';
            task.percentage = 50;
            const aTasks = allTasks.map((t) => (t.project_default_task.id === task.project_default_task.id ? task : t));
            setAllTasks(aTasks)
            const lTasks = loadedTasks.map((t) => (t.project_default_task.id === task.project_default_task.id ? task : t));
            setLoadedTasks(lTasks)
            // let foundNotStarted = false;
            // const filteredTasks = aTasks.filter((t) => {
            //     if (t.status !== "not started") return true;
            //     if (!foundNotStarted) {
            //         foundNotStarted = true;
            //         return true;
            //     }
            //     return false;
            // });

            // console.log('filteredTasks', filteredTasks);
            // const newTasks = [...lTasks, ...filteredTasks.filter((t) => !lTasks.find((lt) => lt.project_default_task.id === t.project_default_task.id))];
            // const sortedTasks = newTasks.sort(
            //     (a, b) => a.project_default_task.order - b.project_default_task.order
            // );

            // setLoadedTasks(sortedTasks);
        }
        , [selectedTask, allTasks, loadedTasks]
    );

    const renderAddTaskUsers = (
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
    );

    const renderTaskAttachments = (
        <>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                Attachments
            </Box>

            <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                <Controller
                    name="projectTaskAttachments"
                    control={control}
                    render={({ field }) => (
                        <ProjectDetailsAttachments
                            projectData={projectData}
                            setProjectData={setProjectData}
                            attachments={field.value}
                            onChange={field.onChange}
                            type="task"
                            id={taskData.currentTask?.id}
                            name={taskData.currentTask?.name}
                            data={taskData}
                            setData={setTaskData}
                            setTableData={setTableData}
                            refetchProjects={refetchProjects}
                        />
                    )}
                />
            </Box>
        </>
    );

    return (
        <>
            {/* Importante: Form es un contenedor que debe renderizar un <form onSubmit={...}> internamente */}
            <Form methods={methods} onSubmit={handleSubmit}>
                <Box>
                    <Stack
                        spacing={2.5}
                        justifyContent="center"
                        sx={{ p: 2.5 }}
                    >
                        <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                            Tasks
                        </Box>
                        <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8, display: 'flex', flexDirection: 'row' }}>
                            <Field.Autocomplete
                                name="task"
                                placeholder="Current Task"
                                control={control}
                                options={loadedTasks || []}
                                getOptionLabel={(option) => option.project_default_task.name}
                                sx={{ width: '100%' }}
                                isOptionEqualToValue={(option, value) =>
                                    value.project_default_task.id ? option.project_default_task.id === value.project_default_task.id :
                                        option.project_default_task.id === value.project_default_task._id
                                }
                                renderOption={(props, stage) => (
                                    <li
                                        {...props}
                                        key={stage.project_default_task.id}
                                        style={{
                                            color: stage.status === CONFIG.taskStatus.notStarted ? '#ed6c02' : // warning.main
                                                stage.status === 'in progress' ? '#0288d1' : // info.main
                                                    stage.status === 'finished' ? '#2e7d32' : // success.main
                                                        '#d32f2f' // error.main
                                        }}
                                    >
                                        {stage.number} -- {stage.project_default_task.name} --- <strong> ({stage.status})</strong>
                                    </li>
                                )}
                                renderTags={(selected, getTagProps) =>
                                    selected.map((stage, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={stage.project_default_task.id}
                                            size="small"
                                            variant="soft"
                                            label={stage.project_default_task.name}
                                        />
                                    ))
                                }
                            />
                            <Button
                                variant="soft"
                                color="info"
                                size="medium"
                                startIcon={<Iconify icon="vaadin:start-cog" />}
                                sx={{ ml: 2.5, height: 50 }}
                                disabled={!selectedTask || selectedTask.status !== CONFIG.taskStatus.notStarted}
                                onClick={handleStartTask}
                            >
                                Start Task
                            </Button>
                        </Box>
                    </Stack>
                    <Stack
                        spacing={1}
                        sx={{
                            p: 1,
                            typography: 'caption',
                            textTransform: 'capitalize',
                            ml: 2.5,
                        }}
                        direction="row"
                    >
                        <ProjectEditTaskViewTaskList
                            projectData={projectData}
                            loadedTasks={loadedTasks}
                            setLoadedTasks={setLoadedTasks}
                            allTasks={allTasks}
                            setAllTasks={setAllTasks}
                        />
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
                            Task Assigned Users
                            {renderAddTaskUsers}
                        </Box>
                        <Controller
                            name="usersAssignees"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <>
                                    <Box sx={{ width: expanded ? '40%' : '100%', color: 'text.secondary', mt: -0.8 }}>
                                        {field.value.length > 0 ? (
                                            <Box component="ul" sx={{ pl: 2, pr: 1 }}>
                                                {field.value.map((person, index) => (
                                                    <ProjectTaskUserAssigneesList
                                                        key={`${index}-${person?.id}`}
                                                        project={project}
                                                        // task={task}
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
                                    {error && (
                                        <Typography variant="caption" color="error">
                                            {error.message}
                                        </Typography>
                                    )}
                                </>
                            )}
                        />
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
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <ProjectTaskDetailsPriority
                                        priority={field.value}
                                        onChangePriority={field.onChange}
                                    />
                                )}
                            />
                        </Box>
                    </Stack>
                </Box>
            </Form>

            <ProjectTaskShareDialog
                open={shareTask.value}
                projectData={projectData}
                taskData={taskData}
                handleAddTaskUsersAssignees={handleAddResetTaskUsersAssignees}
                onClose={() => {
                    shareTask.onFalse();
                }}
            />
        </>
    );
}
