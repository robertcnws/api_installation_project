import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext } from 'react';
import { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions } from '@mui/material';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function MeasurementEditModalPhoneNumberView({
    measurement,
    open,
    onClose,
}) {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [measurementData, setMeasurementData] = useState({})

    const isEdit = useMemo(() => !!((measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone ||
        (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile ||
        measurement?.phone || measurement?.client?.phone), [measurement]);

    useEffect(() => {
        if (measurement) {
            const phoneNumber = parsePhoneNumber(
                (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone ||
                (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile ||
                measurement?.phone || measurement?.client?.phone || '', 'US'
            );
            const formattedNumber = phoneNumber ? phoneNumber.format('E.164') : '';
            setMeasurementData((prev) => ({
                ...prev,
                id: measurement?.id || '',
                number: measurement?.number || '',
                phoneNumber: formattedNumber,
            }));
        }
    }, [measurement, setMeasurementData]);

    const MeasurementDialogSchema = zod.object({
        phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber })
    });

    const defaultValues = useMemo(
        () => {
            const phoneNumber = parsePhoneNumber(
                (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone ||
                (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile ||
                measurement?.phone || measurement?.client?.phone || '', 'US'
            );
            const formattedNumber = phoneNumber ? phoneNumber.format('E.164') : '';
            return {
                id: measurement?.id || '',
                number: measurement?.number || '',
                phoneNumber: formattedNumber,
            }
        },
        [measurement]
    );

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(MeasurementDialogSchema),
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
        if (measurement) {
            const phoneNumber = parsePhoneNumber(
                (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone ||
                (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile ||
                measurement?.phone || measurement?.client?.phone || '', 'US'
            );
            const formattedNumber = phoneNumber ? phoneNumber.format('E.164') : '';
            reset({
                id: measurement.id || '',
                number: measurement.number || '',
                phoneNumber: formattedNumber,
            });
        }
    }, [measurement, userLogged?.data, reset]);

    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('phoneNumber', data.phoneNumber);

        const promise = axios.post(`${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/change-phone-number/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Measurement (${data.name}) success!`,
                error: `Update Measurement (${data.name}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            // refetchMeasurements?.();

            // reset();

            onClose();

        } catch (error) {
            console.error(error);
        }
    });

    const renderMeasurement = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box className="dialog-title-icon">
                        <Iconify icon="mdi:phone" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isEdit ? 'Update' : 'Add'} Phone Number to Measurement {measurementData?.name}
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
                            <Field.Phone name="phoneNumber" label="Phone number" />
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
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderMeasurement}</Box>
            </Box>
            {/* </Drawer > */}

        </>
    );
}
