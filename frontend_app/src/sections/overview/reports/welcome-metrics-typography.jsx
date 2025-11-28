import { Box, Typography } from '@mui/material';

export const WelcomeReportsTypography = ({
    userLogged
}) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <Typography variant="h4" sx={{ mb: { xs: 1, md: 0 } }}>
            System Reports
        </Typography >
        <Typography variant="subtitle2" sx={{ opacity: 0.72, mb: 2 }}>
            Overview page for system reports.
        </Typography>
    </Box>
);