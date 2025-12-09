import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions } from '@mui/material';

import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function ProjectEditModalNotesView({
    item,
    open,
    onClose,
    onSubmitNotes = null,
    type,
}) {

    const { isMobile } = useContext(LoadingContext);


    const ProjectDialogSchema = zod.object({
        notes: zod.string().min(1, { message: 'Notes are required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            notes: item?.notes || item?.description || '',
        }),
        [item]
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
        if (item) {
            reset({
                notes: item?.notes || item?.description || '',
            });
        }
    }, [item, reset]);


    const onSubmit = handleSubmit(async (data) => {
        onSubmitNotes(item.id, 'notes', data.notes);
        onClose();
    });

    const dynamicTitle = useMemo(
        () => (onSubmitNotes ? `${item?.notes || item?.description ? 'Update' : 'Add'} Notes to ` : 'View Notes of '),
        [item, onSubmitNotes]
    )

    const renderProject = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
            <DialogTitle>{dynamicTitle}{type} {item?.name} </DialogTitle>

            <Form methods={methods} onSubmit={onSubmit}>

                <Stack
                    spacing={2.5}
                    justifyContent="center"
                    sx={{ p: 2.5 }}
                >

                    <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>

                        <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                            <Field.Text
                                name="notes"
                                label="Notes"
                                control={control}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Enter address"
                                disabled={isSubmitting || !onSubmitNotes}
                            />
                        </Box>
                    </Box>
                </Stack>
                <DialogActions>
                    {onSubmitNotes && (
                        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                            {item?.notes || item?.description ? 'Update' : 'Add'}
                        </LoadingButton>
                    )}
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
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderProject}</Box>
            </Box>
            {/* </Drawer > */}

        </>
    );
}
