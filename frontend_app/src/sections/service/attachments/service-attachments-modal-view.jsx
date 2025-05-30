import axios from 'axios';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Grid, Dialog, DialogTitle, DialogActions, Typography } from '@mui/material';
import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { MultiFilePreview } from 'src/components/upload';

import { LoadingContext } from 'src/auth/context/loading-context';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingButton } from '@mui/lab';
import { getServiceAttachments } from 'src/utils/service-tasks-utils';
import { AttachmentNavigationComponent } from 'src/sections/project/attachments/attachment-navigation-component';


// ----------------------------------------------------------------------

export function ServiceAttachmentsModalView({
    service,
    attachments,
    dataFiltered,
    stageName = null,
    open,
    onClose,
}) {

    const { isMobile } = useContext(LoadingContext);

    const [displayAttachments, setDisplayAttachments] = useState(attachments || []);

    const [displayService, setDisplayService] = useState(service || {});

    useEffect(() => {
        if (service) {
            setDisplayService(service);
        }
        if (attachments) {
            setDisplayAttachments(attachments);
        }
    }, [service, attachments]);

    const [initialFiles, setInitialFiles] = useState([]);

    const displayFiles = useMemo(() => [...initialFiles], [initialFiles]);

    const stages = useMemo(() => Object.entries(CONFIG.stages).map(([key, value]) => (key)), []);

    const attachmentTypes = useMemo(() => stages, [stages]);

    const mappedDisplayFiles = useMemo(() => {
        if (!displayService) return [];
        return attachmentTypes?.map((type) => {
            const newType = type === 'preparation' ? 'issued' : type;
            const filesForStage = displayFiles.filter((file) => file.attachment_type?.toLowerCase() === newType.toLowerCase());
            return {
                attachmentType: type,
                files: filesForStage,
            };
        }).filter((mappedFile) => mappedFile?.files?.length > 0);
    }, [displayFiles, displayService, attachmentTypes]);

    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!displayAttachments?.length) {
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
                params: { 'keys[]': files, number: displayService.number },
                paramsSerializer: p => files
                    .map(f => `keys[]=${encodeURIComponent(f)}`)
                    .concat([`number=${displayService.number}`])
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
    }, [displayService]);

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
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Attachments in Service {displayService?.name}
                        </Typography>
                        <AttachmentNavigationComponent
                            dataFiltered={dataFiltered}
                            setDisplayAttachments={setDisplayAttachments}
                            displayData={displayService}
                            setDisplayData={setDisplayService}
                            stageName={stageName}
                            funcGetAttachments={getServiceAttachments}
                            objType='Service'
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
                            <Iconify icon="line-md:download-loop" /> Download All
                        </LoadingButton>
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
                        console.log('mappedDisplayFiles', mappedDisplayFiles);
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
                                            <b>{stageName}</b>
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
                                                        <b>{stageName}</b>
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
                                                        isService={false}
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
                                                    <b>{mappedDisplay.attachmentType}</b>
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
                                                    isService={false}
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

        </>
    );
}
