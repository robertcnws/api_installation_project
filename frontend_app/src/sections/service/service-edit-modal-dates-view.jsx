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
import { Grid, Dialog, Switch, TextField, IconButton, Typography, DialogTitle, DialogActions } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate, getDatesBetween } from 'src/utils/format-time';
import { getServiceInstaller } from 'src/utils/service-tasks-utils';
import { getProjectInstaller } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useDataContext } from 'src/auth/context/data/data-context';



// ----------------------------------------------------------------------

export function ServiceEditModalDatesView({
    isEdit,
    isStartDate,
    service,
    open,
    onClose,
}) {

    const [diffDays, setDiffDays] = useState(1);

    const {
        loadedProjects,
        loadedServices,
    } = useDataContext();

    const busyDays = useMemo(() => {
        const installer = getServiceInstaller(service, CONFIG);
        if (!installer) return [];

        const installerProjects = loadedProjects?.filter(
            (p) => getProjectInstaller(p, CONFIG)?.id === installer.id
        ) || [];
        const installerServices = loadedServices?.filter(
            (s) => getServiceInstaller(s, CONFIG)?.id === installer.id
        ) || [];

        const occupiedDays = [];

        installerProjects.forEach((p) => {
            if (!p.isPartDays) {
                getDatesBetween(p.startDate, p.endDate)
                    .forEach((date) => occupiedDays.push(date));
            }
        });

        installerServices.forEach((s) => {
            if (!s.isPartDays) {
                getDatesBetween(s.startDate, s.endDate)
                    .forEach((date) => occupiedDays.push(date));
            }
        });

        const finalDays = occupiedDays.filter((date) => fDate(date) !== fDate(service?.startDate));

        return Array.from(new Set(finalDays));
    }, [loadedProjects, loadedServices, service]);

    useEffect(() => {
        if (service?.endDate) {
            const diff = service?.duration ?? (dayjs(service?.endDate).diff(dayjs(service?.startDate), 'day'));
            setDiffDays(diff);
        }
    }, [service?.endDate, service?.startDate, service?.duration]);

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
            duration: service?.duration || dayjs(service?.endDate).diff(dayjs(service?.startDate), 'day') + 1 || 1,
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
                duration: service?.duration || 1,
                endDate: service.endDate || null,
                inspectionDate: service.inspectionDate || null,
            });
            setSelectedDate(isStartDate ? dayjs(service?.startDate) : dayjs(service?.endDate));
            setDaysToInstall(diffDays);
            setFormChanged(false);
        }
    }, [service, userLogged?.data, reset, diffDays, isStartDate]);


    const [isPartDays, setIsPartDays] = useState(false);

    useEffect(() => {
        if (service) {
            setIsPartDays(service.isPartDays);
        }
    }, [service]);

    const handleSwitch = (event) => {
        const newVal = event.target.checked;
        setIsPartDays(newVal);
        setFormChanged(newVal !== service.isPartDays);
    }


    const minDate = useMemo(() =>
        isStartDate ? dayjs(service?.salesOrder?.date) : service?.startDate ? dayjs(service?.startDate) : dayjs(service?.salesOrder?.date),
        [isStartDate, service?.salesOrder?.date, service?.startDate]
    );


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
            formData.append('isPartDays', isPartDays ? 'true' : 'false');
            formData.append('duration', daysToInstall);
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
            formData.append('dateType', 'startDate');


            const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${service.id}/remove-date/`, formData, {
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
                                        minDate={minDate}
                                        maxDate={
                                            isStartDate ? dayjs(service?.endDate) : null
                                        }
                                        shouldDisableDate={(date) => {
                                            if (date.isBefore(minDate, 'day')) return true;
                                            if (busyDays.some(disabledDate => date.isSame(disabledDate, 'day'))) {
                                                return true;
                                            }
                                            return false;
                                        }}
                                        inputFormat="YYYY-MM-DD"
                                        sx={{ width: '100%' }}
                                    />
                                </Box>
                            </Stack>
                            {isStartDate && (
                                <>
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
                                                    if (daysToInstall > 0) {
                                                        const newDays = daysToInstall - 1;
                                                        setDaysToInstall(newDays);
                                                        const newEndDate = dayjs(service?.startDate).add(newDays, 'day');
                                                        setEndDate(newEndDate);
                                                        setFormChanged(true);
                                                    }
                                                }}
                                                disabled={daysToInstall < 1}
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
                                    <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize', mt: 1 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: 1,
                                                justifyContent: 'space-between',
                                                p: 0,
                                                width: '45%'
                                            }}>
                                            <Typography variant="subtitle2" color="text.secondary"><b>Is Part Days?</b></Typography>
                                            <Switch
                                                checked={!!(service && isPartDays)}
                                                onChange={(e) => handleSwitch(e)}
                                                sx={{ maxWidth: 56, mt: -1 }}
                                            />
                                        </Box>
                                    </Stack>
                                </>
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
            <DialogTitle>{isEdit ? 'Update' : 'Add'} {isStartDate ? 'Start' : 'Closing'} date to Service {service?.name} </DialogTitle>

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
