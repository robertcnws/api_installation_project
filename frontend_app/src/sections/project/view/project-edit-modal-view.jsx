import axios from 'axios';
import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Grid, Avatar, Dialog, Tooltip, MenuItem, MenuList, DialogTitle, DialogActions } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';

import { stripHtmlUsingDOM } from 'src/utils/helper';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { useDateRangePicker, CustomDateRangePicker } from 'src/components/custom-date-range-picker';

import { ProjectShareDialog } from 'src/sections/project/project-share-dialog';
import { KanbanInputName } from 'src/sections/project/kanban/components/kanban-input-name';
import { ProjectUserAssigneesList } from 'src/sections/project/project-user-assignees-list';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';



// ----------------------------------------------------------------------

export function ProjectEditModalView({
    projectId,
    open,
    onClose,
}) {

    const {
        loadedProjects,
        loadedUsers,
        loadedProjectPermissions,
        loadedStages,
        loadedStagesTask,
        setTableData,
        refetchProjects,
        refetchSalesOrders,
    } = useDataContext();

    const item = useMemo(() => loadedProjects?.find((project) => project.id === projectId), [loadedProjects, projectId]);

    const cleanLoadedUsers = useMemo(() => loadedUsers.map(({ __typename, ...rest }) => rest), [loadedUsers]);

    const { isMobile } = useContext(LoadingContext);

    const router = useRouter();

    const confirm = useBoolean();

    const tabs = useTabs('overview');

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const rangePicker = useDateRangePicker(
        item?.startDate ? dayjs(item?.startDate) : dayjs(new Date()),
        item?.endDate ? dayjs(item?.endDate) : dayjs(new Date())
    );

    const popover = usePopover();

    const toggleMainInfo = useBoolean(true);

    const share = useBoolean();

    const { data: itemById } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [projectData, setProjectData] = useState({})

    // useEffect(() => {
    //   if (refetchItemById) {
    //     refetchItemById();
    //   }
    //   setProjectData(itemById || {});
    // }, [refetchItemById, itemById]);

    useEffect(() => {
        if (itemById) {
            setProjectData((prev) => ({
                ...prev,
                id: itemById?.id || '',
                name: itemById?.name || '',
                number: itemById?.number || '',
                description: itemById?.description || '',
                startDate: itemById?.startDate || null,
                endDate: itemById?.endDate || null,
                address: itemById?.address || '',
                usersAssignees: itemById?.usersAssignees || [],
                userManager:
                    itemById?.userManager && Object.keys(itemById.userManager).length > 0
                        ? cleanLoadedUsers.find(u => u.id === itemById?.userManager?.id)
                        : null,
                projectAttachments: itemById?.projectAttachments || [],
                projectTasks: itemById?.projectTasks || [],
                projectDefaultTasks: itemById?.projectDefaultTasks || [],
                projectComments: itemById?.projectComments || [],
                hasPermission: itemById?.hasPermission || false,
                currentStage: itemById?.currentStage || null,
                currentTask: null,
            }));
        }
    }, [itemById, setProjectData, cleanLoadedUsers]);

    const handleReturnList = useCallback(() => {
        router.push(paths.dashboard.project.list);
    }, [router]);


    const handleChangeProjectName = useCallback((event) => {
        const name = event.target.value;
        if (name.length > 0) {
            setProjectData({ ...projectData, name });
        }
        else {
            setProjectData({ ...projectData, name: item.name });
        }
    }, [projectData, item]);



    const handleRemoveUserAssignee = useCallback(
        async (userId) => {
            try {
                const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${item.id}/user/${userId}/`, {
                    data: {
                        userReporter: userLogged?.data,
                    },
                });
                const response = await promise;
                if (response.data) {
                    const newUsersAssignees = projectData.usersAssignees.filter((user) => user.id !== userId);
                    setProjectData({ ...projectData, usersAssignees: newUsersAssignees });
                    refetchProjects?.();
                }
            } catch (error) {
                console.error(error);
            }
        }, [projectData, item, refetchProjects, userLogged]
    );

    const handleDeleteItem = useCallback(
        async (id) => {

            const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${id}/`, {
                data: {
                    userReporter: userLogged?.data,
                }
            });

            const response = await promise;

            toast.success('Delete success!');

            refetchProjects?.();

            refetchSalesOrders?.();

            router.push(paths.dashboard.project.list);

        },
        [refetchSalesOrders, refetchProjects, userLogged, router]
    );

    const ProjectDialogSchema = zod.object({
        name: zod.string().min(1, { message: 'Name is required!' }),
        description: schemaHelper.editor().optional().nullable(),
        userManager: zod.object({
            id: zod.string(),
            name: zod.string(),
            firstName: zod.string(),
            lastName: zod.string(),
            avatarUrl: zod.string(),
            username: zod.string(),
            email: zod.string(),
            isStaff: zod.boolean(),
            isActive: zod.boolean(),
            project_permissions: zod.array(zod.any()).optional(),
        }).refine(
            (data) => data.id !== '', { message: 'User Manager is required!' }
        ),
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
                    project_permissions: zod.array(zod.any()).optional(),
                })
            )
            .nonempty({ message: 'Must have at least 1 user!' }),
        hasPermission: zod.boolean(),
        projectDefaultTasks: zod.array(zod.any()).optional(),
        projectComments: zod.array(zod.any()).optional(),
        address: zod.string().min(1, { message: 'Address is required!' }),
        currentStage: zod.object({
            id: zod.string(),
            name: zod.string(),
            order: zod.number(),
        }),
    });

    const defaultValues = useMemo(
        () => ({
            id: itemById?.id || '',
            name: itemById?.name || '',
            number: itemById?.number || '',
            description: itemById?.description || '',
            usersAssignees: itemById?.usersAssignees || [],
            userManager:
                itemById?.userManager && Object.keys(itemById.userManager).length > 0
                    ? cleanLoadedUsers.find(u => u.id === itemById?.userManager?.id)
                    : null,
            userReporter: userLogged?.data,
            startDate: itemById?.startDate || null,
            endDate: itemById?.endDate || null,
            projectAttachments: itemById?.projectAttachments || [],
            hasPermission: itemById?.hasPermission || false,
            projectDefaultTasks: itemById?.projectDefaultTasks || [],
            projectComments: itemById?.projectComments || [],
            address: itemById?.address || '',
            currentStage: itemById?.currentStage || null,
        }),
        [itemById, userLogged, cleanLoadedUsers]
    );

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(ProjectDialogSchema),
        defaultValues,
    });

    const {
        reset,
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { isSubmitting },
    } = methods;


    useEffect(() => {
        if (itemById) {
            const validUserManager = cleanLoadedUsers.find(
                (user) => user.id === itemById?.userManager?.id
            ) || null;
            reset({
                id: itemById.id || '',
                name: itemById.name || '',
                number: itemById.number || '',
                description: itemById.description || '',
                usersAssignees: itemById.usersAssignees || [],
                userManager: validUserManager,
                userReporter: userLogged?.data,
                startDate: itemById.startDate || null,
                endDate: itemById.endDate || null,
                projectAttachments: itemById.projectAttachments || [],
                hasPermission: itemById.hasPermission || false,
                projectDefaultTasks: itemById.projectDefaultTasks || [],
                projectComments: itemById.projectComments || [],
                address: itemById.address || '',
                currentStage: itemById.currentStage || null,
            });
        }
    }, [itemById, userLogged?.data, reset, cleanLoadedUsers]);

    const userManager = watch("userManager");

    const usersAssignees = watch('usersAssignees');

    const filteredUsers = useMemo(() => cleanLoadedUsers.filter(user => user.id !== userManager?.id), [cleanLoadedUsers, userManager]);

    const filteredUsersManager = useMemo(() => {
        const assigneesArray = Array.isArray(usersAssignees) ? usersAssignees : [];
        return cleanLoadedUsers.filter(user => !assigneesArray.some(u => u.id === user.id));
    }, [cleanLoadedUsers, usersAssignees]);

    const handleTabChange = (event, newValue) => {
        tabs.onChange(event, newValue);
        setProjectData((prev) => ({
            ...prev,
            currentTask: null,
        }));
    };

    const handleRemoveTask = useCallback(
        async (taskId) => {
            try {
                const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${item.id}/task/${taskId}/`, {
                    data: {
                        userReporter: userLogged?.data,
                    },
                });
                const response = await promise;
                if (response.data) {
                    const newTasks = projectData.projectTasks.filter((task) => task.id !== taskId);
                    setProjectData({ ...projectData, projectTasks: newTasks });
                    refetchProjects?.();
                }
            } catch (error) {
                console.error(error);
            }
        }, [projectData, item, refetchProjects, userLogged]
    );


    const handleAddResetUsersAssignees = useCallback(
        async (users) => {
            let updatedUsers = users;
            if (projectData.usersAssignees.length > 0) {
                updatedUsers = [
                    ...projectData.usersAssignees,
                    ...users.filter((user) => !projectData.usersAssignees.some((u) => u.id === user.id)),
                ];
            }
            try {
                const promise = axios.post(`${CONFIG.apiUrl}/projects/add/project/${item.id}/users/`, {
                    usersAssignees: updatedUsers,
                    userReporter: userLogged?.data,
                });
                const response = await promise;
                if (response.data) {
                    setProjectData((prev) => ({ ...prev, usersAssignees: updatedUsers }));
                    setValue("usersAssignees", updatedUsers, { shouldValidate: true, shouldDirty: true });
                }
            } catch (error) {
                console.error(error);
            }
        },
        [setValue, projectData, item, userLogged]
    );


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', stripHtmlUsingDOM(data.description));
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('usersAssignees', JSON.stringify(data.usersAssignees));
        formData.append('userManager', JSON.stringify(data.userManager));
        formData.append('hasPermission', data.hasPermission);

        formData.append('startDate', new Date(rangePicker.startDate).toISOString());
        formData.append('endDate', new Date(rangePicker.endDate).toISOString());

        formData.append('currentStage', JSON.stringify(data.currentStage));
        formData.append('address', data.address);

        formData.append('projectDefaultTasks', JSON.stringify(data.projectDefaultTasks));
        formData.append('projectComments', JSON.stringify(data.projectComments));

        if (data.projectAttachments && data.projectAttachments.length > 0) {
            data.projectAttachments.forEach((file) => {
                if (file instanceof File) {
                    formData.append('projectAttachments', file);
                }
            });
        }

        const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${item.id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Project (${data.name}) success!`,
                error: `Update Project (${data.name}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            setProjectData((prev) => ({
                ...prev,
                name: data.name,
                description: data.description,
                usersAssignees: data.usersAssignees,
                userManager: data.userManager,
                startDate: data.startDate,
                endDate: data.endDate,
                currentStage: data.currentStage,
                address: data.address,
                projectAttachments: data.projectAttachments,
                hasPermission: data.hasPermission,
            }));

            refetchProjects?.();

            // reset();

            onClose();

        } catch (error) {
            console.error(error);
        }
    });

    const renderAddUsers = (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 0.5 }}>
            <IconButton
                size="small"
                color="primary"
                onClick={share.onTrue}
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

    const renderMainInfo = (
        <Stack spacing={1.5}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ typography: 'subtitle2' }}
            >
                Main Info
                <IconButton size="small" onClick={toggleMainInfo.onToggle}>
                    <Iconify
                        icon={toggleMainInfo.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                    />
                </IconButton>
            </Stack>

            {toggleMainInfo.value && (
                <>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12}>
                            <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
                                <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                                    Estimated Dates
                                </Box>
                                <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                                    {rangePicker.selected ? (
                                        <>
                                            <Button size="small" onClick={rangePicker.onOpen}>
                                                {rangePicker.shortLabel}
                                            </Button>
                                            <Button size="small" onClick={rangePicker.onOpen} sx={{ ml: 1, mt: -1 }}>
                                                <Iconify icon="eva:calendar-outline" />
                                            </Button>
                                        </>
                                    ) : (
                                        <Tooltip title="Add due date">
                                            <IconButton
                                                onClick={rangePicker.onOpen}
                                                sx={{
                                                    bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
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
                                    title={!isMobile ? (
                                        <>
                                            <Box>
                                                <Typography variant="h5">{projectData.number}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                                                <Typography variant="h6">Estimated Schedule Install Date</Typography>
                                                <Typography variant="h6" sx={{ ml: 10 }}>Estimated Due Date</Typography>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Box>
                                                <Typography variant="h5">{projectData.number}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'center' }}>
                                                <Typography variant="h6">Estimated (Schedule Install & Due) Dates</Typography>
                                            </Box>
                                        </>
                                    )}
                                    startDate={rangePicker.startDate}
                                    endDate={rangePicker.endDate}
                                    onChangeStartDate={rangePicker.onChangeStartDate}
                                    onChangeEndDate={rangePicker.onChangeEndDate}
                                    open={rangePicker.open}
                                    onClose={rangePicker.onClose}
                                    selected={rangePicker.selected}
                                    error={rangePicker.error}
                                />
                                <Box sx={{ width: !isMobile ? '10%' : '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 5 : 1 }}>
                                    <Stack spacing={0} sx={{ typography: 'caption', textTransform: 'capitalize', mt: 0, mr: 0 }}>
                                        <Typography variant="subtitle2" />
                                        <Controller
                                            name="hasPermission"
                                            control={control}
                                            defaultValue={false}
                                            render={({ field: { onChange, value, ref } }) => (
                                                <Field.Switch
                                                    name="hasPermission"
                                                    labelPlacement="start"
                                                    label={
                                                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'warning.main' }}>
                                                            Need Permission?
                                                        </Typography>
                                                    }
                                                    sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
                                                    onChange={(e) => onChange(e.target.checked)}
                                                />
                                            )}
                                        />
                                    </Stack>
                                </Box>
                            </Stack>
                            <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize', mt: 2 }}>
                                <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                                    Address
                                </Box>
                                <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                                    <Field.Text name="address" placeholder="Ex: 1234 Main St..." />
                                </Box>
                            </Stack>
                            <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize', mt: 2 }}>
                                <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                                    Description
                                </Box>
                                <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                                    <Field.Text name="description" placeholder="Description" multiline rows={3} />
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={12}>

                            <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize', mt: 2, mr: 4 }}>
                                <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
                                    Assigned Users
                                    {renderAddUsers}
                                </Box>
                                <Controller
                                    name="usersAssignees"
                                    control={control}
                                    render={({ field, fieldState: { error } }) => (
                                        <Box sx={{ width: '100%', color: !error ? 'text.secondary' : 'error.main', mt: -0.8 }}>
                                            {field.value.length > 0 ? (
                                                <Box
                                                    component="ul"
                                                    sx={{
                                                        pl: 2,
                                                        pr: 1,
                                                        maxHeight: !isMobile ? 250 : '100%',
                                                        overflowY: !isMobile ? 'auto' : 'hidden',
                                                        color: !error ? 'default' : 'error.main',
                                                    }}
                                                >
                                                    {field.value.map((person, index) => (
                                                        <ProjectUserAssigneesList
                                                            key={`${index}-${person?.id}`}
                                                            project={itemById}
                                                            person={person}
                                                            setProjectData={setProjectData}
                                                            setValue={setValue}
                                                            watch={watch}
                                                            loadedProjectPermissions={loadedProjectPermissions}
                                                            handleRemoveUserAssignee={handleRemoveUserAssignee}
                                                        />
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Box component="label" sx={{ pl: 2, pr: 1 }}>
                                                    <Label color={error ? "error" : "warning"} sx={{ marginTop: 5, marginLeft: 1 }}>Add users to project</Label>
                                                </Box>
                                            )}
                                            {error && (
                                                <Typography variant="caption" color="error">
                                                    {error.message}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
                        <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }} />

                    </Stack>
                </>
            )}
        </Stack>
    );


    const renderProject = (
        <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
            <DialogTitle>Update Project {projectData?.name} </DialogTitle>

            <Form methods={methods} onSubmit={onSubmit}>

                <Stack
                    spacing={2.5}
                    justifyContent="center"
                    sx={{ p: 2.5 }}
                >

                    <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>
                        <Box sx={{ flexDirection: 'row', display: 'flex', width: !isMobile ? '70%' : '100%' }}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field, fieldState: { error } }) => (
                                    <Box sx={{ flexDirection: 'column', display: 'flex', width: '100%' }}>
                                        <KanbanInputName
                                            {...field}
                                            placeholder="Project name"
                                            value={field.value}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                field.onChange(newValue);
                                            }}
                                            onBlur={field.onBlur}
                                            inputProps={{ id: `input-task-${projectData?.name}` }}
                                            sx={{ borderColor: error ? 'error.main' : 'grey.500', width: '100%', height: 55 }}
                                            error={error}
                                        />
                                        {error && <Typography color="error" sx={{ fontSize: 'small' }}>{error.message}</Typography>}
                                    </Box>
                                )}

                            />
                        </Box>

                        <Box sx={{ width: !isMobile ? '40%' : '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                            <Field.Autocomplete
                                name="userManager"
                                placeholder="Responsable"
                                control={control}
                                label="Responsable"
                                value={watch("userManager") || null}
                                options={filteredUsersManager || []}
                                getOptionLabel={(option) => (
                                    option.name
                                ) || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(event, newValue) => {
                                    setValue("userManager", newValue);
                                    if (newValue !== null) {
                                        const oldAssignees = watch("usersAssignees") || [];
                                        const filteredAssignees = oldAssignees.filter(user => user.id !== newValue.id);
                                        setValue("usersAssignees", filteredAssignees);
                                    }
                                }}
                                renderOption={(props, user) => (
                                    <li {...props} key={user.id}>
                                        <Avatar
                                            key={user.id}
                                            alt={user.avatarUrl}
                                            src={user.avatarUrl}
                                            sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                                        />

                                        {user.name}
                                    </li>
                                )}
                                renderTags={(selected, getTagProps) =>
                                    selected.map((user, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={user.id}
                                            size="small"
                                            variant="soft"
                                            label={user.name}
                                            avatar={<Avatar alt={user.name} src={user.avatarUrl} />}
                                        />
                                    ))
                                }
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    {renderMainInfo}


                </Stack>
                {open && (
                    <DialogActions>
                        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                            Update
                        </LoadingButton>
                        <Button variant="outlined" onClick={onClose}>
                            Cancel
                        </Button>
                    </DialogActions>
                )}
            </Form>
        </Dialog>
    )

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
            </Box>
            {/* </Drawer > */}

            <ProjectShareDialog
                open={share.value}
                shared={item?.shared}
                loadedUsers={filteredUsers}
                loadedProjectPermissions={loadedProjectPermissions}
                projectData={projectData}
                handleAddUsersAssignees={handleAddResetUsersAssignees}
                onClose={() => {
                    share.onFalse();
                }}
            />

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title="Delete Project"
                content={
                    <>
                        Are you sure want to delete project <strong> {item?.name} </strong>?
                    </>
                }
                action={
                    <Button variant="contained" color="error" onClick={() => handleDeleteItem(itemById?.id)}>
                        Delete
                    </Button>
                }
            />

            <CustomPopover
                open={popover.open}
                anchorEl={popover.anchorEl}
                onClose={popover.onClose}
                slotProps={{ arrow: { placement: 'right-top' } }}
            >
                <MenuList>
                    {tabs.value === 'overview' && (
                        <MenuItem
                            onClick={() => {
                                handleSubmit(onSubmit)();
                                popover.onClose();
                            }}
                        >
                            <Button type="submit" variant="contained">
                                <Iconify icon="solar:server-square-update-bold" />
                                Update Project
                            </Button>
                        </MenuItem>
                    )}
                    <MenuItem
                        onClick={() => {
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="bi:kanban" />
                        Kanban View
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            popover.onClose();
                            handleReturnList();
                        }}
                    >
                        <Iconify icon="material-symbols:cancel" />
                        Cancel
                    </MenuItem>
                    <Divider sx={{ borderStyle: 'dashed' }} />
                    <MenuItem
                        onClick={() => {
                            confirm.onTrue();
                            popover.onClose();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                        Delete Project
                    </MenuItem>
                </MenuList>
            </CustomPopover>


        </>
    );
}
