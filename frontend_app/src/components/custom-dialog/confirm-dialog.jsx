import { useRef } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ConfirmDialog({ open, title, action, content, onClose, maxWidth, ...other }) {

  const dialogRef = useRef(null);

  const handleClose = (event, reason) => {
    if (onClose) {
      onClose(event, reason);
    }
    if (document.activeElement && dialogRef.current && dialogRef.current.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };

  return (
    <Dialog fullWidth maxWidth={!maxWidth ? 'xs' : maxWidth} open={open} onClose={handleClose} ref={dialogRef} {...other}>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box className="dialog-title-icon">
            <Iconify icon="mdi:help-circle" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      {content && <DialogContent sx={{ typography: 'body2' }}> {content} </DialogContent>}

      <DialogActions>
        {action}

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
