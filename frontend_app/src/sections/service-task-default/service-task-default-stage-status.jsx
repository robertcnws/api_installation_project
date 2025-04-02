import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ServiceTaskDefaultStageStatus({ linkedStatus, onChangeLinkedStatus }) {
    return (
        <Stack direction="row" flexWrap="wrap" spacing={1}>
            {['not started', 'in progress', 'finished', 'failed'].map((option) => (
                <ButtonBase
                    key={option}
                    onClick={() => onChangeLinkedStatus(option)}
                    sx={{
                        py: 0.5,
                        pl: 0.75,
                        pr: 1.25,
                        fontSize: 12,
                        borderRadius: 1,
                        lineHeight: '20px',
                        textTransform: 'capitalize',
                        fontWeight: 'fontWeightBold',
                        boxShadow: (theme) =>
                            `inset 0 0 0 2px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
                        ...(option === linkedStatus && {
                            boxShadow: (theme) => `inset 0 0 0 2px ${theme.vars.palette.text.primary}`,
                        }),
                    }}
                >
                    <Iconify
                        icon={
                            (option === CONFIG.taskStatus.notStarted && 'mdi:restart-alert') ||
                            (option === 'in progress' && 'mdi:progress-clock') ||
                            (option === 'finished' && 'fluent-mdl2:completed') ||
                            'carbon:incomplete-error'
                        }
                        sx={{
                            mr: 0.5,
                            ...(option === CONFIG.taskStatus.notStarted && { color: 'warning.main' }),
                            ...(option === 'in progress' && { color: 'info.main' }),
                            ...(option === 'finished' && { color: 'success.main' }),
                            ...(option === 'failed' && { color: 'error.main' }),
                        }}
                    />

                    {option}
                </ButtonBase>
            ))}
        </Stack>
    );
}
