import axios from 'axios';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import { Box, Grid, Button } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { UploadBox, MultiFilePreview } from 'src/components/upload';

import { LoadingContext } from 'src/auth/context/loading-context';
import { listRolesAndSubroles, verifyPermissions } from 'src/utils/check-permissions';

export function KanbanDetailsTaskAttachments({
    project,
    refetchProject,
    task,
    newFiles,
    setNewFiles,
    id,
    name,
    type,
    listPermissions,
}) {
    const { isMobile } = useContext(LoadingContext);
    const [initialFiles, setInitialFiles] = useState([]);
    const displayFiles = useMemo(() => [...initialFiles, ...newFiles], [initialFiles, newFiles]);
    const [fileToRemove, setFileToRemove] = useState(null);
    const confirm = useBoolean();
    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    useEffect(() => {
        const attachments = task?.project_task_attachments || [];
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
                            `${CONFIG.apiUrl}/projects/get-file-url/?key=${encodeURIComponent(attachment.file)}`
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
    }, [task?.project_task_attachments]);

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
                    const taskId = task?.project_default_task.id;
                    await axios.delete(`${CONFIG.apiUrl}/projects/delete/file/${id}/project/${taskId}/task/${fileToRemove.file}/`, {
                        data: {
                            userReporter: userLogged?.data,
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
            await refetchProject?.();

        }, [fileToRemove, initialFiles, newFiles, setNewFiles, id, userLogged, refetchProject, task, confirm]);



    const handleDownloadFile = (file) => {
        if (!file || !file.fileUrl) return;

        const link = document.createElement('a');
        link.href = file.fileUrl;
        link.download = file.name;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isAddFilesEnabled = newFiles.length > 0;

    return (
        <>
            <Box sx={{ maxHeight: 550, minHeight: !isMobile ? 400 : 0, overflow: 'auto' }}>
                {project?.currentStage && (
                    <Box
                        key={project?.currentStage?.id}
                        sx={{ mb: 3, display: 'flex', gap: 3 }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12}>
                                <MultiFilePreview
                                    key={project?.currentStage?.id}
                                    thumbnail
                                    files={displayFiles || []}
                                    onRemove={handleClickRemoveFile}
                                    onDownload={handleDownloadFile}
                                    listPermissions={listPermissions}
                                    isProject={false}
                                    // slotProps={{
                                    //     thumbnail: (verifyPermissions(
                                    //         listPermissions,
                                    //         CONFIG.permissions.system,
                                    //         CONFIG.permissions.moduleTasks,
                                    //         CONFIG.permissions.operationDownloadFile
                                    //     ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? {
                                    //         sx: {
                                    //             width: 75,
                                    //             height: 75,
                                    //             cursor: 'pointer',
                                    //             position: 'relative',
                                    //             transition: 'background-color 0.3s ease',
                                    //             '&:hover': {
                                    //                 bgcolor: 'rgba(0, 0, 0, 0.1)',
                                    //                 opacity: 0.5,
                                    //             },
                                    //             '&::after': {
                                    //                 content: '""',
                                    //                 position: 'absolute',
                                    //                 bottom: 4,
                                    //                 right: 16,
                                    //                 width: 40,
                                    //                 height: 40,
                                    //                 backgroundImage: 'url(/assets/icons/apps/ic-download-1.svg)',
                                    //                 backgroundSize: 'contain',
                                    //                 backgroundRepeat: 'no-repeat',
                                    //                 display: 'none',
                                    //             },
                                    //             '&:hover::after': {
                                    //                 display: 'block',
                                    //             },
                                    //         },
                                    //     } : null,
                                    // }}
                                    lastNode={
                                        (verifyPermissions(
                                            listPermissions,
                                            CONFIG.permissions.system,
                                            CONFIG.permissions.moduleTasks,
                                            CONFIG.permissions.operationUploadFile
                                        ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
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
                                    {type} ({task.project_default_task.name}) in {name}
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
