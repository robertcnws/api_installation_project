import axios from 'axios';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import { Grid, Dialog, Typography, DialogTitle } from '@mui/material';

import { getProjectAttachments } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { MultiFilePreview } from 'src/components/upload';

import { LoadingContext } from 'src/auth/context/loading-context';

import FileViewerDialogComponent from './file-viewer-dialog-component';
import { AttachmentNavigationComponent } from './attachment-navigation-component';




// ----------------------------------------------------------------------

export function ProjectAttachmentsModalView({
    project,
    attachments,
    dataFiltered,
    loadedStages,
    stageName = null,
    open,
    onClose,
}) {

    const { isMobile } = useContext(LoadingContext);

    const [displayAttachments, setDisplayAttachments] = useState(attachments || []);

    const [displayProject, setDisplayProject] = useState(project || {});

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFiles, setViewerFiles] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    useEffect(() => {
        if (project) {
            setDisplayProject(project);
        }
        if (attachments) {
            setDisplayAttachments(attachments);
        }
    }, [project, attachments]);

    const [initialFiles, setInitialFiles] = useState([]);

    const displayFiles = useMemo(() => [...initialFiles], [initialFiles]);

    const stages = useMemo(
        () => Object.entries(
            CONFIG.stages).map(([key, value]) => (key)),
        []);

    const attachmentTypes = useMemo(() => stages, [stages]);


    const mappedDisplayFiles = useMemo(() => {
        if (!displayProject) return [];
        return attachmentTypes?.map((type) => {
            const filesForStage = displayFiles.filter((file) =>
                file.current_stage?.name?.toLowerCase() === type.toLowerCase() ||
                file.project_task?.project_default_task?.project_stage?.name?.toLowerCase() === type.toLowerCase()
            );
            return {
                attachmentType: type,
                files: filesForStage,
                attachmentOtherName: loadedStages.find((s) => s.name?.toLowerCase() === type.toLowerCase())?.otherName
            };
        }).filter((mappedFile) => mappedFile?.files?.length > 0);
    }, [displayFiles, displayProject, attachmentTypes, loadedStages]);

    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!displayAttachments.length) {
            setInitialFiles([]);
            return;
        }
        const loadFiles = async () => {
            const loaded = await Promise.all(
                displayAttachments.map(async (attachment) => {
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
    }, [displayAttachments]);

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

    const handleDownloadAllFiles = useCallback(async (files) => {
        setIsDownloading(true);
        try {
            const response = await axios.get(`${CONFIG.apiUrl}/projects/download/files/`, {
                params: { 'keys[]': files, number: displayProject.number },
                paramsSerializer: p => files
                    .map(f => `keys[]=${encodeURIComponent(f)}`)
                    .concat([`number=${displayProject.number}`])
                    .join('&'),
                responseType: 'blob',
            });

            const contentDisposition = response.headers['content-disposition'];

            let fileName = 'download.zip';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (fileNameMatch && fileNameMatch.length > 1) {
                    fileName = fileNameMatch[1];
                }
            }
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setIsDownloading(false);
        } catch (error) {
            console.error('Error al descargar el archivo:', error);
        }
    }, [displayProject]);

    const renderService = (
        <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
            <DialogTitle>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'left', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                            <Box className="dialog-title-icon">
                                <Iconify icon="mdi:paperclip" />
                            </Box>
                            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                                Attachments in Installation {displayProject?.name}
                            </Typography>
                            {(displayProject?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) !== -1) && (
                                <Label color="success" sx={{ textTransform: 'uppercase', mt: 0.2, gap: 0.5 }}>
                                    <Iconify icon="fluent-mdl2:completed" width={16} />
                                    Finished
                                </Label>
                            )}
                        </Box>
                        <AttachmentNavigationComponent
                            dataFiltered={dataFiltered}
                            setDisplayAttachments={setDisplayAttachments}
                            displayData={displayProject}
                            setDisplayData={setDisplayProject}
                            stageName={stageName}
                            funcGetAttachments={getProjectAttachments}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'right', gap: 1 }}>
                        <LoadingButton
                            loading={isDownloading}
                            color="info"
                            variant="outlined"
                            disabled={initialFiles?.length === 0}
                            onClick={() => {
                                const files = initialFiles?.map((file) => file.file);
                                handleDownloadAllFiles(files);
                            }}
                            sx={{ p: 1, mt: 1 }}
                        >
                            <Iconify icon="line-md:download-loop" />
                            Download All
                        </LoadingButton>
                        <Button
                            color="success"
                            variant="outlined"
                            startIcon={<Iconify icon="mdi:view-arrow-left" />}
                            sx={{ p: 1, mt: 1 }}
                            disabled={initialFiles?.length === 0}
                            onClick={() => {
                                setViewerFiles(initialFiles);
                                setViewerIndex(0);
                                setViewerOpen(true);
                            }}
                        >
                            View All
                        </Button>
                        <Button
                            color="inherit"
                            variant="outlined"
                            startIcon={<Iconify icon="lets-icons:close-ring" />}
                            sx={{ p: 1, mt: 1 }}
                            onClick={onClose}
                            disableElevation
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            </DialogTitle>

            <Stack
                spacing={2.5}
                justifyContent="center"
                sx={{ p: 2.5 }}
            >

                {stageName !== null ? (
                    (() => {
                        const currentFiles = mappedDisplayFiles
                            .find((m) => m?.attachmentType === stageName.toLowerCase())
                            ?.files || [];

                        if (currentFiles.length === 0) {
                            return (
                                <Box
                                    sx={{
                                        width: '100%',
                                        color: 'text.secondary',
                                        mt: isMobile ? 2 : 0,
                                        ml: isMobile ? 0 : 2
                                    }}
                                >
                                    <Box
                                        key={`${stageName}-attachments-empty`}
                                        sx={{ mb: 3, display: 'flex', gap: 3, flexDirection: 'column' }}
                                    >
                                        <Typography variant="overline">
                                            <b>{mappedDisplayFiles.find((m) => m?.attachmentType === stageName.toLowerCase())?.attachmentOtherName || ''}</b>
                                        </Typography>
                                        <Typography variant="body2">
                                            No attachments available for this stage.
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        }

                        return (
                            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
                                <Box
                                    sx={{
                                        width: '100%',
                                        color: 'text.secondary',
                                        mt: isMobile ? 2 : 0,
                                        ml: isMobile ? 0 : 2
                                    }}
                                >
                                    <Box key={`${stageName}-attachments`} sx={{ mb: 3, display: 'flex', gap: 3 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={4} sm={2}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Box sx={{ mb: 1, typography: 'overline' }}>
                                                        <b>{mappedDisplayFiles.find((m) => m?.attachmentType === stageName.toLowerCase())?.attachmentOtherName || ''}</b>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={8} sm={10}>
                                                <Scrollbar sx={{ maxHeight: 400 }}>
                                                    <MultiFilePreview
                                                        key={`preview-${stageName}-attachments`}
                                                        thumbnail
                                                        files={currentFiles}
                                                        onRemove={null}
                                                        onDownload={handleDownloadFile}
                                                        isService
                                                        isProject={false}
                                                        moduleType={stageName}
                                                        lastNode={null}
                                                        customWidth={200}
                                                        customHeight={200}
                                                    />
                                                </Scrollbar>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })()
                ) : (
                    <Box sx={{ flexDirection: 'column', display: 'flex' }}>
                        {mappedDisplayFiles.map((mappedDisplay, index) => (
                            <Box key={`stage-attachments-${mappedDisplay.attachmentType}-${index}`}
                                sx={{ width: '100%', color: 'text.secondary', mt: !isMobile ? 0 : 2, ml: !isMobile ? 2 : 0 }}
                            >
                                <Box
                                    key={`${mappedDisplay.attachmentType}-attachments-${index}`}
                                    sx={{ mb: 3, display: 'flex', gap: 3 }}
                                >
                                    <Grid container spacing={2}>
                                        <Grid item xs={4} sm={2}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Box sx={{ mb: 1, typography: 'overline' }}>
                                                    <b>{mappedDisplay.attachmentOtherName}</b>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={8} sm={10}>
                                            <Scrollbar sx={{ maxHeight: 400 }}>
                                                <MultiFilePreview
                                                    key={`preview-${mappedDisplay.attachmentType}-attachments-${index}`}
                                                    thumbnail
                                                    files={mappedDisplay?.files || []}
                                                    onRemove={null}
                                                    onDownload={handleDownloadFile}
                                                    isService
                                                    isProject={false}
                                                    moduleType={mappedDisplay.attachmentType}
                                                    lastNode={null}
                                                    customWidth={200}
                                                    customHeight={200}
                                                />
                                            </Scrollbar>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Stack>
            {/* <DialogActions>
                <Button variant="outlined" onClick={onClose}>
                    Cancel
                </Button>
            </DialogActions> */}
        </Dialog >
    )

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Tabs alineados a la izquierda */}
                <Box sx={{ flexGrow: 1, borderRadius: 1 }}>{renderService}</Box>
            </Box>
            <FileViewerDialogComponent
                open={viewerOpen}
                data={project}
                files={viewerFiles}
                initialIndex={viewerIndex}
                onClose={() => setViewerOpen(false)}
            />
        </>
    );
}
