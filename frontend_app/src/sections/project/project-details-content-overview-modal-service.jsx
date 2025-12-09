import { Box, Stack, Button, Dialog, ListItem, Typography, DialogTitle, ListItemText, DialogActions, List } from '@mui/material';
import { Iconify } from 'src/components/iconify';

import { filteredDescription } from 'src/utils/project-tasks-utils';

// ----------------------------------------------------------------------

export function ProjectDetailsContentOverviewModalService({
    project,
    items,
    open,
    onClose,
    title = "Service Items",
    subtitle = `Sales order ${project?.name}`,
    iconTitle = "mdi:account-service-outline",
    isLong = false,
}) {

    return (
        <Dialog fullWidth maxWidth={isLong ? "md" : "xs"} open={open} onClose={onClose}>
            <DialogTitle>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box className="dialog-title-icon">
                        <Iconify icon={iconTitle} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {subtitle}
                    </Typography>
                </Box>
            </DialogTitle>
            <List sx={{ height: isLong ? 400 : 300, overflowY: 'auto' }}>
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
            </List>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
