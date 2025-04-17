import axios from 'axios';
import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Grid, Dialog, TextField, DialogTitle, DialogActions } from '@mui/material';

import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';



// ----------------------------------------------------------------------

export function KanbanDetailsReminderModal({
    project,
    task,
    availableReminders,
    open,
    onClose,
    reminder = null,
}) {

    const [formChanged, setFormChanged] = useState(false);

    const [isRemovingDate, setIsRemovingDate] = useState(false);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [selectedDate, setSelectedDate] = useState(null);

    const {
        refetchProjectReminders,
    } = useDataContext();

    const DialogSchema = zod.object({
        notes: zod.string().optional(),
    });

    const defaultValues = useMemo(
        () => ({
            notes: reminder?.notes || '',
            date: reminder?.date || null,
        }),
        [reminder]
    );

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(DialogSchema),
        defaultValues,
    });

    const {
        reset,
        handleSubmit,
        watch,
        setValue,
        formState: { isSubmitting },
    } = methods;


    useEffect(() => {
        reset({
            notes: reminder?.notes || '',
            date: reminder?.date || null,
        });
        if (project && reminder) {
            setSelectedDate(dayjs(reminder?.date));
            setFormChanged(false);
        }
        else {
            setSelectedDate(null);
            setFormChanged(false);
        }
    }, [project, reminder, reset]);


    const minDate = useMemo(() => dayjs(new Date()), []);

    const handleDateChange = useCallback(
        (date) => {
            setSelectedDate(date);
            setFormChanged(true);
        },
        [setSelectedDate, setFormChanged]
    );

    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('date', fDate(selectedDate));
        formData.append('notes', data.notes || '');
        if (reminder){
            formData.append('reminderId', reminder.id)
        }

        const promise = axios.post(`${CONFIG.apiUrl}/projects/manage/project-reminder/${project.id}/task/${task.id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `${reminder ? 'Update' : 'Create'} reminder (${data.name}) success!`,
                error: `${reminder ? 'Update' : 'Create'} reminder (${data.name}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            refetchProjectReminders?.();

            setFormChanged(false);
            setSelectedDate(null);

            onClose();

        } catch (error) {
            console.error(error);
        }
    });


    const handleQuitReminder = useCallback(
        async () => {
            setIsRemovingDate(true);
            const formData = new FormData();
            formData.append('userReporter', JSON.stringify(userLogged?.data));


            const promise = axios.post(`${CONFIG.apiUrl}/projects/quit/project-reminder/${reminder.id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            try {
                toast.promise(promise, {
                    loading: 'Loading...',
                    success: `Update Project (${project.name}) success!`,
                    error: `Update Project (${project.name}) error!`,
                });

                const response = await promise;

                if (!response.data) {
                    return;
                }

                setIsRemovingDate(false);

                refetchProjectReminders?.()

                onClose();

            } catch (error) {
                console.error(error);
            }
        }, [onClose, project, userLogged, reminder, refetchProjectReminders]);

    const renderMainInfo = (
        <Stack spacing={1.5}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                    <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
                        <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                            <DatePicker
                                label='Date'
                                value={selectedDate || null}
                                onChange={handleDateChange}
                                minDate={minDate}
                                // maxDate={dayjs(project?.endDate)}
                                shouldDisableDate={(date) => {
                                    if (date.isBefore(minDate, 'day')) return true;
                                    if (!reminder && availableReminders.some(remind => date.isSame(remind.date, 'day'))) return true;
                                    if (reminder && availableReminders.some(remind => date.isSame(remind.date, 'day') && remind.id !== reminder.id)) return true;
                                    return false;
                                }}
                                inputFormat="yyyy-MM-dd"
                                sx={{ width: '100%' }}
                            />
                        </Box>
                    </Stack>
                    <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            flexDirection: 'row',
                            width: '100%',
                            color: 'text.secondary',
                            mt: 1,
                            gap: 0.5
                        }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Notes"
                                sx={{ mt: 1 }}
                                value={watch('notes') || ''}
                                onChange={(e) => {
                                    setValue('notes', e.target.value)
                                    setFormChanged(true);
                                }}
                            />
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
            <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
                <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }} />
            </Stack>
        </Stack>
    );


    const renderProject = (
        <Dialog fullWidth maxWidth="xs" open={open} onClose={() => {
            onClose();
            setFormChanged(false);
            setSelectedDate(null);
        }}>
            <DialogTitle>{reminder ? 'Update' : 'Add'} reminder to task {task?.name}</DialogTitle>

            <Form methods={methods} onSubmit={onSubmit}>

                <Stack
                    spacing={2.5}
                    justifyContent="center"
                    sx={{ p: 2.5 }}
                >

                    {renderMainInfo}


                </Stack>
                <DialogActions>
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={isSubmitting}
                        disabled={!formChanged}
                    >
                        {reminder ? 'Update' : 'Add'}
                    </LoadingButton>
                    {reminder && (
                        <LoadingButton
                            type="button"
                            variant="contained"
                            // loading={isRemovingDate}
                            onClick={handleQuitReminder}
                            color='error'
                            disabled={!reminder?.date}
                        >
                            Remove reminder
                        </LoadingButton>
                    )}
                    <Button variant="outlined" onClick={() => {
                        onClose();
                        setFormChanged(false);
                        setSelectedDate(null);
                    }}>
                        Cancel
                    </Button>
                </DialogActions>
            </Form>
        </Dialog>
    )

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
        </Box>
    );
}
