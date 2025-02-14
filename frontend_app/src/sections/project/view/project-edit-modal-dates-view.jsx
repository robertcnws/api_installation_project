import { useState, useCallback, useMemo, useContext, useEffect } from 'react';
import axios from 'axios';
import { CONFIG } from 'src/config-global';

import { LoadingContext } from 'src/auth/context/loading-context';

import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useProjectByIdQuery } from 'src/_mock/__projects';

import { toast } from 'src/components/snackbar';


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { varAlpha } from 'src/theme/styles';
import { Dialog, DialogActions, DialogTitle, Grid, MenuItem, MenuList, Tooltip } from '@mui/material';
import { Form } from 'src/components/hook-form';
import { useForm } from 'react-hook-form';
import { useTabs } from 'src/hooks/use-tabs';

import { useBoolean } from 'src/hooks/use-boolean';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CustomDateRangePicker, useDateRangePicker } from 'src/components/custom-date-range-picker';
import { CustomPopover, usePopover } from 'src/components/custom-popover';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { LoadingButton } from '@mui/lab';

import { useDataContext } from 'src/auth/context/data/data-context';


// ----------------------------------------------------------------------

export function ProjectEditModalDatesView({
    isEdit,
    isStartDate,
    projectId,
    open,
    onClose,
}) {

    const {
        loadedProjects,
        loadedUsers,
        refetchProjects,
        refetchSalesOrders,
    } = useDataContext();

    const item = useMemo(() => loadedProjects?.find((project) => project.id === projectId), [loadedProjects, projectId]);

    const { isMobile } = useContext(LoadingContext);

    const router = useRouter();

    const confirm = useBoolean();

    const tabs = useTabs('overview');

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);
    
    const [selectedDate, setSelectedDate] = useState(null);

    const popover = usePopover();

    const toggleMainInfo = useBoolean(true);

    const { data: itemById, refetch: refetchProject } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const handleReturnList = useCallback(() => {
        router.push(paths.dashboard.project.list);
    }, [router]);

    const handleDeleteItem = useCallback(
        async (id) => {

            const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${id}/`, {
                data: {
                    userReporter: userLogged?.data,
                }
            });

            const response = await promise;

            toast.success('Delete success!');

            refetchProjects?.();

            refetchSalesOrders?.();

            router.push(paths.dashboard.project.list);

        },
        [refetchSalesOrders, refetchProjects, userLogged, router]
    );

    const ProjectDialogSchema = zod.object({
        name: zod.string().min(1, { message: 'Name is required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            id: itemById?.id || '',
            name: itemById?.name || '',
            number: itemById?.number || '',
            userReporter: userLogged?.data,
            startDate: itemById?.startDate || null,
            endDate: itemById?.endDate || null,
        }),
        [itemById, userLogged]
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
        if (itemById) {
            reset({
                id: itemById.id || '',
                name: itemById.name || '',
                number: itemById.number || '',
                userReporter: userLogged?.data,
                startDate: itemById.startDate || null,
                endDate: itemById.endDate || null,
            });
        }
    }, [itemById, userLogged?.data, reset]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const field = isStartDate ? 'startDate' : 'endDate';
        formData.append(field, new Date(selectedDate).toISOString());

        const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${item.id}/`, formData, {
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
                                        value={
                                            isStartDate ? dayjs(itemById?.startDate) : dayjs(itemById?.endDate)
                                        }
                                        onChange={(date) => {
                                            setSelectedDate(date);
                                        }}
                                        minDate={
                                            isStartDate ? dayjs(itemById?.salesOrder?.date) : 
                                            itemById?.startDate ? dayjs(itemById?.startDate) : dayjs(itemById?.salesOrder?.date)
                                        }
                                        maxDate={
                                            isStartDate ? dayjs(itemById?.endDate) : null
                                        }
                                        inputFormat="yyyy-MM-dd"
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
        <>
            <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
                <DialogTitle>{isEdit ? 'Update' : 'Add'} {isStartDate ? 'Install': 'Closing'} date to Project {itemById?.name} </DialogTitle>

                <Form methods={methods} onSubmit={onSubmit}>

                    <Stack
                        spacing={2.5}
                        justifyContent="center"
                        sx={{ p: 2.5 }}
                    >

                        {renderMainInfo}


                    </Stack>
                    <DialogActions>
                        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                            {isEdit ? 'Update' : 'Add'}
                        </LoadingButton>
                        <Button variant="outlined" onClick={onClose}>
                            Cancel
                        </Button>
                    </DialogActions>
                </Form>
            </Dialog>
        </>
    )

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Tabs alineados a la izquierda */}
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
            </Box>
        </>
    );
}
