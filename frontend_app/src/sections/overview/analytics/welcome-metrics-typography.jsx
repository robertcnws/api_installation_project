import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Iconify } from 'src/components/iconify';

export const WelcomeMetricsTypography = ({
    userLogged,
    onRefresh,
    loading,
}) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mb: 1 }}>
            <Typography variant="h4" sx={{ mb: { xs: 1, md: 0 } }}>
                System Metrics
            </Typography >
            <Tooltip title="Refresh Metrics" placement="top" arrow>
                <IconButton size="small" color="primary" width={27} height={27} disabled={loading} onClick={onRefresh}>
                    <Iconify icon="ix:refresh-arrow-down" width={27} height={27} />
                </IconButton>
            </Tooltip>
        </Box>
        <Typography variant="subtitle2" sx={{ opacity: 0.72, mb: 2 }}>
            Welcome to the metrics overview page.
        </Typography>
    </Box>
);