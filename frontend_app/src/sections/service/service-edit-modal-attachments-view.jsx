import axios from 'axios';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Grid, Dialog, DialogTitle, DialogActions } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { UploadBox, MultiFilePreview } from 'src/components/upload';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function ServiceEditModalAttachmentsView({
    service,
    open,
    onClose,
}) {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [serviceData, setServiceData] = useState({})

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [initialFiles, setInitialFiles] = useState([]);
    const [newFiles, setNewFiles] = useState([]);

    const displayFiles = useMemo(() => [...initialFiles, ...newFiles], [initialFiles, newFiles]);

    const attachmentTypes = useMemo(() => ['issued', 'repair'], []);

    const mappedDisplayFiles = useMemo(() => {
        if (!service) return [];
        return attachmentTypes?.map((type) => {
            const filesForStage = displayFiles.filter((file) =>
                file.attachment_type === type
            );
            return {
                attachmentType: type,
                files: filesForStage,
            };
        });
    }, [displayFiles, service, attachmentTypes]);

    const [fileToRemove, setFileToRemove] = useState(null);
    const confirm = useBoolean();

    useEffect(() => {
        const attachments = service.serviceAttachments || [];
        if (!attachments.length) {
            setInitialFiles([]);
            return;
        }
        const loadFiles = async () => {
            const loaded = await Promise.all(
                attachments.map(async (attachment) => {
                    if (attachment instanceof File) {
                        return {
                            ...attachment,
                            fileUrl: URL.createObjectURL(attachment),
                            name: attachment.name,
                            isNew: true,
                        };
                    }
                    if (!attachment.file) {
                        return attachment;
                    }
                    try {
                        const response = await fetch(
                            `${CONFIG.apiUrl}/services/get-file-url/?key=${encodeURIComponent(attachment.file)}`
                        );
                        if (!response.ok) {
                            console.error('Error fetching URL', response.statusText);
                            return attachment;
                        }
                        const values = await response.json();
                        return {
                            ...attachment,
                            fileUrl: values.url,
                            isNew: false,
                        };
                    } catch (error) {
                        console.error('Error al obtener la URL:', error);
                        return attachment;
                    }
                })
            );
            setInitialFiles(loaded);
        };
        loadFiles();
    }, [service]);

    const handleClickRemoveFile = (file) => {
        setFileToRemove(file);
        confirm.onTrue();
    };

    const handleConfirmRemove = async () => {
        if (!fileToRemove) return;
        let updatedInitial = initialFiles;
        let updatedNew = newFiles;
        const isLocalFile = fileToRemove instanceof File;
        if (!fileToRemove.isNew && !isLocalFile) {
            try {
                await axios.delete(`${CONFIG.apiUrl}/services/delete/file/${service?.id}/service/${fileToRemove.file}/`, {
                    data: {
                        userReporter: userLogged?.data,
                        attachmentType: fileToRemove.attachment_type,
                    },
                });
                updatedInitial = initialFiles.filter((f) => f.file !== fileToRemove.file);
                toast.success('File deleted successfully');
            } catch (error) {
                console.error('Error deleting file', error);
                toast.error('Error deleting file');
                return;
            }
        } else {
            updatedNew = newFiles.filter((f) => f.name !== fileToRemove.name);
        }
        setInitialFiles(updatedInitial);
        setNewFiles(updatedNew);

        confirm.onFalse();
        setFileToRemove(null);
    };

    const handleAddFiles = async (type) => {
        if (newFiles.length === 0) return;
        try {
            const formData = new FormData();

            const filePromises = newFiles.map(async (file) => {
                if (file instanceof File) {
                    return file;
                }
                if (file.fileUrl) {
                    const response = await fetch(file.fileUrl);
                    const blob = await response.blob();
                    return new File([blob], file.name, { type: blob.type });
                }
                return null;
            });

            const filesToUpload = (await Promise.all(filePromises)).filter((f) => f !== null);

            filesToUpload.forEach((file) => {
                formData.append('serviceAttachments', file);
            });
            formData.append('userReporter', JSON.stringify(userLogged?.data));

            formData.append('attachmentType', type);


            await axios.post(`${CONFIG.apiUrl}/services/upload/service/${service?.id}/file/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setNewFiles([]);
            toast.success('New files uploaded successfully');
        } catch (error) {
            console.error('Error uploading new files', error);
            toast.error('Error uploading new files');
        }
    };

    const handleDownloadFile = (file) => {
        if (!file || !file.fileUrl) return;

        const link = document.createElement('a');
        link.href = file.fileUrl;
        link.download = file.name;
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isAddFilesEnabled = (type) => newFiles.filter((file) => file.attachment_type === type).length > 0;


    const onSubmit = useCallback(async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${service.id}/change-notes/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        try {
            toast.promise(promise, {
                loading: 'Loading...',
                success: `Update Service (${service.name}) success!`,
                error: `Update Service (${service.name}) error!`,
            });

            const response = await promise;

            if (!response.data) {
                return;
            }

            setIsSubmitting(false);

            onClose();

        } catch (error) {
            console.error(error);
        }
    }, [service, userLogged, onClose]);

    const renderService = (
        <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
            <DialogTitle>{service?.serviceAttachments?.length > 0 ? 'Update' : 'Add'} Attachments to Service {service?.name} </DialogTitle>

            <Stack
                spacing={2.5}
                justifyContent="center"
                sx={{ p: 2.5 }}
            >

                <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>

                    <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                        <Box
                            key='issued-attachments'
                            sx={{ mb: 3, display: 'flex', gap: 3 }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={4} sm={2}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ mb: 1, typography: 'overline' }}>
                                            <b>About issues</b>
                                        </Box>
                                        {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                                            <Box sx={{ mb: 1 }}>
                                                <Button
                                                    color="primary"
                                                    variant="outlined"
                                                    disabled={!isAddFilesEnabled('issued')}
                                                    onClick={() => handleAddFiles('issued')}
                                                >
                                                    <Iconify icon="material-symbols:attach-file-add" />
                                                    Add File(s)
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item xs={8} sm={10}>
                                    <MultiFilePreview
                                        key='preview-issued-attachments'
                                        thumbnail
                                        files={mappedDisplayFiles.find((mappedFile) => mappedFile?.attachmentType === 'issued')?.files || []}
                                        onRemove={handleClickRemoveFile}
                                        onDownload={handleDownloadFile}
                                        lastNode={
                                            (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                                <UploadBox onDrop={(files) => {
                                                    if (files && files.length) {
                                                        const uniqueFiles = files.filter((file) =>
                                                            !displayFiles.some((existingFile) => existingFile.name === file.name)
                                                        );
                                                        if (uniqueFiles.length > 0) {
                                                            const filesToAdd = uniqueFiles.map((file) => ({
                                                                ...file,
                                                                fileUrl: URL.createObjectURL(file),
                                                                name: file.name,
                                                                isNew: true,
                                                                attachment_type: 'issued',
                                                            }));
                                                            setNewFiles((prev) => [...prev, ...filesToAdd]);
                                                        }
                                                        else {
                                                            toast.error('File already exists');
                                                        }
                                                    }
                                                }} />
                                            ) : null
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ flexDirection: !isMobile ? 'row' : 'column', display: 'flex' }}>

                    <Box sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}>
                        <Box
                            key='issued-attachments'
                            sx={{ mb: 3, display: 'flex', gap: 3 }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={4} sm={2}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ mb: 1, typography: 'overline' }}>
                                            <b>About repair</b>
                                        </Box>
                                        {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                                            <Box sx={{ mb: 1 }}>
                                                <Button
                                                    color="primary"
                                                    variant="outlined"
                                                    disabled={!isAddFilesEnabled('repair')}
                                                    onClick={() => handleAddFiles('repair')}
                                                >
                                                    <Iconify icon="material-symbols:attach-file-add" />
                                                    Add File(s)
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item xs={8} sm={10}>
                                    <MultiFilePreview
                                        key='preview-repair-attachments'
                                        thumbnail
                                        files={mappedDisplayFiles.find((mappedFile) => mappedFile?.attachmentType === 'repair')?.files || []}
                                        onRemove={handleClickRemoveFile}
                                        onDownload={handleDownloadFile}
                                        lastNode={
                                            (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                                <UploadBox onDrop={(files) => {
                                                    if (files && files.length) {
                                                        const uniqueFiles = files.filter((file) =>
                                                            !displayFiles.some((existingFile) => existingFile.name === file.name)
                                                        );
                                                        if (uniqueFiles.length > 0) {
                                                            const filesToAdd = uniqueFiles.map((file) => ({
                                                                ...file,
                                                                fileUrl: URL.createObjectURL(file),
                                                                name: file.name,
                                                                isNew: true,
                                                                attachment_type: 'repair',
                                                            }));
                                                            setNewFiles((prev) => [...prev, ...filesToAdd]);
                                                        }
                                                        else {
                                                            toast.error('File already exists');
                                                        }
                                                    }
                                                }} />
                                            ) : null
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Box>
            </Stack>
            <DialogActions>
                {/* <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                    {service?.serviceAttachments?.length > 0 ? 'Update' : 'Add'}
                </LoadingButton> */}
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
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderService}</Box>
            </Box>

            <ConfirmDialog
                open={confirm.value}
                onClose={() => {
                    confirm.onFalse();
                    setFileToRemove(null);
                }}
                title="Remove File"
                content={
                    <>
                        {fileToRemove && (
                            <>
                                Are you sure you want to delete the file{' '}
                                <strong>{fileToRemove.name}</strong> from the service{' '}
                                {service?.name}?
                            </>
                        )}
                    </>
                }
                action={
                    <Button variant="contained" color="error" onClick={handleConfirmRemove}>
                        Remove
                    </Button>
                }
            />

        </>
    );
}
