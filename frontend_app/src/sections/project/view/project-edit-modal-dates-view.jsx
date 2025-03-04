import axios from 'axios';
import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Grid, Dialog, DialogTitle, DialogActions, TextField, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { usePopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import { Iconify } from 'src/components/iconify';
import { height } from '@mui/system';
import { fDate } from 'src/utils/format-time';


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

    const diffDays = useMemo(
        () => item?.endDate ? dayjs(item?.endDate).diff(dayjs(item?.startDate), 'day') : 1, [item?.endDate, item?.startDate]
    );

    const [daysToInstall, setDaysToInstall] = useState(diffDays === 0 ? 1 : diffDays);
    const [formChanged, setFormChanged] = useState(false);

    const { isMobile } = useContext(LoadingContext);

    const router = useRouter();

    const confirm = useBoolean();

    const tabs = useTabs('overview');

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [selectedDate, setSelectedDate] = useState(null);

    const [endDate, setEndDate] = useState(null);

    const popover = usePopover();

    const toggleMainInfo = useBoolean(true);

    const { data: itemById, refetch: refetchProject } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const handleDaysChange = (e) => {
        const days = parseInt(e.target.value, 10) || 1;
        setDaysToInstall(days);
        const newEndDate = dayjs(itemById?.startDate).add(days, 'day');
        setEndDate(newEndDate);
        setFormChanged(!Number.isNaN(days) && days > 0);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setFormChanged(true);
    };

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
            endDate: itemById?.endDate ? dayjs(itemById?.endDate).toISOString() : null,
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
        getValues,
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
            setSelectedDate(isStartDate ? dayjs(itemById?.startDate) : dayjs(itemById?.endDate));
            setDaysToInstall(diffDays);
            setFormChanged(false);
        }
    }, [itemById, userLogged?.data, reset, diffDays, isStartDate]);


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
                                        value={selectedDate}
                                        onChange={handleDateChange}
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
                                                const newEndDate = endDate ? dayjs(endDate).add(-1, 'day') : dayjs(selectedDate).add(-1, 'day');
                                                setEndDate(newEndDate);
                                                setDaysToInstall(daysToInstall - 1);
                                                setFormChanged(true);
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

                                        <IconButton sx={{ width: 50, height: 50, mt: 1 }} onClick={() => {
                                            const newEndDate = endDate ? dayjs(endDate).add(1, 'day') : dayjs(selectedDate).add(1, 'day');
                                            setEndDate(newEndDate);
                                            setDaysToInstall(daysToInstall  + 1);
                                            setFormChanged(true);
                                        }}>
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


    const renderProject = (
        <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
            <DialogTitle>{isEdit ? 'Update' : 'Add'} {isStartDate ? 'Install' : 'Closing'} date to Project {itemById?.name} </DialogTitle>

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
