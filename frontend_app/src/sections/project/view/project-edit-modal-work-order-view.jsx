import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import {
    Box,
    Stack,
    Dialog,
    Button,
    TextField,
    Typography,
    IconButton,
    DialogTitle,
    DialogActions,
    Autocomplete,
    Chip,
    Paper,
    alpha,
    useTheme,
    Tooltip,
    FormControlLabel,
    Radio,
    RadioGroup,
    Switch,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useDataContext } from 'src/auth/context/data/data-context';
import { isInstaller, isProjectManager } from 'src/utils/check-permissions';
import axios from 'axios';
import { CONFIG } from 'src/config-global';
import { LoadingButton } from '@mui/lab';
import { useBoolean } from 'src/hooks/use-boolean';
import { InstallationCrewCreateModal } from 'src/sections/installation-crew/view/installation-crew-create-modal';
import { ConfirmDialog } from 'src/components/custom-dialog';

// Mock data

const MOCK_WORK_TYPES = [
    { id: 1, name: 'Installation' },
    { id: 2, name: 'Finish' },
    { id: 3, name: 'Inspection' },
    { id: 4, name: 'Service' },
];

const MOCK_INSPECTION_TYPES = [
    { id: 1, name: 'Book and Fasteners' },
    { id: 2, name: 'Final' },
]

const buildWorkOrderName = (project, workType, inspectionType) => {
    const baseDate = dayjs().format('YYYY-MM-DD');

    if (!project?.name) {
        return `WO ${baseDate}`;
    }

    if (workType?.name?.toLowerCase() === 'inspection') {
        if (inspectionType) {
            return `WO for Inspection (${inspectionType.name.toUpperCase()}) in ${project.name}, date: ${baseDate}`;
        }
        return `WO for Inspection in ${project.name}, date: ${baseDate}`;
    }

    if (workType?.name) {
        return `WO for ${workType.name} in ${project.name}, date: ${baseDate}`;
    }

    return `WO in ${project.name}, date: ${baseDate}`;
};

export function ProjectEditModalWorkOrderView({
    open,
    onClose,
    workOrder = null,
    setWorkerOrder = null,
    eventSingleId = null,
    project = null,
    refetchProject = null,
    onCloseCalendar = null,
}) {
    const theme = useTheme();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isFinishing, setIsFinishing] = useState(false);

    const openModalAddCrew = useBoolean(false);

    const confirmFinishWorkOrder = useBoolean(false);

    const {
        // loadedStages,
        loadedUsers,
        loadedInstallationCrews,
        refetchInstallationCrews,
    } = useDataContext();

    const productOptions = useMemo(
        () => project?.salesOrder?.line_items?.filter((product) => product.line_item_type === 'goods') || [],
        [project]
    );

    const [formData, setFormData] = useState({
        name: workOrder?.woName
            || workOrder?.name
            || buildWorkOrderName(project, null, null),
        description: workOrder?.description || '',
        date: workOrder?.start_date || new Date().toISOString().split('T')[0],
        duration: workOrder?.duration || 1,
        // projectStage: workOrder?.project_stage || null,
        usersAssignees: workOrder?.users_assignees || [],
        products: workOrder?.items || [],
        workType: workOrder?.work_type || null,
        inspectionType: workOrder?.inspection_type || null,
        installerCrews: workOrder?.installer_crews || [],
    });

    const [errors, setErrors] = useState({});

    const dynamicNewName = useMemo(
        () => buildWorkOrderName(project, formData.workType, formData.inspectionType),
        [project, formData.workType, formData.inspectionType]
    );

    useEffect(() => {
        if (!workOrder) {
            setFormData((prev) => ({
                ...prev,
                name: dynamicNewName,
            }));
        }
    }, [dynamicNewName, workOrder]);

    useEffect(() => {
        if (open) {
            setFormData({
                name: workOrder?.woName
                    || workOrder?.name
                    || buildWorkOrderName(project, null, null),
                description: workOrder?.description || '',
                date: workOrder?.start_date || new Date().toISOString().split('T')[0],
                duration: workOrder?.duration || 1,
                // projectStage: workOrder?.project_stage || null,
                usersAssignees: workOrder?.users_assignees || [],
                products: workOrder?.items || [],
                workType: workOrder?.work_type || null,
                inspectionType: workOrder?.inspection_type || null,
                installerCrews: workOrder?.installer_crews || [],
            });
            setErrors({});
        } else {
            // Clear errors when modal closes
            setErrors({});
        }
    }, [open, workOrder, project]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        const validValue = Array.isArray(value) ? value.length > 0 : Boolean(value);
        if (validValue && errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }

        const dependentFields = ['usersAssignees', 'installerCrews'];
        if (dependentFields.includes(field)) {
            if (validValue && (errors.usersAssignees || errors.installerCrews)) {
                setErrors(prev => ({
                    ...prev,
                    usersAssignees: null,
                    installerCrews: null,
                }));
            }
            else if (!validValue) {
                const hasInstallerCrew =
                    field === 'installerCrews'
                        ? Array.isArray(value) && value.length > 0
                        : Array.isArray(formData.installerCrews) && formData.installerCrews.length > 0;
                const hasUsersAssignees =
                    field === 'usersAssignees'
                        ? Array.isArray(value) && value.length > 0
                        : Array.isArray(formData.usersAssignees) && formData.usersAssignees.length > 0;

                if (!hasInstallerCrew && !hasUsersAssignees) {
                    const msg = 'Users Assignees or Installer Crew are required';
                    setErrors(prev => ({
                        ...prev,
                        usersAssignees: msg,
                        installerCrews: msg,
                    }));
                }
            }
        }

    }, [errors, formData]);

    const handleWorkTypeChange = useCallback(
        (event, newValue) => {
            setFormData((prev) => ({
                ...prev,
                workType: newValue,
                products:
                    newValue && newValue.name?.toLowerCase() === 'installation'
                        ? productOptions
                        : [],
                usersAssignees: [],
                installerCrews: [],
            }));

            const validValue = Boolean(newValue);
            if (validValue && errors.workType) {
                setErrors((prev) => ({ ...prev, workType: null }));
            }
            else if (!validValue) {
                setErrors((prev) => ({ ...prev, workType: 'Work type is required' }));
            }
        },
        [productOptions, errors]
    );

    const handleNumberChange = useCallback((field, increment) => {
        setFormData(prev => ({
            ...prev,
            [field]: Math.max(1, prev[field] + increment)
        }));
    }, []);

    const handleDateChange = useCallback((date) => {
        setFormData(prev => ({
            ...prev,
            date: dayjs(date).format('YYYY-MM-DD')
        }));
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};

        // Name
        if (!formData.name?.trim()) {
            newErrors.name = 'Name is required';
        }

        // Description
        if (!formData.description?.trim()) {
            newErrors.description = 'Description is required';
        }

        // Work type
        if (!formData.workType) {
            newErrors.workType = 'Work type is required';
        }

        // Inspection type (solo si workType = inspection)
        if (
            formData.workType?.name?.toLowerCase() === 'inspection' &&
            !formData.inspectionType
        ) {
            newErrors.inspectionType = 'Inspection type is required';
        }

        // Installer crew / users assignees: al menos uno de los dos
        const hasInstallerCrew =
            Array.isArray(formData.installerCrews) && formData.installerCrews.length > 0;
        const hasUsersAssignees =
            Array.isArray(formData.usersAssignees) && formData.usersAssignees.length > 0;

        if (!hasInstallerCrew && !hasUsersAssignees) {
            const msg = 'Users Assignees or Installer Crew are required';
            newErrors.usersAssignees = msg;
            newErrors.installerCrews = msg;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);


    const handleClose = useCallback(() => {
        onClose();
        setErrors({});
        setFormData({
            name: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            duration: 1,
            // projectStage: null,
            usersAssignees: [],
            products: [],
            workType: null,
            inspectionType: null,
            installerCrews: [],
        });
        setWorkerOrder?.(null);
    }, [onClose, setWorkerOrder]);

    const handleSubmit = useCallback(async () => {
        if (validateForm()) {

            setIsSubmitting(true);

            console.log('Submitting work order:', formData);

            const formToSubmit = new FormData();

            const workOrderId = eventSingleId || workOrder?.id || '';

            formToSubmit.append('userReporter', JSON.stringify(userLogged?.data));
            formToSubmit.append('name', formData.name);
            formToSubmit.append('description', formData.description);
            formToSubmit.append('startDate', formData.date);
            formToSubmit.append('duration', formData.duration);
            // formToSubmit.append('projectStage', JSON.stringify(formData.projectStage));
            formToSubmit.append('usersAssignees', JSON.stringify(formData.usersAssignees));
            formToSubmit.append('workType', JSON.stringify(formData.workType));
            formToSubmit.append('items', JSON.stringify(formData.products));
            formToSubmit.append('workOrderId', workOrderId);
            formToSubmit.append('inspectionType', JSON.stringify(formData.inspectionType));
            formToSubmit.append('installerCrews', JSON.stringify(formData.installerCrews));

            const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project?.id}/manage-work-order/`,
                formToSubmit,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

            try {
                toast.promise(promise, {
                    loading: 'Loading...',
                    success: workOrder ? 'Work order updated successfully!' : 'Work order created successfully!',
                    error: workOrder ? 'Error updating work order!' : 'Error creating work order!',
                });

                const response = await promise;

                if (!response.data) {
                    return;
                }

                setIsSubmitting(false);

                refetchProject?.();

                handleClose();

            } catch (error) {
                console.error(error);
            }

        } else {
            toast.error('Please fill in all required fields');
        }
    }, [formData, validateForm, handleClose, workOrder, userLogged, project, refetchProject, eventSingleId]);

    const isEditing = Boolean(workOrder);

    const hasChanges = useMemo(() => {
        if (!workOrder) return true; // Creating new work order

        return (
            formData.name.trim() !== (workOrder?.woName?.trim() || workOrder?.name?.trim() || '') ||
            formData.description.trim() !== (workOrder?.description?.trim() || '') ||
            formData.date !== (workOrder?.start_date || '') ||
            formData.duration !== (workOrder?.duration || 1) ||
            // (formData.projectStage?.id || null) !== (workOrder?.project_stage?.id || null) ||
            JSON.stringify(formData.usersAssignees.map(u => u.id).sort()) !== JSON.stringify((workOrder?.users_assignees || []).map(u => u.id).sort()) ||
            (formData.workType?.id || null) !== (workOrder?.work_type?.id || null) ||
            JSON.stringify(formData.products.map(p => p.line_item_id).sort()) !==
            JSON.stringify((workOrder?.items || []).map(p => p.line_item_id).sort()) ||
            (formData.workType?.name?.toLowerCase() === 'inspection' ?
                formData.inspectionType?.id !== (workOrder?.inspection_type?.id || null) :
                false) ||
            JSON.stringify(formData.installerCrews.map(u => u.id).sort()) !== JSON.stringify((workOrder?.installer_crews || []).map(u => u.id).sort())
        );
    }, [formData, workOrder]);

    const filteredUsers = useMemo(() => {
        const initialUsers = loadedUsers?.filter(
            (u) => u.isActive
        ) || [];
        if (!formData.workType) return [];
        if (formData.workType.name?.toLowerCase() === 'installation') {
            return initialUsers.filter((u) => isInstaller(u.userRole.name) ||
                isProjectManager(u.userRole.name));
        }
        return initialUsers;
    }, [formData.workType, loadedUsers]);

    const onFinishWorkOrder = useCallback(async () => {
        if (!workOrder) return;
        setIsFinishing(true);
        const title = workOrder.is_finished ? 'Reopen' : 'Finish';
        try {
            const workOrderId = eventSingleId || workOrder?.id || '';
            await axios.post(`${CONFIG.apiUrl}/projects/finish/project/${project?.id}/work-order/${workOrderId}/`, {
                userReporter: JSON.stringify(userLogged?.data)
            });
            toast.success(`${title} ${workOrder.name} successfully!`);
            // setWorkOrders((prev) => prev.filter((order) => order.id !== wo.id));
        }
        catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || `${title} work order failed!`);
        } finally {
            setIsFinishing(false);
            if (onCloseCalendar) {
                onCloseCalendar();
            }
        }
    }, [workOrder, setIsFinishing, userLogged, project, eventSingleId, onCloseCalendar]);

    return (
        <>
            <Dialog
                fullWidth
                maxWidth="xl"
                open={open}
                onClose={handleClose}
                scroll="paper"
                sx={{
                    '& .MuiDialog-paper': {
                        overflowX: 'hidden !important',
                    },
                    '& .MuiDialog-container': {
                        overflowX: 'hidden !important',
                    },
                }}
                PaperProps={{
                    sx: {
                        background: theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg,
                            ${alpha(theme.palette.background.paper, 0.98)} 0%,
                            ${alpha(theme.palette.grey[800], 0.95)} 100%)`
                            : `linear-gradient(135deg,
                            ${alpha('#FFFFFF', 0.98)} 0%,
                            ${alpha(theme.palette.grey[50], 0.95)} 100%)`,
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha('#00B8D9', 0.4)}`,
                        boxShadow: `
                        0 20px 60px ${alpha('#000000', 0.6)},
                        0 0 100px ${alpha('#00B8D9', 0.15)},
                        inset 0 1px 0 ${alpha(theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000', 0.05)}
                    `,
                        position: 'relative',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowX: 'hidden !important',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: `linear-gradient(90deg,
                            transparent 0%,
                            #00B8D9 50%,
                            transparent 100%)`,
                            animation: 'slideGlow 3s ease-in-out infinite',
                            zIndex: 1,
                        },
                        '@keyframes slideGlow': {
                            '0%': { transform: 'translateX(-100%)' },
                            '100%': { transform: 'translateX(100%)' },
                        },
                    }
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            background: `radial-gradient(circle at center,
                            ${alpha('#00B8D9', 0.12)} 0%,
                            ${alpha('#000000', 0.85)} 100%)`,
                            backdropFilter: 'blur(10px)',
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: `linear-gradient(90deg,
                        ${alpha('#00B8D9', 0.1)} 0%,
                        transparent 100%)`,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        flexShrink: 0,
                        zIndex: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box className="dialog-title-icon">
                            <Iconify icon="mdi:clipboard-text-outline" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {isEditing ? 'Edit Work Order ' : 'Create Work Order '} in Project: {project?.name}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': {
                                background: alpha('#FF5630', 0.1),
                                color: '#FF5630',
                            },
                        }}
                    >
                        <Iconify icon="eva:close-fill" />
                    </IconButton>
                </DialogTitle>

                {/* Scrollable Content */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: 3,
                        width: '100%',
                        boxSizing: 'border-box',
                        '&::-webkit-scrollbar': {
                            width: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                            background: alpha(theme.palette.grey[400], 0.1),
                            borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: alpha('#00B8D9', 0.3),
                            borderRadius: 4,
                            '&:hover': {
                                background: alpha('#00B8D9', 0.5),
                            },
                        },
                        '&::-webkit-scrollbar-horizontal': {
                            display: 'none',
                        },
                    }}
                >
                    <Stack spacing={3} sx={{ width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
                        {/* Name Field */}
                        <m.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%', minWidth: 0 }}>
                                <TextField
                                    label="Work Order Name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#00B8D9',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#00B8D9',
                                                borderWidth: 2,
                                                boxShadow: `0 0 10px ${alpha('#00B8D9', 0.3)}`,
                                            }
                                        },
                                        width: { xs: '100%', md: '50%' },
                                    }}
                                />
                                <DatePicker
                                    label='Date'
                                    value={dayjs(formData.date)}
                                    onChange={handleDateChange}
                                    inputFormat="YYYY-MM-DD"
                                    sx={{
                                        width: '100%',
                                        flex: 1,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#00A76F',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#00A76F',
                                                borderWidth: 2,
                                                boxShadow: `0 0 10px ${alpha('#00A76F', 0.3)}`,
                                            }
                                        }
                                    }}
                                />

                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'end', gap: 1 }}>
                                    <TextField
                                        type="number"
                                        label="Duration (days)"
                                        value={formData.duration}
                                        onChange={(e) => handleInputChange('duration', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                        inputProps={{ min: 1 }}
                                        sx={{
                                            flex: 1,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#FFAB00',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#FFAB00',
                                                    borderWidth: 2,
                                                    boxShadow: `0 0 10px ${alpha('#FFAB00', 0.3)}`,
                                                }
                                            }
                                        }}
                                    />
                                    <Stack>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleNumberChange('duration', 1)}
                                            sx={{
                                                bgcolor: alpha('#22C55E', 0.1),
                                                color: '#22C55E',
                                                '&:hover': {
                                                    bgcolor: alpha('#22C55E', 0.2),
                                                    transform: 'scale(1.1)',
                                                },
                                                transition: 'all 0.2s ease-in-out',
                                            }}
                                        >
                                            <Iconify icon="eva:plus-fill" width={16} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleNumberChange('duration', -1)}
                                            sx={{
                                                bgcolor: alpha('#FF5630', 0.1),
                                                color: '#FF5630',
                                                '&:hover': {
                                                    bgcolor: alpha('#FF5630', 0.2),
                                                    transform: 'scale(1.1)',
                                                },
                                                transition: 'all 0.2s ease-in-out',
                                            }}
                                        >
                                            <Iconify icon="eva:minus-fill" width={16} />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            </Stack>

                        </m.div>

                        {/* Description Field */}
                        <m.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                error={!!errors.description}
                                helperText={errors.description}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#8E33FF',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#8E33FF',
                                            borderWidth: 2,
                                            boxShadow: `0 0 10px ${alpha('#8E33FF', 0.3)}`,
                                        }
                                    }
                                }}
                            />
                        </m.div>

                        {/* Date and Duration Row */}
                        {/* <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        
                    </m.div> */}
                        <m.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                        >
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%', minWidth: 0 }}>

                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>

                                    <Autocomplete
                                        options={MOCK_WORK_TYPES}
                                        getOptionLabel={(option) => option.name}
                                        value={formData.workType}
                                        onChange={handleWorkTypeChange}
                                        // onChange={(event, newValue) => handleInputChange('workType', newValue)}
                                        sx={{ flex: 1 }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Work Type"
                                                error={!!errors.workType}
                                                helperText={errors.workType}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#8E33FF',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#8E33FF',
                                                            borderWidth: 2,
                                                            boxShadow: `0 0 10px ${alpha('#8E33FF', 0.3)}`,
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                    {formData?.workType && formData?.workType?.name.toLowerCase() === 'inspection' && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            <RadioGroup
                                                row
                                                sx={{ mt: 1 }}
                                                value={formData.inspectionType?.id || ''}
                                                onChange={(e) => {
                                                    const selectedId = Number(e.target.value);
                                                    const selected = MOCK_INSPECTION_TYPES.find((type) => type.id === selectedId) || null;
                                                    handleInputChange('inspectionType', selected);
                                                }}
                                            >
                                                {MOCK_INSPECTION_TYPES.map((type) => (
                                                    <FormControlLabel
                                                        key={type.id}
                                                        value={type.id}
                                                        control={
                                                            <Radio
                                                                sx={{
                                                                    color: errors.inspectionType ? alpha('#FF5630', 0.7) : alpha('#00B8D9', 0.7),
                                                                    '&.Mui-checked': { color: '#00B8D9' },
                                                                }}
                                                            />
                                                        }
                                                        label={type.name}
                                                        sx={{
                                                            color: errors.inspectionType ? '#FF5630' : 'inherit',
                                                        }}
                                                    />
                                                ))}
                                            </RadioGroup>

                                            {/* 👇 Mensaje de error */}
                                            {errors.inspectionType && (
                                                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                                                    {errors.inspectionType}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                        </m.div>

                        {/* User Assignee */}
                        {formData.workType && (
                            <m.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.5 }}
                            >
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%', minWidth: 0 }}>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                                        <Autocomplete
                                            multiple
                                            options={filteredUsers || []}
                                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                            value={formData.usersAssignees}
                                            onChange={(event, newValue) => handleInputChange('usersAssignees', newValue)}
                                            renderOption={(props, option) => {
                                                const { key, ...liProps } = props;
                                                return (
                                                    <Box component="li" key={option.id} {...liProps}>
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {option.name || `${option.firstName} ${option.lastName}`}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                );
                                            }}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => {
                                                    const tagProps = getTagProps({ index });
                                                    const { key, ...restTagProps } = tagProps;

                                                    return (
                                                        <Tooltip key={option.id} title={option.name || `${option.firstName} ${option.lastName}`} arrow>
                                                            <Chip
                                                                key={option.id}
                                                                {...restTagProps}
                                                                label={(
                                                                    <Stack spacing={0.5}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                            {option.name || `${option.firstName} ${option.lastName}`}
                                                                        </Typography>
                                                                    </Stack>
                                                                )}
                                                                size="small"
                                                                sx={{
                                                                    background: `linear-gradient(45deg, #00B8D9, #8E33FF)`,
                                                                    color: 'white',
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: 'white',
                                                                        '&:hover': { color: '#FF5630' },
                                                                    },
                                                                    height: 50,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    );
                                                })
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Users Assignees"
                                                    error={!!errors.usersAssignees}
                                                    helperText={errors.usersAssignees}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#22C55E',
                                                            },
                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#22C55E',
                                                                borderWidth: 2,
                                                                boxShadow: `0 0 10px ${alpha('#22C55E', 0.3)}`,
                                                            }
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            width: '100%',
                                            gap: 1,
                                        }}
                                    >
                                        <Autocomplete
                                            multiple
                                            options={loadedInstallationCrews || []}
                                            getOptionLabel={(option) => option.name}
                                            value={formData.installerCrews}
                                            onChange={(event, newValue) => handleInputChange('installerCrews', newValue)}
                                            sx={{ flex: 1, minWidth: 0 }}          // 👈 CLAVE: que el Autocomplete crezca
                                            renderOption={(props, option) => {
                                                const { key, ...liProps } = props;
                                                return (
                                                    <Box component="li" key={option.id} {...liProps}>
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {option.name}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ color: 'text.disabled', fontStyle: 'italic' }}
                                                            >
                                                                {option.usersInstallers
                                                                    ?.map((u) => `${u.firstName} ${u.lastName}`)
                                                                    .join(', ')}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                );
                                            }}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => {
                                                    const tagProps = getTagProps({ index });
                                                    const { key, ...restTagProps } = tagProps;

                                                    return (
                                                        <Tooltip key={option.id} title={option.name} arrow>
                                                            <Chip
                                                                key={option.id}
                                                                {...restTagProps}
                                                                label={
                                                                    <Stack spacing={0.5}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                            {option.name}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{ color: 'whitesmoke', fontStyle: 'italic' }}
                                                                        >
                                                                            {option.usersInstallers
                                                                                ?.map((u) => `${u.firstName} ${u.lastName}`)
                                                                                .join(', ')}
                                                                        </Typography>
                                                                    </Stack>
                                                                }
                                                                size="small"
                                                                sx={{
                                                                    background: `linear-gradient(45deg, #00B8D9, #8E33FF)`,
                                                                    color: 'white',
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: 'white',
                                                                        '&:hover': { color: '#FF5630' },
                                                                    },
                                                                    height: 50,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    );
                                                })
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={`${formData?.workType?.name?.toUpperCase()} Crew`}
                                                    error={!!errors.installerCrews}
                                                    helperText={errors.installerCrews}
                                                    fullWidth                         // 👈 asegura ancho completo dentro del flex
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#22C55E',
                                                            },
                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                borderColor: '#22C55E',
                                                                borderWidth: 2,
                                                                boxShadow: `0 0 10px ${alpha('#22C55E', 0.3)}`,
                                                            },
                                                        },
                                                    }}
                                                />
                                            )}
                                        />

                                        <Tooltip title="Add new crew" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={openModalAddCrew.onTrue}
                                                sx={{
                                                    mt: 2,
                                                    alignSelf: 'flex-start',
                                                    bgcolor: alpha('#00B8D9', 0.1),
                                                    color: '#00B8D9',
                                                    '&:hover': {
                                                        bgcolor: alpha('#00B8D9', 0.2),
                                                        transform: 'scale(1.1)',
                                                    },
                                                    transition: 'all 0.2s ease-in-out',
                                                }}
                                            >
                                                <Iconify icon="eva:plus-fill" width={16} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                </Stack>
                            </m.div>
                        )}

                        {/* Products */}
                        <m.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                        >
                            <Autocomplete
                                multiple
                                options={productOptions || []}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(opt, val) => opt.line_item_id === val.line_item_id}
                                value={formData.products}
                                onChange={(event, newValue) => handleInputChange('products', newValue)}
                                renderOption={(props, option) => {
                                    const { key, ...liProps } = props;
                                    return (
                                        <Box component="li" key={option.line_item_id} {...liProps}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {option.name}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ color: 'text.disabled', fontStyle: 'italic' }}
                                                >
                                                    {option.description}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    );
                                }}

                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const tagProps = getTagProps({ index });
                                        const { key, ...restTagProps } = tagProps;

                                        return (
                                            <Tooltip key={option.line_item_id} title={option.description || ''} arrow>
                                                <Chip
                                                    key={option.line_item_id}
                                                    {...restTagProps}
                                                    label={(
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {option.name}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ color: 'whitesmoke', fontStyle: 'italic' }}
                                                            >
                                                                {option.description}
                                                            </Typography>
                                                        </Stack>
                                                    )}
                                                    size="small"
                                                    sx={{
                                                        background: `linear-gradient(45deg, #00B8D9, #8E33FF)`,
                                                        color: 'white',
                                                        '& .MuiChip-deleteIcon': {
                                                            color: 'white',
                                                            '&:hover': { color: '#FF5630' },
                                                        },
                                                        height: 50,
                                                    }}
                                                />
                                            </Tooltip>
                                        );
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={formData?.products.length > 0 ? `${formData.products.length} product(s) selected` : 'Products'}
                                        placeholder="Select products..."
                                        error={!!errors.products}
                                        helperText={errors.products}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#00A76F',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#00A76F',
                                                    borderWidth: 2,
                                                    boxShadow: `0 0 10px ${alpha('#00A76F', 0.3)}`,
                                                }
                                            }
                                        }}
                                    />
                                )}
                            />
                        </m.div>
                    </Stack>
                </Box>

                <DialogActions
                    sx={{
                        flexShrink: 0,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        background: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={isSubmitting || isFinishing}
                        onClick={handleSubmit}
                        disabled={isSubmitting || isFinishing || (!isEditing && !hasChanges) || (isEditing && !hasChanges)}
                    >
                        {isEditing ? 'Update' : 'Create'}
                    </LoadingButton>
                    {workOrder && (
                        <LoadingButton
                            type="button"
                            variant="contained"
                            color={workOrder?.is_finished ? 'secondary' : 'primary'}
                            loading={isSubmitting || isFinishing}
                            onClick={() => {
                                confirmFinishWorkOrder.onTrue();
                            }}
                            disabled={isSubmitting || isFinishing}
                        >
                            {workOrder?.is_finished ? 'Reopen' : 'Finish'}
                        </LoadingButton>
                    )}
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                    >
                        Cancel
                    </Button>

                </DialogActions>
            </Dialog >

            <InstallationCrewCreateModal
                openModal={openModalAddCrew}
                refetchInstallationCrews={refetchInstallationCrews}
            />

            <ConfirmDialog
                open={confirmFinishWorkOrder.value}
                onClose={() => {
                    confirmFinishWorkOrder.onFalse();
                }}
                title={`${workOrder?.is_finished ? 'Reopen' : 'Finish'} Work Order ${workOrder?.name}`}
                maxWidth="xs"
                content={
                    `Are you sure you want to ${workOrder?.is_finished ? 'reopen' : 'finish'} the work order ${workOrder?.name}?`
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={async () => {
                            await onFinishWorkOrder(workOrder);
                            confirmFinishWorkOrder.onFalse();
                            handleClose();
                        }}
                    >
                        {workOrder?.is_finished ? 'Reopen' : 'Finish'}
                    </Button>
                }
            />
        </>
    );
}