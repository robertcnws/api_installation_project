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

export function ProjectUserAssigneesList({
    project,
    person,
    setProjectData,
    setValue,
    watch,
    loadedProjectPermissions,
    handleRemoveUserAssignee,
}) {

    const { isMobile } = useContext(LoadingContext);

    const confirm = useBoolean();

    const [permission, setPermission] = useState(person?.project_permissions[0]?.name);

    const popover = usePopover();

    const handleChangePermission = useCallback((newPermission) => {
        setPermission(newPermission);
        const permissionFromLoaded = loadedProjectPermissions.find((perm) => perm.name === newPermission);
        
        setProjectData((prev) => {
            const newProject = { ...prev };
            const newAssignees = newProject.usersAssignees.map((assignee) => {
                if (assignee.id === person.id) {
                    return {
                        ...assignee,
                        project_permissions: assignee.project_permissions.map((perm, idx) => {
                            if (idx === 0) {
                                return {
                                    ...perm,
                                    name: newPermission,
                                    id: permissionFromLoaded.id,
                                    description: permissionFromLoaded.description
                                };
                            }
                            return perm;
                        }),
                    };
                }
                return assignee;
            });
            return { ...newProject, usersAssignees: newAssignees };
        });
        
        const currentAssignees = Array.isArray(watch('usersAssignees')) ? watch('usersAssignees') : [];
        const newAssignees = currentAssignees.map((assignee) => {
            if (assignee.id === person.id) {
                return {
                    ...assignee,
                    project_permissions: assignee.project_permissions.map((perm, idx) => {
                        if (idx === 0) {
                            return {
                                ...perm,
                                name: newPermission,
                                id: permissionFromLoaded.id,
                                description: permissionFromLoaded.description
                            };
                        }
                        return perm;
                    }),
                };
            }
            return assignee;
        });

        setValue('usersAssignees', newAssignees, { shouldValidate: true, shouldDirty: true });

    }, [person, setProjectData, setValue, loadedProjectPermissions, watch]);


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
                    secondaryTypographyProps={{ noWrap: true, component: 'span', textAlign: 'left', typography: 'caption', textTransform: 'none' }}
                    sx={{ flexGrow: 1, pr: 1 }}
                />

                <Button
                    size="small"
                    color="inherit"
                    endIcon={
                        <Iconify
                            width={16}
                            icon={popover.open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                            sx={{ ml: -0.5 }}
                        />
                    }
                    onClick={popover.onOpen}
                    sx={{
                        flexShrink: 0,
                        fontSize: (theme) => theme.typography.pxToRem(12),
                        ...(popover.open && { bgcolor: 'action.selected' }),
                    }}
                >
                    Can {permission}
                </Button>
            </Box>

            <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
                <MenuList>
                    {loadedProjectPermissions.map((perm, index) => (
                        <MenuItem
                            key={index}
                            selected={permission === perm.name}
                            value={perm.id}
                            onClick={() => {
                                popover.onClose();
                                handleChangePermission(perm.name);
                            }}
                        >
                            Can {perm.name}
                        </MenuItem>
                    ))}

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    <MenuItem
                        onClick={() => {
                            popover.onClose();
                            confirm.onTrue();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                        Remove User
                    </MenuItem>
                </MenuList>
            </CustomPopover>

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title="Remove User"
                content={
                    <>
                        Are you sure want to delete user <strong> {person.name} </strong> from <strong> {project.name} </strong>?
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
