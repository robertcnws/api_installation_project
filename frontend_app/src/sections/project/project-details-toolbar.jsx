import axios from 'axios';
import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectShareDialog } from './project-share-dialog';




// ----------------------------------------------------------------------

export function ProjectDetailsToolbar({
  project,
  backLink,
  editLink,
  openEdit,
  setOpenEdit,
  type,
  onDelete,
  sx,
  ...other
}) {

  const {
    loadedUsers,
    loadedProjectPermissions,
  } = useDataContext();

  const share = useBoolean();

  const confirmDelete = useBoolean();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const cleanLoadedUsers = useMemo(() => loadedUsers.map(({ __typename, ...rest }) => rest), [loadedUsers]);

  const filteredUsers = useMemo(() => cleanLoadedUsers.filter(user => user.id !== project?.userManager?.id), [cleanLoadedUsers, project]);

  const handleAddResetUsersAssignees = useCallback(
    async (users) => {
        let updatedUsers = users;
        if (project?.usersAssignees.length > 0) {
            updatedUsers = [
                ...project.usersAssignees,
                ...users.filter((user) => !project?.usersAssignees.some((u) => u.id === user.id)),
            ];
        }
        try {
            const promise = axios.post(`${CONFIG.apiUrl}/projects/add/project/${project?.id}/users/`, {
                usersAssignees: updatedUsers,
                userReporter: userLogged?.data,
            });
        } catch (error) {
            console.error(error);
        }
    },
    [project, userLogged]
);

  return (
    <>
      {/* <Divider sx={{ borderStyle: 'dashed', mb: 1 }} /> */}
      <Stack spacing={1} direction="row" sx={{ mb: { xs: 1, md: 1 }, ...sx }} {...other}>
        {/* <Button
          component={RouterLink}
          href={backLink}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={12} />}
          sx={{ mr: -3 }}
        /> */}
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <Typography variant="h6">INSTALLATION {project?.name}</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />

        {(type === 'project' || type === 'tasks') && (
          <>
            <Tooltip title='Add users to installation' arrow>
              <IconButton onClick={share.onTrue} color={project?.usersAssignees?.length > 0 ? 'default' : 'error'}>
                <Iconify icon="tdesign:usergroup-add-filled" />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Edit ${type === 'project' ? 'installation' : type}`} arrow>
              <IconButton onClick={() => setOpenEdit(true)}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete installation">
              <IconButton onClick={confirmDelete.onTrue} color="error">
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title='Close installation' arrow>
          <Button
            component={RouterLink}
            href={backLink}
            startIcon={<Iconify icon="mingcute:close-fill" />}
            sx={{ ml: 0, borderRadius: 10, maxWidth: 1 }}
          />
        </Tooltip>

        {/* <LoadingButton
          color="inherit"
          variant="contained"
          loading={!publish}
          loadingIndicator="Loading…"
          endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
          onClick={popover.onOpen}
          sx={{ textTransform: 'capitalize' }}
        >
          {publish}
        </LoadingButton> */}
      </Stack>

      <ProjectShareDialog
        open={share.value}
        shared={project?.shared}
        loadedUsers={filteredUsers}
        loadedProjectPermissions={loadedProjectPermissions}
        projectData={project}
        handleAddUsersAssignees={handleAddResetUsersAssignees}
        onClose={() => {
          share.onFalse();
        }}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete installation project <strong> {project?.name} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmDelete.onFalse();
              onDelete();
            }}
          >
            Delete
          </Button>
        }
      />

      {/* <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          {publishOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === publish}
              onClick={() => {
                popover.onClose();
                onChangePublish(option.value);
              }}
            >
              {option.value === 'published' && <Iconify icon="eva:cloud-upload-fill" />}
              {option.value === 'draft' && <Iconify icon="solar:file-text-bold" />}
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover> */}
    </>
  );
}
