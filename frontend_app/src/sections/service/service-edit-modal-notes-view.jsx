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

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function ServiceEditModalNotesView({
    service,
    open,
    onClose,
}) {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [serviceData, setServiceData] = useState({})

    useEffect(() => {
        if (service) {
            setServiceData((prev) => ({
                ...prev,
                id: service?.id || '',
                notes: service?.serviceNotes || '',
            }));
        }
    }, [service, setServiceData]);

    const ServiceDialogSchema = zod.object({
        notes: zod.string().min(1, { message: 'Address is required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            id: service?.id || '',
            notes: service?.serviceNotes || '',
        }),
        [service]
    );

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(ServiceDialogSchema),
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
        if (service) {
            reset({
                id: service.id || '',
                notes: service.serviceNotes || '',
            });
        }
    }, [service, reset]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('serviceNotes', data.notes);

        const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${service.id}/change-notes/`, formData, {
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

            // refetchServices?.();

            // reset();

            onClose();

        } catch (error) {
            console.error(error);
        }
    });

    const renderService = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
                <DialogTitle>{service?.serviceNotes ? 'Update' : 'Add'} Notes to Service {service?.name} </DialogTitle>

                <Form methods={methods} onSubmit={onSubmit}>

                    <Stack
                        spacing={2.5}
                        justifyContent="center"
                        sx={{ p: 2.5 }}
                    >

                        <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>
                            
                            <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                                <Field.Text
                                    name="notes"
                                    label="Notes"
                                    control={control}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter notes"
                                />
                            </Box>
                        </Box>
                    </Stack>
                    <DialogActions>
                        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                            {service?.serviceNotes ? 'Update' : 'Add'}
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
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderService}</Box>
            </Box>
            {/* </Drawer > */}

        </>
    );
}
