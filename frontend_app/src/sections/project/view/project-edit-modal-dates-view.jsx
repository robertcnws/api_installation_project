import axios from 'axios';
import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Grid, Dialog, Switch, TextField, IconButton, Typography, DialogTitle, DialogActions } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { getServiceInstaller } from 'src/utils/service-tasks-utils';
import { fDate, fIsSame, getDatesBetween } from 'src/utils/format-time';
import { getProjectInstallers, totalPercentageProjectStage } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

export function ProjectEditModalDatesView({
    isEdit,
    isStartDate,
    isInspectionDate,
    isFinishPermissionDate,
    project,
    refetchProject,
    open,
    onClose,
}) {

    const [diffDays, setDiffDays] = useState(1);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        loadedProjects,
        loadedServices,
    } = useDataContext();

    const busyDays = useMemo(() => {
        const installer = getProjectInstallers(project, CONFIG);
        if (!installer) return [];

        const installerProjects = loadedProjects?.filter(
            (p) => getProjectInstallers(p, CONFIG)?.id === installer.id
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
        const finalDays = occupiedDays.filter((date) => fDate(date) !== fDate(project?.startDate));

        return Array.from(new Set(finalDays));

    }, [loadedProjects, loadedServices, project]);

    // console.log('busyDays', busyDays);

    useEffect(() => {
        let diff = 1;
        if (isStartDate && project?.endDate) {
            diff = project?.duration || 1;
        }
        else if (isInspectionDate && project?.inspectionEndDate) {
            diff = project?.inspectionDuration || 1;
        }
        else if (isFinishPermissionDate && project?.finishPermissionEndDate) {
            diff = project?.finishPermissionDuration || 1;
        }
        setDiffDays(diff);
    }, [
        isStartDate,
        project?.endDate,
        project?.startDate,
        project?.duration,
        isInspectionDate,
        project?.inspectionEndDate,
        project?.inspectionDate,
        project?.inspectionDuration,
        isFinishPermissionDate,
        project?.finishPermissionEndDate,
        project?.finishPermissionDate,
        project?.finishPermissionDuration
    ]);

    const [daysToInstall, setDaysToInstall] = useState(1);

    useEffect(() => {
        setDaysToInstall(diffDays);
    }, [diffDays]);

    // console.log('daysToInstall', daysToInstall);

    const [formChanged, setFormChanged] = useState(false);

    const confirmValidInstallDate = useBoolean();

    const [confirmValidInstallMessage, setConfirmValidInstallMessage] = useState(null);

    const [isRemovingDate, setIsRemovingDate] = useState(false);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [selectedDate, setSelectedDate] = useState(project?.startDate ?
        (isStartDate ? dayjs(project?.startDate) : isInspectionDate ? dayjs(project?.inspectionDate) :
            isFinishPermissionDate ? dayjs(project?.finishPermissionDate) : dayjs(project?.endDate)) : null);

    const [endDate, setEndDate] = useState(null);

    const toggleMainInfo = useBoolean(true);

    useEffect(() => {
        if (project && project?.startDate) {
            setSelectedDate(
                isStartDate ? dayjs(project?.startDate) :
                    isInspectionDate ? dayjs(project?.inspectionDate) :
                        isFinishPermissionDate ? dayjs(project?.finishPermissionDate) : dayjs(project?.endDate)
            );
        }
    }, [project, isStartDate, isInspectionDate, isFinishPermissionDate]);


    const handleDaysChange = (e) => {
        const days = parseInt(e.target.value, 10) || 1;
        setDaysToInstall(days);
        const dateToTake = isStartDate ? project?.startDate :
            isInspectionDate ? project?.inspectionDate :
                isFinishPermissionDate ? project?.finishPermissionDate : project?.startDate;
        const newEndDate = dayjs(dateToTake).add(days, 'day');
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


    const [isPartDays, setIsPartDays] = useState(false);

    useEffect(() => {
        if (project) {
            setIsPartDays(
                isStartDate ? project?.isPartDays :
                    isInspectionDate ? project?.inspectionIsPartDays :
                        isFinishPermissionDate ? project?.finishPermissionIsPartDays : false
            );
        }
    }, [project, isStartDate, isInspectionDate, isFinishPermissionDate]);

    const handleSwitch = useCallback((event) => {
        const newVal = event.target.checked;
        setIsPartDays(newVal);
        if (isStartDate) {
            setFormChanged(newVal !== project?.isPartDays);
        }
        else if (isInspectionDate) {
            setFormChanged(newVal !== project?.inspectionIsPartDays);
        }
        else if (isFinishPermissionDate) {
            setFormChanged(newVal !== project?.finishPermissionIsPartDays);
        }
    }, [
        project?.isPartDays,
        project?.inspectionIsPartDays,
        project?.finishPermissionIsPartDays,
        isStartDate,
        isInspectionDate,
        isFinishPermissionDate
    ]);

    const minDate = useMemo(() => dayjs(project?.salesOrder?.date), [project]);


    const handleClose = useCallback(() => {
        setFormChanged(false);
        setDiffDays(1);
        setDaysToInstall(1);
        setIsPartDays(false);
        setConfirmValidInstallMessage(null);
        setSelectedDate(null);
        onClose?.();
    }, [onClose]);


    const onSubmit = (async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const field = isStartDate ? 'startDate' : isInspectionDate ? 'inspectionDate' : isFinishPermissionDate ? 'finishPermissionDate' : 'endDate';
        formData.append(field, dayjs(selectedDate).format('YYYY-MM-DD'));
        const newEndDate = dayjs(selectedDate).add(daysToInstall, 'day');
        if (isStartDate) {
            formData.append('endDate', newEndDate.format('YYYY-MM-DD'));
            formData.append('isPartDays', isPartDays ? 'true' : 'false');
            formData.append('duration', daysToInstall);
        }

        if (isInspectionDate) {
            formData.append('inspectionEndDate', newEndDate.format('YYYY-MM-DD'));
            formData.append('inspectionIsPartDays', isPartDays ? 'true' : 'false');
            formData.append('inspectionDuration', daysToInstall);
        }

        if (isFinishPermissionDate) {
            formData.append('finishPermissionEndDate', newEndDate.format('YYYY-MM-DD'));
            formData.append('finishPermissionIsPartDays', isPartDays ? 'true' : 'false');
            formData.append('finishPermissionDuration', daysToInstall);
        }

        // console.log('formData', formData);


        const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project.id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Project (${project?.name}) success!`,
                error: `Update Project (${project?.name}) error!`,
            });

            setIsSubmitting(false);

            const response = await promise;

            if (!response.data) {
                return;
            }

            refetchProject?.();

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
                                        // maxDate={
                                        //     isStartDate ? dayjs(project?.endDate) : null
                                        // }
                                        shouldDisableDate={isStartDate ? (date) => {
                                            if (date.isBefore(minDate, 'day')) return true;
                                            if (busyDays.some(disabledDate => date.isSame(disabledDate, 'day'))) {
                                                return true;
                                            }
                                            return false;
                                        } : null}
                                        inputFormat="YYYY-MM-DD"
                                        sx={{ width: '100%' }}
                                    />
                                </Box>
                            </Stack>
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
                                                const dateToTake = isStartDate ? project?.startDate :
                                                    isInspectionDate ? project?.inspectionDate :
                                                        isFinishPermissionDate ? project?.finishPermissionDate : project?.startDate;
                                                const newEndDate = dayjs(dateToTake).add(newDays, 'day');
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
                                            const dateToTake = isStartDate ? project?.startDate :
                                                isInspectionDate ? project?.inspectionDate :
                                                    isFinishPermissionDate ? project?.finishPermissionDate : project?.startDate;
                                            const newEndDate = dayjs(dateToTake).add(newDays, 'day');
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
                                        checked={
                                            !!(project && isPartDays)
                                        }
                                        onChange={(e) => handleSwitch(e)}
                                        sx={{ maxWidth: 56, mt: -1 }}
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
        <Dialog fullWidth maxWidth="xs" open={open} onClose={handleClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box className="dialog-title-icon">
                        <Iconify icon="mdi:calendar" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isEdit ? 'Update' : 'Add'} {
                            isStartDate ? 'Install' :
                                isInspectionDate ? 'Inspection' :
                                    isFinishPermissionDate ? 'Finish' : 'Closing'
                        } date to Project {project?.name}
                    </Typography>
                </Box>
            </DialogTitle>

            {/* <Form methods={methods} onSubmit={onSubmit}> */}

            <Stack
                spacing={2.5}
                justifyContent="center"
                sx={{ p: 2.5 }}
            >

                {renderMainInfo}


            </Stack>
            <DialogActions>
                <LoadingButton
                    type="button"
                    variant="contained"
                    loading={isSubmitting}
                    disabled={!formChanged || confirmValidInstallMessage !== null}
                    onClick={onSubmit}
                >
                    {isEdit ? 'Update' : 'Add'}
                </LoadingButton>
                <LoadingButton
                    type="button"
                    variant="contained"
                    loading={isRemovingDate}
                    onClick={handleRemoveDate}
                    color='error'
                    disabled={
                        isStartDate ? !project?.startDate :
                            isInspectionDate ? !project?.inspectionDate :
                                isFinishPermissionDate ? !project?.finishPermissionDate : false}
                >
                    Remove {isStartDate ?
                        'install' : isInspectionDate ?
                            'inspection' : isFinishPermissionDate ? 'finish' : 'closing'} date
                </LoadingButton>
                <Button variant="outlined" onClick={handleClose}>
                    Cancel
                </Button>
            </DialogActions>
            {/* </Form> */}
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
