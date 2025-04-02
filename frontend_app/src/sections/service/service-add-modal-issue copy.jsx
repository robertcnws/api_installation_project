import axios from 'axios';
import { useMemo, useState, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Add, Remove } from '@mui/icons-material';
import { Chip, Dialog, ListItem, TextField, IconButton, DialogTitle, Autocomplete, DialogActions, InputAdornment } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';


// ----------------------------------------------------------------------

export function ServiceAddModalIssue({
    service,
    item,
    open,
    onClose,
}) {

    const {
        loadedServices,
        refetchServices,
        loadedServiceIssues,
    } = useDataContext();

    const { isMobile } = useContext(LoadingContext);

    const router = useRouter();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const finalIssues = useMemo(() => loadedServiceIssues?.filter(issue =>
        !(item?.issues ?? []).some(issueItem =>
            String(issueItem.issue.id) === String(issue.id)
        )
    ), [loadedServiceIssues, item]);


    const [serviceData, setServiceData] = useState({
        id: service?.id,
        issueService: null,
        quantity: 1,
        notes: '',
    })

    const handleResetForm = () => {
        setServiceData((prev) => ({
            ...prev,
            issueService: null,
            quantity: 1,
            notes: '',
        }));
    }

    const changeQuantity = (maxValue, action) => {
        if (action === 'add') {
            setServiceData((prev) => ({
                ...prev,
                quantity: prev.quantity + 1 > maxValue ? maxValue : prev.quantity + 1,
            }));
        }
        else if (action === 'remove') {
            setServiceData((prev) => ({
                ...prev,
                quantity: prev.quantity - 1 < 1 ? 1 : prev.quantity - 1,
            }));
        }
    }



    const onSubmit = useCallback(async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('issueService', JSON.stringify(serviceData?.issueService));
        formData.append('quantity', serviceData?.quantity);
        formData.append('notes', serviceData?.notes);

        const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${service?.id}/add-new-issue/${item?.line_item_id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Service (${service?.name}) success!`,
                error: `Update Service (${service?.name}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            // refetchServices?.();

            // reset();

            handleResetForm();

            setIsSubmitting(false);

            onClose();

        } catch (error) {
            console.error(error);
        }
    }, [item, serviceData, userLogged, onClose, service]);

    const renderService = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={() => {
            onClose();
            handleResetForm();
        }}>
            <DialogTitle>Add new issue to product {item?.name} </DialogTitle>

            <Stack
                spacing={2.5}
                justifyContent="center"
                sx={{ p: 2.5 }}
            >

                <Box
                    sx={{
                        flexDirection: !isMobile ? 'row' : 'column',
                        display: 'flex',
                        gap: 2,
                        width: '100%',
                        justifyContent:
                            'space-between'
                    }}>
                    <Autocomplete
                        sx={{ width: !isMobile ? '70%' : '100%' }}
                        options={finalIssues}
                        getOptionLabel={(option) => option.name}
                        onChange={(event, value) => {
                            setServiceData((prev) => ({
                                ...prev,
                                issueService: value,
                            }));
                        }}
                        renderOption={(props, option) => (
                            <ListItem {...props} key={option.id}>
                                {option.name}
                            </ListItem>
                        )}
                        renderTags={(selected, getTagProps) =>
                            selected.map((p, i) => (
                                <Chip
                                    {...getTagProps({ i })}
                                    key={p.id}
                                    variant="soft"
                                    label={p.name}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Issue"
                            />
                        )}
                    />
                    <TextField
                        type='number'
                        variant="outlined"
                        label="Qty"
                        value={serviceData?.quantity}
                        max={item?.quantity}
                        min={1}
                        onChange={(e) => {
                            if (e.target.value > item?.quantity || e.target.value < 1) {
                                e.target.value = item?.quantity;
                            }
                            setServiceData((prev) => ({
                                ...prev,
                                quantity: e.target.value,
                            }));
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" sx={{ display: 'flex', flexDirection: 'row', gap: 0, p: 0 }}>
                                    <IconButton
                                        onClick={() => changeQuantity(item?.quantity, 'add')}
                                        sx={{ p: 0, mr: 0 }}
                                        disabled={serviceData.quantity >= item?.quantity}
                                    >
                                        <Add />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => changeQuantity(item?.quantity, 'remove')}
                                        sx={{ p: 0, mr: 0 }}
                                        disabled={serviceData.quantity <= 1}
                                    >
                                        <Remove />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Box>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Notes"
                        multiline
                        minRows={1}
                        value={serviceData?.notes}
                        onChange={(e) => {
                            setServiceData((prev) => ({
                                ...prev,
                                notes: e.target.value,
                            }));
                        }}
                    />
                </Box>
            </Stack>
            <DialogActions>
                <LoadingButton
                    type="button"
                    variant="contained"
                    loading={isSubmitting}
                    disabled={!serviceData?.issueService}
                    onClick={onSubmit}
                >
                    Add issue
                </LoadingButton>
                <Button variant="outlined" onClick={() => {
                    onClose();
                    handleResetForm();
                }}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog >
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
