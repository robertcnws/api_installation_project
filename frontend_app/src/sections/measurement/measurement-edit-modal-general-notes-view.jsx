import axios from 'axios';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Dialog, TextField, Typography, DialogTitle, DialogActions } from '@mui/material';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

export function MeasurementEditModalGeneralNotesView({
    measurement,
    refetchMeasurement,
    open,
    onClose,
}) {

    const [formChanged, setFormChanged] = useState(false);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [newNotes, setNewNotes] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEdit = useMemo(() => !!measurement?.generalNotes, [measurement]);

    useEffect(() => {
        if (measurement?.generalNotes) {
            setNewNotes(measurement?.generalNotes);
        } else {
            setNewNotes('');
        }
    }, [measurement?.generalNotes]);


    const handleSaveGeneralNotes = useCallback(async () => {
        try {
            setIsSubmitting(true);
            const url = `${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/save-general-notes/`;

            const promise = axios.post(url, {
                userReporter: JSON.stringify(userLogged?.data),
                generalNotes: newNotes,
            });
            const response = await promise;

            toast.success(response?.data?.message || 'Measurement updated successfully!');

            setIsSubmitting(false);

            refetchMeasurement?.();

            onClose();

        }
        catch (error) {
            console.error('Error updating measurement:', error);
            toast.error(error?.response?.data?.message || 'Error updating measurement!');
        }
    }, [measurement, refetchMeasurement, userLogged, newNotes, setIsSubmitting, onClose]);


    const renderMainInfo = (
        <Stack spacing={1.5}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2,
                width: '100%',
                gap: 1
            }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    General Notes
                </Typography>
                <Box sx={{ width: '100%' }}>
                    <TextField
                        multiline
                        rows={3}
                        sx={{ width: '100%' }}
                        value={newNotes || ''}
                        onChange={(e) => {
                            setNewNotes(e.target.value);
                        }}
                        variant="outlined"
                    />
                </Box>
            </Box>
        </Stack>
    );


    const renderProject = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box className="dialog-title-icon">
                        <Iconify icon="icon-park-outline:notes" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {isEdit ? 'Update' : 'Add'} General Notes to Measurement {measurement?.number}
                    </Typography>
                </Box>
            </DialogTitle>

            <Stack
                spacing={2.5}
                justifyContent="center"
                sx={{ p: 2.5 }}
            >

                {renderMainInfo}


            </Stack>
            <DialogActions>
                <LoadingButton
                    variant="contained"
                    loading={isSubmitting}
                    color="primary"
                    sx={{
                        borderRadius: 1,
                        width: 5,
                        '&.Mui-disabled': {
                            cursor: 'not-allowed !important',
                            pointerEvents: 'auto',
                        }
                    }}
                    disabled={newNotes?.trim() === '' || newNotes?.trim() === measurement?.generalNotes?.trim()}
                    onClick={handleSaveGeneralNotes}
                >
                    {isEdit ? 'Update' : 'Add'}
                </LoadingButton>
                <Button variant="outlined" onClick={onClose}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    )

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {/* Tabs alineados a la izquierda */}
            <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
        </Box>
    );
}
