import React, { useContext } from 'react';
import { Stepper, Step, StepLabel, Box, StepIcon } from '@mui/material';
import { LoadingContext } from 'src/auth/context/loading-context';

export function ProjectDetailsStageStepper({ stages, currentStageId, project }) {
    const activeStep = stages.findIndex((stage) => stage.id === currentStageId);

    const hasPermission = project?.hasPermission

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
                                color: hasPermission && index === 3 ? 'info.main' : 'grey.500',
                            },
                            '& .MuiStepIcon-root': {
                                color: hasPermission && index === 3 ? 'info.main' : index < activeStep ? 'primary.main' : 'grey.500',
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
