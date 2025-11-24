import axios from 'axios';
import dayjs, { duration } from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { Avatar } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';


import { isInstaller, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { useDataContext } from 'src/auth/context/data/data-context';
import { LoadingButton } from '@mui/lab';
import { ConfirmDialog } from 'src/components/custom-dialog';

export const CalendarNoteSchema = zod.object({
    name: zod
        .string()
        .min(1, { message: 'Name is required!' })
        .max(100, { message: 'Name must be less than 100 characters' }),
    description: zod
        .string().optional(),
    startDate: zod.preprocess(
        (value) => {
            if (dayjs.isDayjs(value)) return value.toISOString();
            if (value instanceof Date) return value.toISOString();
            return value;
        },
        zod.string()
    ),
    duration: zod
        .coerce.number()
        .min(1, { message: 'Duration must be at least 1 day' })
        .max(365, { message: 'Duration cannot exceed 365 days' }),
    userManager: zod.object({
        id: zod.string(),
        firstName: zod.string(),
        lastName: zod.string(),
        username: zod.string(),
        name: zod.string().optional(),
    }).refine((data) => data.id !== '', {
        message: 'User manager is required!',
    }),
    userAssignees: zod.array(zod.object({
        id: zod.string(),
        firstName: zod.string(),
        lastName: zod.string(),
        username: zod.string(),
        name: zod.string().optional(),
    })).refine((data) => data.length > 0, {
        message: 'At least one assignee is required!',
    }),
    associatedEvents: zod.array(zod.object({
        id: zod.string(),
        type: zod.string(),
        name: zod.string(),
        number: zod.string().optional(),
    })).optional(),
}).refine((data) => data.startDate && data.duration, {
    message: 'Start date and duration are required!',
});

// ----------------------------------------------------------------------

export function CalendarNoteForm({ currentEvent = null, onClose }) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const {
        loadedProjects,
        loadedServices,
        loadedMeasurements,
        loadedUsers,
    } = useDataContext();

    const mappedProjects = useMemo(() => loadedProjects?.map((project) => ({
        id: project.id,
        name: project.name,
        number: project.number,
        type: 'project',
    })) || [], [loadedProjects]);

    const mappedServices = useMemo(() => loadedServices?.map((service) => ({
        id: service.id,
        name: `${service.name} - v${service.version}`,
        number: service.number,
        type: 'service',
    })) || [], [loadedServices]);

    const mappedMeasurements = useMemo(() => loadedMeasurements?.map((measurement) => ({
        id: measurement.id,
        name: measurement.name,
        number: measurement.number,
        type: 'measurement',
    })) || [], [loadedMeasurements]);

    const mappedAssociatedEvents = useMemo(() => {
        const seen = new Set();

        return [
            ...mappedProjects,
            ...mappedServices,
            ...mappedMeasurements,
        ].filter((event) => {
            const key = `${event.type}-${event.id}`;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }, [mappedProjects, mappedServices, mappedMeasurements]);

    const mappedUsersManagers = useMemo(() => loadedUsers?.filter(
        (user) => listRolesAndSubroles(user?.userRole?.name)?.includes(CONFIG.roles.projectManager)
    ).map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        name: user.name || `${user.firstName} ${user.lastName}`,
    })) || [], [loadedUsers]);

    const mappedUsersAssignees = useMemo(() => loadedUsers?.filter(
        (user) => listRolesAndSubroles(user?.userRole?.name)?.includes(CONFIG.roles.installer)
    ).map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        name: user.name || `${user.firstName} ${user.lastName}`,
    })) || [], [loadedUsers]);

    const router = useRouter();

    const confirmDelete = useBoolean();

    const defaultValues = useMemo(() => ({
        name: currentEvent?.name || '',
        description: currentEvent?.description || '',
        startDate: currentEvent?.startDate ? dayjs(currentEvent?.startDate) : dayjs(),
        duration: currentEvent?.duration || 1,
        userManager: currentEvent?.userManager || null,
        userAssignees: currentEvent?.userAssignees || [],
        associatedEvents: currentEvent?.associatedEvents || [],
    }), [currentEvent]);

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(CalendarNoteSchema),
        defaultValues,
    });

    const {
        reset,
        watch,
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = methods;

    const values = watch();

    useEffect(() => {
        if (currentEvent) {
            reset(defaultValues);
        } else {
            reset();
        }
    }, [currentEvent, reset, defaultValues]);

    const onSubmit = handleSubmit(async (data) => {
        const startDate = dayjs(data.startDate).format('YYYY-MM-DD');
        const payload = {
            ...data,
            startDate,
            userManager: data.userManager,
            userAssignees: data.userAssignees.map((user) => user.id),
            associatedEvents: (data.associatedEvents || []),
            userReporter: userLogged?.data,
            duration: Number(data.duration),
        };
        try {
            const url = currentEvent ? `${CONFIG.apiUrl}/projects/update/project/calendar-note/${currentEvent?.objectId}/` :
                `${CONFIG.apiUrl}/projects/create/project/calendar-note/`;
            const successMessage = currentEvent ? 'Calendar note update success!' : 'Calendar note creation success!';
            await axios.post(url, {
                ...payload,
                userReporter: JSON.stringify(userLogged?.data),
            });
            toast.success(successMessage);
            onClose?.();
        } catch (error) {
            console.error('Error managing calendar note:', error);
        }
    });

    const onDelete = useCallback(async () => {
        try {
            const eventId = currentEvent?.objectId;
            const url = `${CONFIG.apiUrl}/projects/delete/project/calendar-note/${eventId}/`;
            const userReporter = userLogged?.data;
            await axios.delete(url, {
                data: {
                    userReporter,
                },
            });
            toast.success('Delete success!');
            onClose();
        } catch (error) {
            console.error(error);
        }
    }, [currentEvent, onClose, userLogged?.data]);

    return (
        <>
            <Form methods={methods} onSubmit={onSubmit}>
                <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
                    <Stack spacing={3}>
                        <Field.Text name="name" label="Name" />

                        <Field.Text
                            name='description'
                            label='Description'
                            multiline
                            rows={3}
                        />

                        <Field.MobileDateTimePicker
                            name="startDate"
                            label='Start date'
                        />

                        <Field.Text
                            type="number"
                            name="duration"
                            label='Duration (days)'
                            min={1}
                            max={365}
                        />

                        <Field.Autocomplete
                            name="userManager"
                            label="User manager"
                            options={mappedUsersManagers}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderOption={(props, option) => {
                                const { key, ...rest } = props;
                                return (
                                    <Box component="li" key={option.id} {...rest}>
                                        <Avatar sx={{ mr: 2 }}>
                                            {`${option.firstName[0]}${option.lastName[0]}`}
                                        </Avatar>
                                        {`${option.firstName} ${option.lastName}`}
                                    </Box>
                                );
                            }}
                        />

                        <Field.Autocomplete
                            name="userAssignees"
                            label="User assignees"
                            multiple
                            options={mappedUsersAssignees}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderOption={(props, option) => {
                                const { key, ...rest } = props;
                                return (
                                    <Box component="li" key={option.id} {...rest}>
                                        <Avatar sx={{ mr: 2 }}>
                                            {`${option.firstName[0]}${option.lastName[0]}`}
                                        </Avatar>
                                        {`${option.firstName} ${option.lastName}`}
                                    </Box>
                                );
                            }}
                        />

                        <Field.Autocomplete
                            name="associatedEvents"
                            label="Associated events"
                            multiple
                            options={mappedAssociatedEvents}
                            getOptionLabel={(option) => option.name || option.number || 'No name'}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderOption={(props, option) => {
                                const { key, ...rest } = props;
                                return (
                                    <Box component="li" key={option.id} {...rest}>
                                        <Iconify icon={option.icon || 'mdi:calendar'} sx={{ mr: 2 }} />
                                        {option.name || option.number || 'No name'}
                                    </Box>
                                );
                            }}
                        />

                    </Stack>
                </Scrollbar>
                <DialogActions sx={{ flexShrink: 0 }}>
                    {(!isInstaller(userLogged?.data?.user_role?.name) && currentEvent?.id) && (
                        <Tooltip title="Delete event">
                            <IconButton onClick={confirmDelete.onTrue} color="error">
                                <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={isSubmitting}
                    // disabled={dateError}
                    >
                        Save changes
                    </LoadingButton>

                    <Button variant="outlined" color="inherit" onClick={onClose}>
                        Cancel
                    </Button>


                </DialogActions>
            </Form>

            <ConfirmDialog
                open={confirmDelete.value}
                onClose={confirmDelete.onFalse}
                title="Delete"
                content={
                    <>
                        Are you sure want to delete {
                            currentEvent?.type !== 'service' ? 'installation project' : 'service'
                        }  <strong> {currentEvent?.name} </strong>?
                    </>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={onDelete}
                    >
                        Delete
                    </Button>
                }
            />
        </>
    );
}