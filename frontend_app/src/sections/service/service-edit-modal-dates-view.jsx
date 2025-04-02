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
import { Grid, Dialog, TextField, IconButton, DialogTitle, DialogActions } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';



// ----------------------------------------------------------------------

export function ServiceEditModalDatesView({
    isEdit,
    isStartDate,
    service,
    open,
    onClose,
}) {

    const [diffDays, setDiffDays] = useState(1);

    useEffect(() => {
        if (service?.endDate) {
            const diff = dayjs(service?.endDate).diff(dayjs(service?.startDate), 'day');
            setDiffDays(diff);
        }
    }, [service?.endDate, service?.startDate]);

    // const diffDays = useMemo(
    //     () => service?.endDate ? dayjs(service?.endDate).diff(dayjs(service?.startDate), 'day') : 1, [service?.endDate, service?.startDate]
    // );

    const [daysToInstall, setDaysToInstall] = useState(1);

    useEffect(() => {
        setDaysToInstall(diffDays);
    }, [diffDays]);

    const [formChanged, setFormChanged] = useState(false);

    const confirmValidInstallDate = useBoolean();

    const [confirmValidInstallMessage, setConfirmValidInstallMessage] = useState(null);

    const [isRemovingDate, setIsRemovingDate] = useState(false);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [selectedDate, setSelectedDate] = useState(null);

    const [endDate, setEndDate] = useState(null);

    const toggleMainInfo = useBoolean(true);

    const handleDaysChange = (e) => {
        const days = parseInt(e.target.value, 10) || 1;
        setDaysToInstall(days);
        const newEndDate = dayjs(service?.startDate).add(days, 'day');
        setEndDate(newEndDate);
        setFormChanged(!Number.isNaN(days) && days > 0);
    };

    const handleDateChange = useCallback(
        (date) => {
            // const currentStage = service?.currentStage;
            // if (currentStage?.name === CONFIG.stages.preparation && totalPercentageServiceStage(service, CONFIG.stages.preparation, CONFIG) < 50) {
            //     const today = dayjs().format('YYYY-MM-DD');
            //     const formatDate = dayjs(date).format('YYYY-MM-DD');
            //     const isSame = fIsSame(today, formatDate);
            //     if (isSame) {
            //         const message = isStartDate ? 'You have to finish all tasks in the previous stages before setting the start date.' :
            //             'You have to finish all tasks in the previous stages before setting the closing date.';
            //         setConfirmValidInstallMessage(message);
            //         confirmValidInstallDate.onTrue();
            //     }
            // }
            // else {
            //     setSelectedDate(date);
            //     setFormChanged(true);
            //     setConfirmValidInstallMessage(null);
            // }
            setSelectedDate(date);
            setFormChanged(true);
            setConfirmValidInstallMessage(null);
        },
        []
    );

    const ServiceDialogSchema = zod.object({
        name: zod.string().min(1, { message: 'Name is required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            id: service?.id || '',
            name: service?.name || '',
            number: service?.number || '',
            userReporter: userLogged?.data,
            startDate: service?.startDate || null,
            endDate: service?.endDate ? dayjs(service?.endDate).toISOString() : null,
            inspectionDate: service?.inspectionDate ? dayjs(service?.inspectionDate).toISOString() : null,
        }),
        [service, userLogged]
    );

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(ServiceDialogSchema),
        defaultValues,
    });

    const {
        reset,
        handleSubmit,
        formState: { isSubmitting },
    } = methods;


    useEffect(() => {
        if (service) {
            reset({
                id: service.id || '',
                name: service.name || '',
                number: service.number || '',
                userReporter: userLogged?.data,
                startDate: service.startDate || null,
                endDate: service.endDate || null,
                inspectionDate: service.inspectionDate || null,
            });
            setSelectedDate(isStartDate ? dayjs(service?.startDate) : dayjs(service?.endDate));
            setDaysToInstall(diffDays);
            setFormChanged(false);
        }
    }, [service, userLogged?.data, reset, diffDays, isStartDate]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const field = isStartDate ? 'startDate' : 'endDate';
        formData.append(field, fDate(selectedDate));
        if (isStartDate) {
            if (isEdit) {
                formData.append('endDate', fDate(endDate));
            }
            else {
                const newEndDate = dayjs(selectedDate).add(daysToInstall, 'day');
                formData.append('endDate', fDate(newEndDate));
            }
        }


        const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${service.id}/change-dates/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Service (${data.name}) success!`,
                error: `Update Service (${data.name}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            // refetchService?.();

            onClose();

        } catch (error) {
            console.error(error);
        }
    });


    const handleRemoveInstallDate = useCallback(
        async () => {
            setIsRemovingDate(true);
            const formData = new FormData();
            formData.append('userReporter', JSON.stringify(userLogged?.data));


            const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${service.id}/revove-start-date/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            try {
                toast.promise(promise, {
                    loading: 'Loading...',
                    success: `Update Service (${service.name}) success!`,
                    error: `Update Service (${service.name}) error!`,
                });

                const response = await promise;

                if (!response.data) {
                    return;
                }

                setIsRemovingDate(false);

                onClose();

            } catch (error) {
                console.error(error);
            }
        }, [onClose, service, userLogged]);

    const renderMainInfo = (
        <Stack spacing={1.5}>

            {toggleMainInfo.value && (
                <>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12}>
                            <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
                                <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
                                    <DatePicker
                                        label={
                                            isStartDate ? 'Install Date' : 'Closing Date'
                                        }
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        minDate={
                                            isStartDate ? dayjs(service?.salesOrder?.date) : service?.startDate ? dayjs(service?.startDate) : dayjs(service?.salesOrder?.date)
                                        }
                                        maxDate={
                                            isStartDate ? dayjs(service?.endDate) : null
                                        }
                                        inputFormat="yyyy-MM-dd"
                                        sx={{ width: '100%' }}
                                    />
                                </Box>
                            </Stack>
                            {isStartDate && (
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
                                        <IconButton
                                            sx={{ width: 50, height: 50, mt: 1 }}
                                            onClick={() => {
                                                if (daysToInstall > 1) {
                                                    const newDays = daysToInstall - 1;
                                                    setDaysToInstall(newDays);
                                                    const newEndDate = dayjs(service?.startDate).add(newDays, 'day');
                                                    setEndDate(newEndDate);
                                                    setFormChanged(true);
                                                }
                                            }}
                                            disabled={daysToInstall <= 1}
                                        >
                                            <Iconify icon="mdi:minus-box-outline" sx={{ width: 30, height: 30 }} />
                                        </IconButton>

                                        <TextField
                                            type="number"
                                            min={1}
                                            label="Duration days"
                                            sx={{ width: '30%', mt: 1 }}
                                            value={daysToInstall}
                                            onChange={handleDaysChange}
                                        />

                                        <IconButton
                                            sx={{ width: 50, height: 50, mt: 1 }}
                                            onClick={() => {
                                                const newDays = daysToInstall + 1;
                                                setDaysToInstall(newDays);
                                                const newEndDate = dayjs(service?.startDate).add(newDays, 'day');
                                                setEndDate(newEndDate);
                                                setFormChanged(true);
                                            }}
                                        >
                                            <Iconify icon="mdi:plus-box-outline" sx={{ width: 30, height: 30 }} />
                                        </IconButton>
                                    </Box>
                                </Stack>
                            )}
                        </Grid>
                    </Grid>
                    <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
                        <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }} />

                    </Stack>
                </>
            )}
        </Stack>
    );


    const renderService = (
        <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
            <DialogTitle>{isEdit ? 'Update' : 'Add'} {isStartDate ? 'Install' : 'Closing'} date to Service {service?.name} </DialogTitle>

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
                        disabled={!formChanged || confirmValidInstallMessage !== null}
                    >
                        {isEdit ? 'Update' : 'Add'}
                    </LoadingButton>
                    <LoadingButton
                        type="button"
                        variant="contained"
                        loading={isRemovingDate}
                        onClick={handleRemoveInstallDate}
                        color='error'
                        disabled={!service?.startDate}
                    >
                        Remove start date
                    </LoadingButton>
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
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderService}</Box>
            </Box>
            <ConfirmDialog
                open={confirmValidInstallDate.value}
                onClose={confirmValidInstallDate.onFalse}
                title="Warning"
                content={confirmValidInstallMessage}
            />
        </>
    );
}
