import { Box, Stack, Button, Dialog, ListItem, Typography, DialogTitle, ListItemText, DialogActions } from '@mui/material';

import { filteredDescription } from 'src/utils/project-tasks-utils';

// ----------------------------------------------------------------------

export function ServiceDetailsContentOverviewModalService({ salesOrder, items, open, onClose }) {

    return (
        <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography>Service items</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Sales order {salesOrder?.salesorder_number}
                    </Typography>
                </Box>
            </DialogTitle>
            {items?.map((product) => (
                <ListItem key={product.line_item_id}>
                    <ListItemText
                        primary={product.name}
                        secondary={
                            <Stack direction="column" spacing={1}>
                                <Typography
                                    variant="caption"
                                    color="text.primary"
                                    sx={{ mb: 1, whiteSpace: 'pre-line' }}
                                >
                                    {`Qty: ${product.quantity}\n${filteredDescription(product.description)}`}
                                </Typography>
                            </Stack>
                        }
                        primaryTypographyProps={{
                            variant: 'caption',
                            color: 'text.secondary',
                        }}
                        secondaryTypographyProps={{
                            variant: 'caption',
                            color: 'text.primary',
                        }}
                    />
                </ListItem>
            ))}
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
