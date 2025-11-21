import React, { useMemo, useState, useCallback } from 'react';
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

// Mock data

const MOCK_WORK_TYPES = [
    { id: 1, name: 'Installation' },
    { id: 2, name: 'For Seen' },
];

export function ProjectEditModalWorkOrderView({
    open,
    onClose,
    workOrder = null,
    setWorkerOrder,
    project,
    refetchProject
}) {
    const theme = useTheme();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        loadedStages,
        loadedUsers,
    } = useDataContext();

    const [formData, setFormData] = useState({
        name: workOrder?.name || '',
        description: workOrder?.description || '',
        date: workOrder?.start_date || new Date().toISOString().split('T')[0],
        duration: workOrder?.duration || 1,
        projectStage: workOrder?.project_stage || null,
        userAssignee: workOrder?.user_assignee || null,
        products: workOrder?.items || [],
        workType: workOrder?.work_type || null,
    });

    const [errors, setErrors] = useState({});

    // Reset form and errors when modal opens/closes or workOrder changes
    React.useEffect(() => {
        if (open) {
            setFormData({
                name: workOrder?.name || '',
                description: workOrder?.description || '',
                date: workOrder?.start_date || new Date().toISOString().split('T')[0],
                duration: workOrder?.duration || 1,
                projectStage: workOrder?.project_stage || null,
                userAssignee: workOrder?.user_assignee || null,
                products: workOrder?.items || [],
                workType: workOrder?.work_type || null,
            });
            setErrors({});
        } else {
            // Clear errors when modal closes
            setErrors({});
        }
    }, [open, workOrder]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    const handleDurationChange = useCallback((increment) => {
        setFormData(prev => ({
            ...prev,
            duration: Math.max(1, prev.duration + increment)
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

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.projectStage) newErrors.projectStage = 'Project stage is required';
        if (!formData.userAssignee) newErrors.userAssignee = 'User assignee is required';
        if (!formData.workType) newErrors.workType = 'Work type is required';

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
            projectStage: null,
            userAssignee: null,
            products: [],
            workType: null,
        });
        setWorkerOrder?.(null);
    }, [onClose, setWorkerOrder]);

    const handleSubmit = useCallback(async () => {
        if (validateForm()) {

            setIsSubmitting(true);

            console.log('Submitting work order:', formData);

            const formToSubmit = new FormData();

            formToSubmit.append('userReporter', JSON.stringify(userLogged?.data));
            formToSubmit.append('name', formData.name);
            formToSubmit.append('description', formData.description);
            formToSubmit.append('startDate', formData.date);
            formToSubmit.append('duration', formData.duration);
            formToSubmit.append('projectStage', JSON.stringify(formData.projectStage));
            formToSubmit.append('userAssignee', JSON.stringify(formData.userAssignee));
            formToSubmit.append('workType', JSON.stringify(formData.workType));
            formToSubmit.append('items', JSON.stringify(formData.products));
            formToSubmit.append('workOrderId', workOrder ? workOrder.id : '');

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
    }, [formData, validateForm, handleClose, workOrder, userLogged, project, refetchProject]);

    const isEditing = Boolean(workOrder);

    const hasChanges = useMemo(() => {
        if (!workOrder) return true; // Creating new work order

        return (
            formData.name.trim() !== (workOrder.name.trim() || '') ||
            formData.description.trim() !== (workOrder.description.trim() || '') ||
            formData.date !== (workOrder.start_date || '') ||
            formData.duration !== (workOrder.duration || 1) ||
            (formData.projectStage?.id || null) !== (workOrder.project_stage?.id || null) ||
            (formData.userAssignee?.id || null) !== (workOrder.user_assignee?.id || null) ||
            (formData.workType?.id || null) !== (workOrder.work_type?.id || null) ||
            JSON.stringify(formData.products.map(p => p.line_item_id).sort()) !==
            JSON.stringify((workOrder.items || []).map(p => p.line_item_id).sort())
        );
    }, [formData, workOrder]);

    return (
        <Dialog
            fullWidth
            maxWidth="md"
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
                        {isEditing ? 'Edit Work Order' : 'Create Work Order'}
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
                        <TextField
                            fullWidth
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
                                }
                            }}
                        />
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
                    <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%', minWidth: 0 }}>

                            <DatePicker
                                label='Date'
                                value={dayjs(formData.date)}
                                onChange={handleDateChange}
                                // minDate={minDate}
                                // maxDate={
                                //     isStartDate ? dayjs(service?.endDate) : null
                                // }
                                // shouldDisableDate={(date) => {
                                //     if (date.isBefore(minDate, 'day')) return true;
                                //     if (busyDays.some(disabledDate => date.isSame(disabledDate, 'day'))) {
                                //         return true;
                                //     }
                                //     return false;
                                // }}
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
                                        onClick={() => handleDurationChange(1)}
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
                                        onClick={() => handleDurationChange(-1)}
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

                    {/* Project Stage and Work Type Row */}
                    <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%', minWidth: 0 }}>
                            <Autocomplete
                                options={loadedStages?.filter((s) => s.name.toLowerCase() !== 'finished')}
                                getOptionLabel={(option) => option.name}
                                value={formData.projectStage}
                                onChange={(event, newValue) => handleInputChange('projectStage', newValue)}
                                sx={{ flex: 1 }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Project Stage"
                                        error={!!errors.projectStage}
                                        helperText={errors.projectStage}
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
                                            }
                                        }}
                                    />
                                )}
                            />

                            <Autocomplete
                                options={MOCK_WORK_TYPES}
                                getOptionLabel={(option) => option.name}
                                value={formData.workType}
                                onChange={(event, newValue) => handleInputChange('workType', newValue)}
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
                        </Stack>
                    </m.div>

                    {/* User Assignee */}
                    <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    >
                        <Autocomplete
                            options={
                                loadedUsers.filter((u) => isInstaller(u.userRole.name) ||
                                    isProjectManager(u.userRole.name))
                            }
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            value={formData.userAssignee}
                            onChange={(event, newValue) => handleInputChange('userAssignee', newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="User Assignee"
                                    error={!!errors.userAssignee}
                                    helperText={errors.userAssignee}
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
                    </m.div>

                    {/* Products */}
                    <m.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                    >
                        <Autocomplete
                            multiple
                            options={project?.salesOrder?.line_items || []}
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
                                        <Tooltip key={option.line_item_id} title={option.description || ''}>
                                            <Chip
                                                key={option.line_item_id}
                                                {...restTagProps}
                                                label={option.name}
                                                size="small"
                                                sx={{
                                                    background: `linear-gradient(45deg, #00B8D9, #8E33FF)`,
                                                    color: 'white',
                                                    '& .MuiChip-deleteIcon': {
                                                        color: 'white',
                                                        '&:hover': { color: '#FF5630' },
                                                    },
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Products"
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
                    loading={isSubmitting}
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!isEditing && !hasChanges) || (isEditing && !hasChanges)}
                >
                    {isEditing ? 'Update' : 'Create'}
                </LoadingButton>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                >
                    Cancel
                </Button>

            </DialogActions>
        </Dialog>
    );
}