import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function MeasurementEditModalAddressView({
    measurement,
    open,
    onClose,
}) {

    const { isMobile } = useContext(LoadingContext);

    const router = useRouter();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [measurementData, setMeasurementData] = useState({})

    const isEdit = useMemo(() => !!measurement?.address, [measurement]);

    useEffect(() => {
        if (measurement?.id) {
            setMeasurementData((prev) => ({
                ...prev,
                id: measurement?.id || '',
                number: measurement?.number || '',
                address: measurement?.address || '',   
            }));
        }
    }, [measurement, setMeasurementData]);

    const MeasurementDialogSchema = zod.object({
        number: zod.string().optional().nullable(),
        address: zod.string().min(1, { message: 'Address is required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            id: measurement?.id || '',
            number: measurement?.number || '',
            address: measurement?.address || '',
        }),
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
            reset({
                id: measurement.id || '',
                number: measurement.number || '',
                address: measurement.address || '',
            });
        }
    }, [measurement, userLogged?.data, reset]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('address', data.address);

        const promise = axios.post(`${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/change-address/`, formData, {
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

            // refetchMeasurements?.();

            // reset();

            onClose();

        } catch (error) {
            console.error(error);
        }
    });

    const renderMeasurement = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
                <DialogTitle>{isEdit ? 'Update' : 'Add'} Address to Measurement {measurementData?.number} </DialogTitle>

                <Form methods={methods} onSubmit={onSubmit}>

                    <Stack
                        spacing={2.5}
                        justifyContent="center"
                        sx={{ p: 2.5 }}
                    >

                        <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>
                            
                            <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                                <Field.Text
                                    name="address"
                                    label="Address"
                                    control={control}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter address"
                                />
                            </Box>
                        </Box>
                    </Stack>
                    <DialogActions>
                        <LoadingButton 
                        type="submit" 
                        variant="contained" 
                        loading={isSubmitting}
                        disabled={isSubmitting || watch('address')?.length < 1 || watch('address').trim() === measurementData?.address?.trim()}
                        >
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
