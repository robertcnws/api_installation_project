import { Box, Typography } from '@mui/material';

export const WelcomeMetricsTypography = ({
    userLogged
}) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <Typography variant="h4" sx={{ mb: { xs: 1, md: 0 } }}>
            System Metrics
        </Typography >
        <Typography variant="subtitle2" sx={{ opacity: 0.72, mb: 2 }}>
            Welcome to the metrics overview page.
        </Typography>
    </Box>
);