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
import { Grid, Dialog, DialogTitle, DialogActions } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';


// ----------------------------------------------------------------------

export function MeasurementEditModalDatesView({
    isFirstDate,
    isCheckDate,
    measurement,
    open,
    onClose,
}) {

    const [formChanged, setFormChanged] = useState(false);

    const [isRemovingDate, setIsRemovingDate] = useState(false);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [selectedDate, setSelectedDate] = useState(null);

    const toggleMainInfo = useBoolean(true);

    const isEdit = useMemo(() => isFirstDate ? !!measurement?.firstDate : !!measurement?.checkDate , [isFirstDate, measurement]);

    const handleDateChange = useCallback(
        (date) => {
            setSelectedDate(date);
            setFormChanged(true);
        }, []
    );

    const DialogSchema = zod.object({
        id: zod.string().min(1, { message: 'ID is required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            id: measurement?.id || '',
            number: measurement?.number || '',
            userReporter: userLogged?.data,
            firstDate: measurement?.firstDate || null,
            checkDate: measurement?.checkDate || null,
        }),
        [measurement, userLogged]
    );

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(DialogSchema),
        defaultValues,
    });

    const {
        reset,
        handleSubmit,
        formState: { isSubmitting },
    } = methods;


    useEffect(() => {
        if (measurement && measurement?.id) {
            reset({
                id: measurement?.id || '',
                number: measurement?.number || '',
                userReporter: userLogged?.data,
                firstDate: measurement?.firstDate || null,
                checkDate: measurement?.checkDate || null,
            });
            setSelectedDate(isFirstDate ? dayjs(measurement?.firstDate) : dayjs(measurement?.checkDate));
            setFormChanged(false);
        }
    }, [measurement, userLogged?.data, reset, isFirstDate, isCheckDate]);


    const minDate = useMemo(() => {
        if (isFirstDate) {
            return dayjs(new Date());
        }
        return dayjs(measurement?.firstDate || new Date());
    }, [isFirstDate, measurement?.firstDate]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const field = isFirstDate ? 'firstDate' : 'checkDate';
        formData.append(field, fDate(selectedDate));


        const promise = axios.post(`${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/change-date/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Measurement (${data.number}) success!`,
                error: `Update Measurement (${data.number}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            onClose();

        } catch (error) {
            console.error(error);
        }
    });


    const handleRemoveDate = useCallback(
        async () => {
            setIsRemovingDate(true);
            const formData = new FormData();
            formData.append('userReporter', JSON.stringify(userLogged?.data));

            formData.append('dateType', isFirstDate ? 'firstDate' : 'checkDate');

            const promise = axios.post(`${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/remove-date/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            try {
                toast.promise(promise, {
                    loading: 'Loading...',
                    success: `Update Measurement (${measurement.name}) success!`,
                    error: `Update Measurement (${measurement.name}) error!`,
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
        }, [onClose, measurement, userLogged?.data, isFirstDate]);


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
                                            isFirstDate ? 'First Date' : 'Check Date'
                                        }
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        minDate={minDate}
                                        maxDate={isFirstDate && measurement?.checkDate ? dayjs(measurement?.checkDate) : null}
                                        inputFormat="YYYY-MM-DD"
                                        sx={{ width: '100%' }}
                                    />
                                </Box>
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
        <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
            <DialogTitle>
                {isEdit ? 'Update' : 'Add'} {
                    isFirstDate ? 'First' : 'Check'
                } Date to Measurement {measurement?.number}
            </DialogTitle>

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
                        {isEdit ? 'Update' : 'Add'}
                    </LoadingButton>
                    <LoadingButton
                        type="button"
                        variant="contained"
                        loading={isRemovingDate}
                        onClick={handleRemoveDate}
                        color='error'
                        disabled={!measurement?.firstDate}
                    >
                        Remove {isFirstDate ? 'first' : 'check'} date
                    </LoadingButton>
                    <Button variant="outlined" onClick={onClose}>
                        Cancel
                    </Button>
                </DialogActions>
            </Form>
        </Dialog>
    )

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Tabs alineados a la izquierda */}
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
            </Box>
    );
}
