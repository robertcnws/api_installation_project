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

import { fDate, fIsSame } from 'src/utils/format-time';
import { totalPercentageProjectStage } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';



// ----------------------------------------------------------------------

export function ProjectEditModalDatesView({
    isEdit,
    isStartDate,
    isInspectionDate,
    isFinishPermissionDate,
    project,
    open,
    onClose,
}) {

    const [diffDays, setDiffDays] = useState(1);

    useEffect(() => {
        if (project?.endDate) {
            const diff = dayjs(project?.endDate).diff(dayjs(project?.startDate), 'day');
            setDiffDays(diff);
        }
    }, [project?.endDate, project?.startDate]);

    // const diffDays = useMemo(
    //     () => project?.endDate ? dayjs(project?.endDate).diff(dayjs(project?.startDate), 'day') : 1, [project?.endDate, project?.startDate]
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
        const newEndDate = dayjs(project?.startDate).add(days, 'day');
        setEndDate(newEndDate);
        setFormChanged(!Number.isNaN(days) && days > 0);
    };

    const handleDateChange = useCallback(
        (date) => {
            if (!isInspectionDate && !isFinishPermissionDate) {
                const currentStage = project?.currentStage;
                if (currentStage?.name === CONFIG.stages.preparation && totalPercentageProjectStage(project, CONFIG.stages.preparation, CONFIG) < 50) {
                    const today = dayjs().format('YYYY-MM-DD');
                    const formatDate = dayjs(date).format('YYYY-MM-DD');
                    const isSame = fIsSame(today, formatDate);
                    if (isSame) {
                        const message = isStartDate ? 'You have to finish all tasks in the previous stages before setting the install date.' :
                            'You have to finish all tasks in the previous stages before setting the closing date.';
                        setConfirmValidInstallMessage(message);
                        confirmValidInstallDate.onTrue();
                    }
                }
                else {
                    setSelectedDate(date);
                    setFormChanged(true);
                    setConfirmValidInstallMessage(null);
                }
            }
            else {
                setSelectedDate(date);
                setFormChanged(true);
                setConfirmValidInstallMessage(null);
            }
        },
        [project, confirmValidInstallDate, isStartDate, isInspectionDate, isFinishPermissionDate]
    );

    const ProjectDialogSchema = zod.object({
        name: zod.string().min(1, { message: 'Name is required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            id: project?.id || '',
            name: project?.name || '',
            number: project?.number || '',
            userReporter: userLogged?.data,
            startDate: project?.startDate || null,
            endDate: project?.endDate ? dayjs(project?.endDate).toISOString() : null,
            finishPermissionDate: project?.finishPermissionDate ? dayjs(project?.finishPermissionDate).toISOString() : null,
            inspectionDate: project?.inspectionDate ? dayjs(project?.inspectionDate).toISOString() : null,
        }),
        [project, userLogged]
    );

    const methods = useForm({
        mode: 'all',
        resolver: zodResolver(ProjectDialogSchema),
        defaultValues,
    });

    const {
        reset,
        handleSubmit,
        formState: { isSubmitting },
    } = methods;


    useEffect(() => {
        if (project) {
            reset({
                id: project.id || '',
                name: project.name || '',
                number: project.number || '',
                userReporter: userLogged?.data,
                startDate: project.startDate || null,
                endDate: project.endDate || null,
                inspectionDate: project.inspectionDate || null,
                finishPermissionDate: project.finishPermissionDate || null,
            });
            setSelectedDate(
                isStartDate ? dayjs(project?.startDate) :
                    isInspectionDate ? dayjs(project?.inspectionDate) :
                        isFinishPermissionDate ? dayjs(project?.finishPermissionDate) : dayjs(project?.endDate));
            setDaysToInstall(diffDays);
            setFormChanged(false);
        }
    }, [project, userLogged?.data, reset, diffDays, isStartDate, isInspectionDate, isFinishPermissionDate]);


    const minDate = useMemo(() => {
        if (isStartDate || isInspectionDate) {
            if (project?.startDate) {
                return dayjs(project?.startDate);
            }
            return dayjs(project?.salesOrder?.date);
        }
        if (isFinishPermissionDate) {
            if (project?.inspectionDate) {
                return dayjs(project?.inspectionDate);
            }
            return dayjs(project?.salesOrder?.date);
        }
        return dayjs(project?.salesOrder?.date);
    }, [isStartDate, isInspectionDate, isFinishPermissionDate, project]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const field = isStartDate ? 'startDate' : isInspectionDate ? 'inspectionDate' : 'endDate';
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

        if (isInspectionDate) {
            formData.append('inspectionDate', fDate(selectedDate));
        }

        if (isFinishPermissionDate) {
            formData.append('finishPermissionDate', fDate(selectedDate));
        }


        const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project.id}/`, formData, {
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

            // refetchProject?.();

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

            formData.append('dateType',
                isStartDate ? 'startDate' :
                    isInspectionDate ? 'inspectionDate' :
                        isFinishPermissionDate ? 'finishPermissionDate' : 'endDate'
            );


            const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project.id}/remove-date/`, formData, {
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

                onClose();

            } catch (error) {
                console.error(error);
            }
        }, [onClose, project, userLogged, isStartDate, isInspectionDate, isFinishPermissionDate]);

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
                                            isStartDate ? 'Install Date' :
                                                isInspectionDate ? 'Inspection Date' :
                                                    isFinishPermissionDate ? 'Finish Date' : 'Closing Date'
                                        }
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        minDate={minDate}
                                        maxDate={
                                            isStartDate ? dayjs(project?.endDate) : null
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
                                                    const newEndDate = dayjs(project?.startDate).add(newDays, 'day');
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
                                            value={project?.endDate ? daysToInstall + 1 : daysToInstall}
                                            onChange={handleDaysChange}
                                        />

                                        <IconButton
                                            sx={{ width: 50, height: 50, mt: 1 }}
                                            onClick={() => {
                                                const newDays = daysToInstall + 1;
                                                setDaysToInstall(newDays);
                                                const newEndDate = dayjs(project?.startDate).add(newDays, 'day');
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


    const renderProject = (
        <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
            <DialogTitle>
                {isEdit ? 'Update' : 'Add'} {
                    isStartDate ? 'Install' :
                        isInspectionDate ? 'Inspection' :
                            isFinishPermissionDate ? 'Finish' : 'Closing'
                } date to Project {project?.name}
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
                        disabled={!formChanged || confirmValidInstallMessage !== null}
                    >
                        {isEdit ? 'Update' : 'Add'}
                    </LoadingButton>
                    <LoadingButton
                        type="button"
                        variant="contained"
                        loading={isRemovingDate}
                        onClick={handleRemoveDate}
                        color='error'
                        disabled={!project?.startDate}
                    >
                        Remove {isStartDate ?
                            'install' : isInspectionDate ?
                                'inspection' : isFinishPermissionDate ? 'finish' : 'closing'} date
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
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
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
