import { useState, useCallback, useContext } from 'react';

import { useBoolean } from 'src/hooks/use-boolean';

import { LoadingContext } from 'src/auth/context/loading-context';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export function ProjectTaskUserAssigneesList({
    task,
    person,
    handleRemoveUserAssignee,
}) {

    const { isMobile } = useContext(LoadingContext);

    const confirm = useBoolean();

    const popover = usePopover();

    const handleRemoveRow = (id) => {
        handleRemoveUserAssignee(id);
        confirm.onFalse();
    }

    return (
        <>
            <Box component="li" sx={{ display: 'flex', alignItems: !isMobile ? 'center' : 'left', py: 1, flexDirection: !isMobile ? 'row' : 'column' }}>
                <Avatar alt={person.name} src={person.avatarUrl} sx={{ mr: 2 }} />

                <ListItemText
                    primary={person.name}
                    secondary={
                        <Tooltip title={person.email}>
                            <span>{person.email}</span>
                        </Tooltip>
                    }
                    primaryTypographyProps={{ noWrap: true, typography: 'subtitle2' }}
                    secondaryTypographyProps={{ noWrap: true, component: 'span', typography: 'caption', textTransform: 'none' }}
                    sx={{ flexGrow: 1, pr: 1 }}
                />

                <Button
                    size="small"
                    color="inherit"
                    sx={{
                        flexShrink: 0,
                        fontSize: (theme) => theme.typography.pxToRem(12),
                        color: 'error.main',
                    }}
                    onClick={confirm.onTrue}
                >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                    Remove User
                </Button>
            </Box>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title="Remove User from Task"
                content={
                    <>
                        Are you sure want to delete user <strong> {person?.name} </strong> from <strong> Task {task?.name} </strong>?
                    </>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            handleRemoveRow(person.id);
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
