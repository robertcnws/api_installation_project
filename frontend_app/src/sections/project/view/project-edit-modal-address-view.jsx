import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions } from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';


// ----------------------------------------------------------------------

export function ProjectEditModalAddressView({
    isEdit,
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

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const { data: itemById, refetch: refetchProject } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [projectData, setProjectData] = useState({})

    useEffect(() => {
        if (itemById) {
            setProjectData((prev) => ({
                ...prev,
                id: itemById?.id || '',
                name: itemById?.name || '',
                number: itemById?.number || '',
                address: itemById?.address || '',   
            }));
        }
    }, [itemById, setProjectData]);

    const ProjectDialogSchema = zod.object({
        name: zod.string().min(1, { message: 'Name is required!' }),
        description: schemaHelper.editor().optional().nullable(),
        address: zod.string().min(1, { message: 'Address is required!' }),
    });

    const defaultValues = useMemo(
        () => ({
            id: itemById?.id || '',
            name: itemById?.name || '',
            number: itemById?.number || '',
            address: itemById?.address || '',
        }),
        [itemById]
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
                address: itemById.address || '',
            });
        }
    }, [itemById, userLogged?.data, reset]);


    const onSubmit = handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));
        formData.append('address', data.address);

        const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${item.id}/change-address/`, formData, {
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

    const renderProject = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
                <DialogTitle>{isEdit ? 'Update' : 'Add'} Address to Project {projectData?.name} </DialogTitle>

                <Form methods={methods} onSubmit={onSubmit}>

                    <Stack
                        spacing={2.5}
                        justifyContent="center"
                        sx={{ p: 2.5 }}
                    >

                        <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>
                            
                            <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                                <Field.Text
                                    name="address"
                                    label="Address"
                                    control={control}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter address"
                                />
                            </Box>
                        </Box>
                    </Stack>
                    <DialogActions>
                        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                            {isEdit ? 'Update' : 'Add'}
                        </LoadingButton>
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
