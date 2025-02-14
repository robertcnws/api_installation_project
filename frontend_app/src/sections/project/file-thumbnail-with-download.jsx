import { Box, IconButton } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import React from 'react';

export function FileThumbnailWithDownload({ file, thumbnailSx }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <img 
        src={file.fileUrl} 
        alt={file.name} 
        style={{ 
          width: thumbnailSx?.width || 64, 
          height: thumbnailSx?.height || 64, 
          borderRadius: 8 
        }} 
      />
      <IconButton
        component="a"
        href={file.fileUrl}
        download={file.name}
        sx={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'grey.300' },
          p: 0.5,
        }}
      >
        <Iconify icon="eva:download-fill" />
      </IconButton>
    </Box>
  );
}
