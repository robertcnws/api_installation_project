import React, { useContext } from 'react';

import { Box, Step, Stepper, StepLabel } from '@mui/material';

import { LoadingContext } from 'src/auth/context/loading-context';

export function ServiceDetailsStageStepper({ stages, currentStageId, service }) {
    const activeStep = stages.findIndex((stage) => stage.id === currentStageId);

    const hasPermission = service?.hasPermission

    const { isMobile } = useContext(LoadingContext)

    return (
        <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
        }}>
            <Stepper
                activeStep={activeStep}
                alternativeLabel={!isMobile}
                orientation={!isMobile ? "horizontal" : "vertical"}
                sx={{
                    width: !isMobile ? '100%' : 'auto',
                }}>
                {stages.map((stage, index) => (
                    <Step key={stage.id}>
                        <StepLabel sx={{
                            '& .MuiStepLabel-label': {
                                color: 'grey.500',
                            },
                            '& .MuiStepIcon-root': {
                                color: index < activeStep ? 'primary.main' : 'grey.500',
                            },
                            '& .MuiStepLabel-label.Mui-active': {
                                color: 'primary.main',
                            },
                            '& .MuiStepIcon-root.Mui-active': {
                                color: 'primary.main',
                            },
                        }}>
                            {stage.name}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
}
