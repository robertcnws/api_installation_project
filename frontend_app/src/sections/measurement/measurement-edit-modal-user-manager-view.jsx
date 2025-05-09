import axios from 'axios';
import { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Avatar, Dialog, TextField, DialogTitle, Autocomplete, DialogActions } from '@mui/material';

import { isInstaller, isWarehouseStaff } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';


// ----------------------------------------------------------------------

export function MeasurementEditModalUserManagerView({
    isFirstAssignee,
    isCheckAssignee,
    measurement,
    open,
    onClose,
}) {

    const {
        loadedUsers,
    } = useDataContext();

    const managerUsers = useMemo(
        () => loadedUsers.filter((user) => isInstaller(user.userRole.name) || isWarehouseStaff(user.userRole.name)),
        [loadedUsers]);

    const cleanLoadedUsers = useMemo(() => managerUsers.map(({ __typename, ...rest }) => rest), [managerUsers]);

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const isEdit = useMemo(() => isFirstAssignee ?
        !!measurement?.firstAssignee?.id : !!measurement?.checkAssignee?.id,
        [isFirstAssignee, measurement]
    );

    const [measurementData, setMeasurementData] = useState({})

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (measurement?.number) {
            setMeasurementData((prev) => ({
                ...prev,
                id: measurement?.id || '',
                number: measurement?.number || '',
                firstAssignee:
                    measurement?.firstAssignee && Object.keys(measurement?.firstAssignee).length > 0
                        ? cleanLoadedUsers.find(u => u.id === measurement?.firstAssignee?.id)
                        : null,
                checkAssignee:
                    measurement?.checkAssignee && Object.keys(measurement?.checkAssignee).length > 0
                        ? cleanLoadedUsers.find(u => u.id === measurement?.checkAssignee?.id)
                        : null,
            }));
        }
    }, [
        measurement?.number,
        measurement?.firstAssignee,
        measurement?.checkAssignee,
        measurement?.id,
        cleanLoadedUsers
    ]);

    const filteredUsersManager = useMemo(() => {
        if (measurement?.checkAssignee?.id && isFirstAssignee) {
            return cleanLoadedUsers.filter((user) => user.id !== measurement?.checkAssignee?.id);
        }
        if (measurement?.firstAssignee?.id && isCheckAssignee) {
            return cleanLoadedUsers.filter((user) => user.id !== measurement?.firstAssignee?.id);
        }
        return cleanLoadedUsers;
    }, [cleanLoadedUsers, isFirstAssignee, isCheckAssignee, measurement]);


    const isValidSubmit = useMemo(() => {
        if (isFirstAssignee) {
            return !!measurement?.firstAssignee?.id || measurement?.firstAssignee?.id !== measurementData?.firstAssignee?.id;
        }
        if (isCheckAssignee) {
            return !!measurement?.checkAssignee?.id || measurement?.checkAssignee?.id !== measurementData?.checkAssignee?.id;
        }
        return false;
    }, [isFirstAssignee, isCheckAssignee, measurement, measurementData]);


    const onSubmit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const field = isFirstAssignee ? 'firstAssignee' : 'checkAssignee';
        formData.append(field, JSON.stringify(measurementData[field]));

        const promise = axios.post(`${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/change-assignee/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Measurement (${measurementData.number}) success!`,
                error: `Update Measurement (${measurementData.number}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            // refetchProjects?.();

            // reset();

            setIsSubmitting(false);

            onClose();

        } catch (error) {
            console.error(error);
        }
    };

    const renderProject = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
            <DialogTitle>{isEdit ? 'Update' : 'Add'} {isFirstAssignee ? ' First User' : ' Check User'} to Measurement {measurementData?.number} </DialogTitle>

            <Stack
                spacing={2.5}
                justifyContent="center"
                sx={{ p: 2.5 }}
            >

                <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>
                    {isFirstAssignee ? (
                        <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                            <Autocomplete
                                name="firstAssignee"
                                placeholder="First Responsible"
                                label="First Responsible"
                                value={measurementData?.firstAssignee || null}
                                options={filteredUsersManager || []}
                                getOptionLabel={(option) => (
                                    option.name
                                ) || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(event, newValue) => {
                                    setMeasurementData((prev) => ({
                                        ...prev,
                                        firstAssignee: newValue,
                                    }));
                                }}
                                renderOption={(props, user) => (
                                    <li {...props} key={user.id}>
                                        <Avatar
                                            key={user.id}
                                            alt={user.avatarUrl}
                                            src={user.avatarUrl}
                                            sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                                        />

                                        {user.name}
                                    </li>
                                )}
                                renderTags={(selected, getTagProps) =>
                                    selected.map((user, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={user.id}
                                            size="small"
                                            variant="soft"
                                            label={user.name}
                                            avatar={<Avatar alt={user.name} src={user.avatarUrl} />}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="First Responsible"
                                        placeholder="Select a user"
                                        size="small"
                                    />
                                )}
                            />
                        </Box>
                    ) : (
                        <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                            <Autocomplete
                                name="checkAssignee"
                                placeholder="Check Responsible"
                                label="Check Responsible"
                                value={measurementData?.checkAssignee || null}
                                options={filteredUsersManager || []}
                                getOptionLabel={(option) => (
                                    option.name
                                ) || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(event, newValue) => {
                                    setMeasurementData((prev) => ({
                                        ...prev,
                                        checkAssignee: newValue,
                                    }));
                                }}
                                renderOption={(props, user) => (
                                    <li {...props} key={user.id}>
                                        <Avatar
                                            key={user.id}
                                            alt={user.avatarUrl}
                                            src={user.avatarUrl}
                                            sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                                        />

                                        {user.name}
                                    </li>
                                )}
                                renderTags={(selected, getTagProps) =>
                                    selected.map((user, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={user.id}
                                            size="small"
                                            variant="soft"
                                            label={user.name}
                                            avatar={<Avatar alt={user.name} src={user.avatarUrl} />}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Check Responsible"
                                        placeholder="Select a user"
                                        size="small"
                                    />
                                )}
                            />
                        </Box>
                    )}
                </Box>
            </Stack>
            <DialogActions>
                <LoadingButton
                    variant="contained"
                    loading={isSubmitting}
                    disabled={isSubmitting || !isValidSubmit}
                    onClick={onSubmit}
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
        </Dialog>
    )

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Tabs alineados a la izquierda */}
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
            </Box>
            {/* </Drawer > */}

        </>
    );
}
