import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Tooltip,
    Box,
    DialogTitle
} from '@mui/material';
import { Iconify } from 'src/components/iconify';

/**
 * FileViewerDialog
 *
 * Props:
 *   - open: boolean
 *   - files: Array<{ name: string; fileUrl: string }>
 *   - initialIndex: number
 *   - onClose: () => void
 *
 * Permite ver el archivo en files[currentIndex] y navegar con “<” / “>”.
 */
function FileViewerDialogComponent({
    open,
    data,
    dataType = 'installation',
    files,
    initialIndex,
    onClose
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

    useEffect(() => {
        if (typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < files.length) {
            setCurrentIndex(initialIndex);
        } else {
            setCurrentIndex(0);
        }
    }, [initialIndex, files]);

    const goPrevious = useCallback(() => {
        setCurrentIndex((i) => Math.max(0, i - 1));
    }, []);

    const goNext = useCallback(() => {
        setCurrentIndex((i) => Math.min(files.length - 1, i + 1));
    }, [files.length]);

    if (!files || files?.length === 0) {
        return null;
    }

    const { fileUrl, name, file: realName } = files[currentIndex] || {};

    if (!fileUrl || !name || !realName) {
        return (
            <Dialog
                open={open}
                onClose={onClose}
                PaperProps={{ sx: { position: 'relative', height: '100vh' } }}
            >
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    Could not load the file. Please check the file URL and try again.
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            fullWidth
            maxWidth="lg"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { position: 'relative', height: '100vh' } }}
        >
            <DialogActions
                sx={{
                    //   position: 'absolute',
                    // top: 8,
                    right: 8,
                    zIndex: 10,
                    display: 'flex',
                    gap: 0,
                    p: 0,
                    pr: 1,
                }}
            >
                <Tooltip title="Close">
                    <IconButton size="small" onClick={onClose}>
                        <Iconify icon="mdi:close" width={20} height={20} />
                    </IconButton>
                </Tooltip>
            </DialogActions>

            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    p: 0,
                    backgroundColor: 'grey.100'
                }}
            >
                {/* Controles de navegación */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                        <Iconify icon="mdi:file-document" width={24} height={24} />
                        <span>
                            {dataType?.toUpperCase()} {data?.name}
                        </span>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            backgroundColor: 'background.paper'
                        }}
                    >
                        <Tooltip title="Previous">
                            <span>
                                <IconButton
                                    onClick={goPrevious}
                                    disabled={currentIndex === 0}
                                    size="small"
                                    sx={{
                                        cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                                        '&.Mui-disabled': {
                                            cursor: 'not-allowed !important',
                                            pointerEvents: 'auto',
                                        },
                                        color: currentIndex === 0 ? 'text.disabled' : 'text.primary',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <Iconify icon="mdi-light:skip-previous" width={20} height={20} /> Previous
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                            <strong>
                                ({currentIndex + 1} / {files.length}) {name}
                            </strong>
                        </Box>

                        <Tooltip title="Next">
                            <span>
                                <IconButton
                                    onClick={goNext}
                                    disabled={currentIndex === files.length - 1}
                                    size="small"
                                    sx={{
                                        cursor: currentIndex === files.length - 1 ? 'not-allowed' : 'pointer',
                                        '&.Mui-disabled': {
                                            cursor: 'not-allowed !important',
                                            pointerEvents: 'auto',
                                        },
                                        color: currentIndex === files.length - 1 ? 'text.disabled' : 'text.primary',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    Next <Iconify icon="mdi-light:skip-next" width={20} height={20} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Vista previa del archivo según su extensión */}

                <Box
                    sx={{
                        flexGrow: 1,
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: 'grey.900'
                    }}
                >
                    {/* Si es imagen */}
                    {/\.(jpg|jpeg|png|gif)$/i.test(realName) ? (
                        <Box
                            component="img"
                            src={fileUrl}
                            alt={name}
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                backgroundColor: 'black'
                            }}
                        />
                    ) : /\.(mp4|webm|ogg)$/i.test(realName) ? (
                        /* Si es vídeo */
                        <Box
                            component="video"
                            src={fileUrl}
                            controls
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                backgroundColor: 'black'
                            }}
                        />
                    ) : /\.pdf$/i.test(realName) ? (
                        /* Si es PDF */
                        <Box
                            id="pdf‐container"
                            sx={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                            }}
                        >
                            <iframe
                                src={fileUrl}
                                title="PDF"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="fullscreen"
                            />
                        </Box>
                    ) : (
                        /* Otros formatos (Word/Excel/PPT) */
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'grey.300'
                            }}
                        >
                            Vista previa no disponible para este formato
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog >
    );
}

export default FileViewerDialogComponent;
