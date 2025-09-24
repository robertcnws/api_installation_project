import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Avatar, Dialog, DialogTitle, DialogActions, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { isInstaller } from 'src/utils/check-permissions';
import { getProjectInstaller } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';


// ----------------------------------------------------------------------

export function ProjectEditModalInstallationTeamView({
    isEdit,
    project,
    refetchProject,
    open,
    onClose,
}) {

    const {
        loadedUsers,
        loadedProjectPermissions,
    } = useDataContext();

    const installerUsers = useMemo(() => loadedUsers.filter((user) => isInstaller(user.userRole.name)), [loadedUsers]);

    const cleanLoadedUsers = useMemo(() => loadedUsers.map(({ __typename, ...rest }) => rest), [loadedUsers]);

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const ProjectDialogSchema = zod.object({
        name: zod.string().min(1, { message: 'Name is required!' }),
        description: schemaHelper.editor().optional().nullable(),
        installer: zod.object({
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
            (data) => data.id !== '', { message: 'Installer is required!' }
        ),
    });

    const defaultValues = useMemo(
        () => ({
            id: project?.id || '',
            name: project?.name || '',
            number: project?.number || '',
            installer: getProjectInstaller(project, CONFIG) || null,
        }),
        [project]
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
        if (project?.id) {
            reset({
                id: project?.id || '',
                name: project?.name || '',
                number: project?.number || '',
                installer: getProjectInstaller(project, CONFIG) || null,
            });
        }
    }, [project, userLogged?.data, reset]);

    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        if (project && project?.userManager?.id && cleanLoadedUsers?.length > 0) {
            setFilteredUsers(cleanLoadedUsers.filter(
                user => user.id !== project?.userManager?.id &&
                    user.userRole.name.toLowerCase().indexOf(CONFIG.roles.installer.toLowerCase()) !== -1
            ));
        }
    }, [cleanLoadedUsers, project]);

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

        const installer = {
            ...data.installer,
            project_permissions: projectPermissions,
        }

        formData.append('installer', JSON.stringify(installer));

        const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project?.id}/change-installer/`, formData, {
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

            refetchProject?.();

            // reset();

            onClose();

        } catch (error) {
            console.error(error);
        }
    });

    const renderProject = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box className="dialog-title-icon">
                        <Iconify icon="mdi:account-group" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isEdit ? 'Update' : 'Add'} Installation Team to Project {project?.name}
                    </Typography>
                </Box>
            </DialogTitle>

            <Form methods={methods} onSubmit={onSubmit}>

                <Stack
                    spacing={2.5}
                    justifyContent="center"
                    sx={{ p: 2.5 }}
                >

                    <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>

                        <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                            <Field.Autocomplete
                                name="installer"
                                placeholder="Installer"
                                control={control}
                                label="Installer"
                                value={watch("installer") || null}
                                options={filteredUsers || []}
                                getOptionLabel={(option) => (
                                    option.name
                                ) || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(event, newValue) => {
                                    setValue("installer", newValue);
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
