import axios from 'axios';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import { Box, Grid, Button } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { UploadBox, MultiFilePreview } from 'src/components/upload';

import { LoadingContext } from 'src/auth/context/loading-context';

export function KanbanDetailsTaskAttachments({
    service,
    refetchService,
    task,
    newFiles,
    setNewFiles,
    id,
    name,
    type,
    moduleType,
    listPermissions,
}) {
    const { isMobile } = useContext(LoadingContext);
    const [initialFiles, setInitialFiles] = useState([]);
    const displayFiles = useMemo(() => [...initialFiles, ...newFiles], [initialFiles, newFiles]);
    const [fileToRemove, setFileToRemove] = useState(null);
    const confirm = useBoolean();
    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);
    const [attachmentType, setAttachmentType] = useState('issued');

    useEffect(() => {
        const attachedTasks = service?.serviceDefaultTasks?.filter((t) => t.service_default_task?.has_attachments) || [];
        const maxOrderAttachedTask = attachedTasks?.reduce((max, t) => {
            const order = t?.service_default_task?.order || 0;
            return order > max ? order : max;
        }, 0) || 0;
        const attachType = task?.service_default_task?.order === maxOrderAttachedTask ? 'repair' : 'issued';
        const attachments = service?.serviceAttachments?.filter((a) => a.attachment_type === attachType) || [];
        if (!attachments.length) {
            setInitialFiles([]);
            return;
        }
        setAttachmentType(attachType);
        const loadFiles = async () => {
            const loaded = await Promise.all(
                attachments.map(async (attachment) => {
                    if (attachment instanceof File) {
                        return {
                            ...attachment,
                            fileUrl: URL.createObjectURL(attachment),
                            name: attachment.name,
                            isNew: true,
                            attachment_type: attachType,
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
    }, [task, service]);

    const handleClickRemoveFile = (file) => {
        setFileToRemove(file);
        confirm.onTrue();
    };

    const handleConfirmRemove = useCallback(
        async () => {
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
            await refetchService?.();

        }, [service, initialFiles, newFiles, fileToRemove, refetchService, userLogged, confirm, setFileToRemove, setNewFiles]);



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

    const isAddFilesEnabled = newFiles.length > 0;

    return (
        <>
            <Box sx={{ maxHeight: 550, minHeight: !isMobile ? 400 : 0, overflow: 'auto' }}>
                {service?.currentStage && (
                    <Box
                        key={service?.currentStage?.id}
                        sx={{ mb: 3, display: 'flex', gap: 3 }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12}>
                                <MultiFilePreview
                                    key={service?.currentStage?.id}
                                    thumbnail
                                    files={displayFiles || []}
                                    onRemove={handleClickRemoveFile}
                                    onDownload={handleDownloadFile}
                                    listPermissions={listPermissions}
                                    isProject={false}
                                    moduleType={moduleType}
                                    lastNode={
                                        (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.installer)) ? (
                                            <UploadBox sx={{ ml: displayFiles.length === 0 ? 2 : 0, width: 75, height: 75 }} onDrop={(files) => {
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
                                                            attachment_type: attachmentType,
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
                )}
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
                                <strong>{fileToRemove.name}</strong> from{' '}
                                <strong>
                                    {type} ({task.service_default_task.name}) in {name}
                                </strong>
                                ?
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
