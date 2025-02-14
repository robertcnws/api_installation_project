import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { stripHtmlUsingDOM } from 'src/utils/helper';
import axios from 'axios';
import { CONFIG } from 'src/config-global';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import LoadingButton from '@mui/lab/LoadingButton';
import { Box, Stack, Button, Tooltip, IconButton, Chip, Typography } from '@mui/material';
import { varAlpha } from 'src/theme/styles';
import dayjs from 'dayjs';
import { CustomDateRangePicker, useDateRangePicker } from 'src/components/custom-date-range-picker';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { ProjectTaskDetailsPriority } from './project-task-details-priority';
import { ProjectTaskUserAssigneesList } from './project-task-user-assignees-list';
import { KanbanInputName } from '../kanban/components/kanban-input-name';
import { ProjectDetailsAttachments } from './project-details-attachments';
import { ProjectTaskShareDialog } from './project-task-share-dialog';



export function ProjectTaskDetails({
    projectData,
    setProjectData,
    refetchProjects,
    project,
    task,
    tabs,
    loadedStages,
    shareTask,
    handleRemoveTask,
    setTableData,
    expanded,
}) {
    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);
    
    const confirm = useBoolean();

    const [taskData, setTaskData] = useState({
        currentTask: task || null,
        currentTaskName: task?.name || '',
        currentTaskDescription: task?.description || null,
        currentTaskUsersAssignees: task?.users_assignees || [],
        currentTaskStage: task?.current_stage || loadedStages[0],
        currentTaskPriority: task?.priority || 'medium',
        currentTaskAttachments: task?.project_task_attachments || [],
        currentTaskStartDate: task?.start_date || projectData?.startDate,
        currentTaskEndDate: task?.end_date || projectData?.endDate,
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


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', stripHtmlUsingDOM(data.description));
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('usersAssignees', JSON.stringify(data.usersAssignees));

        // Manejas las fechas directamente con rangePickerTask
        formData.append('startDate', new Date(rangePickerTask.startDate).toISOString());
        formData.append('endDate', new Date(rangePickerTask.endDate).toISOString());

        formData.append('currentStage', JSON.stringify(data.currentStage));
        formData.append('priority', data.priority);
        formData.append('projectId', projectData?.id);

        if (data.projectTaskAttachments && data.projectTaskAttachments.length > 0) {
            data.projectTaskAttachments.forEach((file) => {
                if (file instanceof File) {
                    formData.append('projectTaskAttachments', file);
                }
            });
        }

        const url = task ? `${CONFIG.apiUrl}/projects/update/project/task/${task.id}/` : `${CONFIG.apiUrl}/projects/create/project/task/`;

        const promise = axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: task ? `Update task (${data.name}) success!` : `Create task (${data.name}) success!`,
                error: task ? `Update task (${data.name}) error!` : `Create task (${data.name}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            if (task) {
                setProjectData((prev) => ({
                    ...prev,
                    projectTasks: prev.projectTasks.map((t) =>
                        t.id === response.data.data.id ? response.data.data : t
                    ),
                }));
            }
            else {
                setProjectData((prev) => ({
                    ...prev,
                    projectTasks: [...prev.projectTasks, response.data.data],
                }));
            }

            refetchProjects?.();

            reset();

            if (task) {
                tabs.onChange(null, 'overview');
            }

        } catch (error) {
            console.error(error);
        }
    });

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
            <Form methods={methods} onSubmit={onSubmit}>
                <Box>
                    <Stack
                        spacing={2.5}
                        justifyContent="center"
                        sx={{ p: 2.5, bgcolor: 'background.neutral' }}
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <>
                                    <KanbanInputName
                                        {...field}
                                        placeholder="Task name"
                                        value={field.value}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            field.onChange(newValue);
                                        }}
                                        onBlur={field.onBlur}
                                        inputProps={{ id: `input-task-${task?.name}` }}
                                    />
                                    {error && <Typography color="error">{error.message}</Typography>}
                                </>
                            )}
                        />
                    </Stack>

                    {/* Eliminamos el Controller de "dueDate". Solo mostramos los botones/calendarios. */}
                    <Stack
                        spacing={2.5}
                        sx={{
                            p: 2.5,
                            bgcolor: 'background.neutral',
                            typography: 'caption',
                            textTransform: 'capitalize',
                            ml: 2.5,
                            mt: 2.5,
                        }}
                        direction="row"
                    >
                        <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                            Task Due Date
                        </Box>

                        {/* Simplemente usas el rangePickerTask */}
                        <Box sx={{ width: 180, color: 'text.secondary', mt: -0.8 }}>
                            {rangePickerTask.selected ? (
                                <Button size="small" onClick={rangePickerTask.onOpen}>
                                    {rangePickerTask.shortLabel}
                                </Button>
                            ) : (
                                <Tooltip title="Add due date">
                                    <IconButton
                                        onClick={rangePickerTask.onOpen}
                                        sx={{
                                            bgcolor: (theme) =>
                                                varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                                            border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                                        }}
                                    >
                                        <Iconify icon="mingcute:add-line" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>

                        <CustomDateRangePicker
                            variant="calendar"
                            title={
                                task
                                    ? `Choose due date for task (${projectData.number})`
                                    : `Choose due date for new task`
                            }
                            startDate={rangePickerTask.startDate}
                            endDate={rangePickerTask.endDate}
                            onChangeStartDate={rangePickerTask.onChangeStartDate}
                            onChangeEndDate={rangePickerTask.onChangeEndDate}
                            open={rangePickerTask.open}
                            onClose={rangePickerTask.onClose}
                            selected={rangePickerTask.selected}
                            error={rangePickerTask.error}
                        />
                    </Stack>

                    <Stack
                        spacing={2.5}
                        sx={{
                            p: 2.5,
                            bgcolor: 'background.neutral',
                            typography: 'caption',
                            textTransform: 'capitalize',
                            ml: 2.5,
                            mt: 2.5,
                        }}
                        direction="row"
                    >
                        <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                            Task Description
                        </Box>
                        <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                            <Field.Editor name="description" placeholder="Description..." />
                        </Box>
                    </Stack>

                    <Stack
                        spacing={2.5}
                        sx={{
                            p: 2.5,
                            bgcolor: 'background.neutral',
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
                                                        task={task}
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
                            bgcolor: 'background.neutral',
                            typography: 'caption',
                            textTransform: 'capitalize',
                            ml: 2.5,
                            mt: 2.5,
                        }}
                        direction="row"
                    >
                        <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                            Current Stage
                        </Box>
                        <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                            <Field.Autocomplete
                                name="currentStage"
                                placeholder="Current Stage"
                                // disableCloseOnSelect
                                options={loadedStages || []}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) =>
                                    value.id ? option.id === value.id : option.id === value._id
                                }
                                renderOption={(props, stage) => (
                                    <li {...props} key={stage.id}>
                                        {stage.name}
                                    </li>
                                )}
                                renderTags={(selected, getTagProps) =>
                                    selected.map((stage, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={stage.id}
                                            size="small"
                                            variant="soft"
                                            label={stage.name}
                                        />
                                    ))
                                }
                            />
                        </Box>
                    </Stack>

                    <Stack
                        spacing={2.5}
                        sx={{
                            p: 2.5,
                            bgcolor: 'background.neutral',
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

                    <Stack
                        spacing={2.5}
                        sx={{
                            p: 2.5,
                            bgcolor: 'background.neutral',
                            typography: 'caption',
                            textTransform: 'capitalize',
                            ml: 2.5,
                            mt: 2.5,
                        }}
                        direction="row"
                    >
                        {renderTaskAttachments}
                    </Stack>

                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'row', width: expanded ? '40%' : '100%', justifyContent: 'flex-end' }}>
                        <LoadingButton
                            fullWidth
                            loading={isSubmitting}
                            type="submit"
                            variant="soft"
                            color="primary"
                            size="medium"
                            startIcon={task ? <Iconify icon="solar:server-square-update-bold" /> : <Iconify icon="oui:ml-create-multi-metric-job" />}
                            sx={{ mr: 2.5 }}
                        >
                            {task ? 'Update Task' : 'Create Task'}
                        </LoadingButton>

                        {task && (
                            <Button
                                fullWidth
                                variant="soft"
                                color="error"
                                size="medium"
                                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                                sx={{ mr: 2.5 }}
                                onClick={confirm.onTrue}
                            >
                                Delete Task
                            </Button>
                        )}

                        <Button
                            fullWidth
                            variant="soft"
                            color="warning"
                            size="medium"
                            startIcon={<Iconify icon="material-symbols:cancel" />}
                            onClick={(e) => {
                                tabs.onChange(e, 'overview');
                                setProjectData({ ...projectData, currentTask: null });
                            }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Form>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title="Remove Task"
                content={
                    <>
                        Are you sure want to delete task <strong> {task?.name} </strong> from <strong> {projectData?.name} </strong>?
                    </>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={(e) => {
                            handleRemoveTask(task.id);
                            confirm.onFalse();
                            tabs.onChange(e, 'overview');
                        }}
                    >
                        Remove
                    </Button>
                }
            />

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
