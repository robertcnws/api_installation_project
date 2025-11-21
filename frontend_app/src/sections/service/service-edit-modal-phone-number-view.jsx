import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext } from 'react';
import { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions, Typography } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useServiceByIdQuery } from 'src/_mock/__services';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

export function ServiceEditModalPhoneNumberView({
    isEdit,
    serviceId,
    open,
    onClose,
}) {

    const {
        loadedServices,
    } = useDataContext();

    const item = useMemo(() => loadedServices?.find((service) => service.id === serviceId), [loadedServices, serviceId]);

    const { isMobile } = useContext(LoadingContext);

    const router = useRouter();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const { data: itemById } = useServiceByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [serviceData, setServiceData] = useState({})

    useEffect(() => {
        if (itemById) {
            const phoneNumber = parsePhoneNumber(itemById?.salesOrder?.customer?.phone || itemById?.salesOrder?.customer?.mobile || '', 'US');
            const formattedNumber = phoneNumber ? phoneNumber.format('E.164') : '';
            setServiceData((prev) => ({
                ...prev,
                id: itemById?.id || '',
                name: itemById?.name || '',
                number: itemById?.number || '',
                phoneNumber: formattedNumber,
            }));
        }
    }, [itemById, setServiceData]);

    const ServiceDialogSchema = zod.object({
        name: zod.string().min(1, { message: 'Name is required!' }),
        description: schemaHelper.editor().optional().nullable(),
        phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber })
    });

    const defaultValues = useMemo(
        () => {
            const phoneNumber = parsePhoneNumber(itemById?.salesOrder?.customer?.phone || itemById?.salesOrder?.customer?.mobile || '', 'US');
            const formattedNumber = phoneNumber ? phoneNumber.format('E.164') : '';
            return {
                id: itemById?.id || '',
                name: itemById?.name || '',
                number: itemById?.number || '',
                phoneNumber: formattedNumber,
            }
        },
        [itemById]
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
        if (itemById) {
            const phoneNumber = parsePhoneNumber(itemById?.salesOrder?.customer?.phone || itemById?.salesOrder?.customer?.mobile || '', 'US');
            const formattedNumber = phoneNumber ? phoneNumber.format('E.164') : '';
            reset({
                id: itemById.id || '',
                name: itemById.name || '',
                number: itemById.number || '',
                phoneNumber: formattedNumber,
            });
        }
    }, [itemById, userLogged?.data, reset]);

    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('phoneNumber', data.phoneNumber);

        const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${item.id}/change-phone-number/`, formData, {
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
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box className="dialog-title-icon">
                        <Iconify icon="mdi:phone" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isEdit ? 'Update' : 'Add'} Phone Number to Service {serviceData?.name}
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
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderService}</Box>
            </Box>
            {/* </Drawer > */}

        </>
    );
}
