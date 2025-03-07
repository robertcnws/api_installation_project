import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Avatar, Dialog, DialogTitle, DialogActions } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';

import { CONFIG } from 'src/config-global';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { toast } from 'src/components/snackbar';
import { usePopover } from 'src/components/custom-popover';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';


// ----------------------------------------------------------------------

export function ProjectEditModalUserManagerView({
    isEdit,
    projectId,
    open,
    onClose,
}) {

    const {
        loadedProjects,
        loadedUsers,
        loadedProjectPermissions,
    } = useDataContext();

    const item = useMemo(() => loadedProjects?.find((project) => project.id === projectId), [loadedProjects, projectId]);

    const cleanLoadedUsers = useMemo(() => loadedUsers.map(({ __typename, ...rest }) => rest), [loadedUsers]);

    const { isMobile } = useContext(LoadingContext);

    const router = useRouter();

    const tabs = useTabs('overview');

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const popover = usePopover();

    const { data: itemById } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [projectData, setProjectData] = useState({})

    useEffect(() => {
        if (itemById) {
            setProjectData((prev) => ({
                ...prev,
                id: itemById?.id || '',
                name: itemById?.name || '',
                number: itemById?.number || '',
                userManager:
                    itemById?.userManager && Object.keys(itemById.userManager).length > 0
                        ? cleanLoadedUsers.find(u => u.id === itemById?.userManager?.id)
                        : null,
            }));
        }
    }, [itemById, setProjectData, cleanLoadedUsers]);

    const handleReturnList = useCallback(() => {
        router.push(paths.dashboard.project.list);
    }, [router]);

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
        }).refine(
            (data) => data.id !== '', { message: 'User Manager is required!' }
        ),
    });

    const defaultValues = useMemo(
        () => ({
            id: itemById?.id || '',
            name: itemById?.name || '',
            number: itemById?.number || '',
            userManager:
                itemById?.userManager && Object.keys(itemById.userManager).length > 0
                    ? cleanLoadedUsers.find(u => u.id === itemById?.userManager?.id)
                    : null,
        }),
        [itemById, cleanLoadedUsers]
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
                userManager: validUserManager,
            });
        }
    }, [itemById, userLogged?.data, reset, cleanLoadedUsers]);

    const userManager = watch("userManager");

    const usersAssignees = watch('usersAssignees');

    const filteredUsersManager = useMemo(() => {
        const assigneesArray = Array.isArray(usersAssignees) ? usersAssignees : [];
        return cleanLoadedUsers.filter(user => !assigneesArray.some(u => u.id === user.id));
    }, [cleanLoadedUsers, usersAssignees]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const projectPermissions = [];

        const permission = loadedProjectPermissions?.find(
            (perm) => perm.name.toLowerCase().indexOf(CONFIG.projectPermissions.fullAccess.toLowerCase()) !== -1
        );

        if (permission) {
            projectPermissions.push(permission);
        }

        const manager = {
            ...data.userManager,
            project_permissions: projectPermissions,
        };

        formData.append('userManager', JSON.stringify(manager));

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

            // refetchProjects?.();

            // reset();

            onClose();

        } catch (error) {
            console.error(error);
        }
    });

    const renderProject = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
            <DialogTitle>{isEdit ? 'Update' : 'Add'} Manager to Project {projectData?.name} </DialogTitle>

            <Form methods={methods} onSubmit={onSubmit}>

                <Stack
                    spacing={2.5}
                    justifyContent="center"
                    sx={{ p: 2.5 }}
                >

                    <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>

                        <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
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
                </Stack>
                <DialogActions>
                    <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                        {isEdit ? 'Update' : 'Add'}
                    </LoadingButton>
                    {/* <Button onClick={onClose}>
                            Delete
                        </Button> */}
                    <Button variant="outlined" onClick={onClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </Form>
        </Dialog>
    )

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Tabs alineados a la izquierda */}
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
            </Box>
            {/* </Drawer > */}

        </>
    );
}
