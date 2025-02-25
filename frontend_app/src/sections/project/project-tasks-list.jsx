import { useContext } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

export function ProjectTasksList({
    project,
    task,
    handleRemoveTask,
    tabs,
    renderTaskDetails,
    projectData,
    setProjectData,
    refetchProjects,
}) {

    const { isMobile } = useContext(LoadingContext);

    const confirm = useBoolean();

    const popover = usePopover();

    const handleRemoveRow = (id) => {
        handleRemoveTask(id);
        confirm.onFalse();
    }

    const handleUpdateRow = (e) => {
        // popover.onClose();
        tabs.onChange(e, 'tasks');
        setProjectData({ ...projectData, currentTask: task });
        renderTaskDetails(task);
    }

    return (
        <>
            <Box component="li" sx={{ display: 'flex', alignItems: !isMobile ? 'center' : 'left', py: 1, flexDirection: !isMobile ? 'row' : 'column' }}>

                <ListItemText
                    primary={task.number}
                    secondary={
                        <Tooltip title={task.name}>
                            <span>{task.name}</span>
                        </Tooltip>
                    }
                    primaryTypographyProps={{ noWrap: true, typography: 'subtitle2' }}
                    secondaryTypographyProps={{ noWrap: true, component: 'span' }}
                    sx={{ flexGrow: 1, pr: 1 }}
                />

                <Box sx={{ display: 'flex', alignItems: !isMobile ? 'center' : 'left', py: 1, flexDirection: 'row' }}>
                    <Button
                        size="small"
                        color="info"
                        onClick={(e) => handleUpdateRow(e)}
                        sx={{
                            flexShrink: 0,
                            fontSize: (theme) => theme.typography.pxToRem(12),
                        }}
                    >
                        <Iconify icon="clarity:update-line" />
                        Update
                    </Button>

                    <Button
                        size="small"
                        color="error"
                        onClick={confirm.onTrue}
                        sx={{
                            flexShrink: 0,
                            fontSize: (theme) => theme.typography.pxToRem(12),
                        }}
                    >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                        Remove
                    </Button>
                </Box>
            </Box>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title="Remove Task"
                content={
                    <>
                        Are you sure want to delete task <strong> {task.name} </strong> from <strong> {project.name} </strong>?
                    </>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            handleRemoveRow(task.id);
                            confirm.onFalse();
                        }}
                    >
                        Remove
                    </Button>
                }
            />
        </>
    );
}
