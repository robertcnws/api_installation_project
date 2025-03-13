import dayjs from 'dayjs';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fDate } from 'src/utils/format-time';
import { isInstaller, verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { ProjectShareDialog } from './project-share-dialog';
import { ProjectFileDetails } from './project-file-details';
import { ProjectNewFolderDialog } from './project-new-folder-dialog';





// ----------------------------------------------------------------------

export function ProjectFolderItem({
  sx,
  folder,
  selected,
  onSelect,
  onDelete,
  onViewRow,
  loadedUsers,
  loadedProjectPermissions,
  loadedStages,
  loadedStagesTask,
  listPermissions,
  setTableData,
  refetchProjects,
  ...other }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { copy } = useCopyToClipboard();

  const share = useBoolean();

  const popover = usePopover();

  const confirm = useBoolean();

  const details = useBoolean();

  const checkbox = useBoolean();

  const editFolder = useBoolean();

  const favorite = useBoolean(folder.isFavorited);

  const [inviteEmail, setInviteEmail] = useState('');

  const [folderName, setFolderName] = useState(folder.name);

  const handleChangeInvite = useCallback((event) => {
    setInviteEmail(event.target.value);
  }, []);

  const handleChangeFolderName = useCallback((event) => {
    setFolderName(event.target.value);
  }, []);

  const handleCopy = useCallback(() => {
    toast.success('Copied!');
    copy(folder.url);
  }, [copy, folder.url]);

  const renderAction = (
    <Stack direction="row" alignItems="center" sx={{ top: 8, right: 8, position: 'absolute' }}>
      <Checkbox
        color="warning"
        icon={<Iconify icon="eva:star-outline" />}
        checkedIcon={<Iconify icon="eva:star-fill" />}
        checked={favorite.value}
        onChange={favorite.onToggle}
        inputProps={{
          name: 'checkbox-favorite',
          'aria-label': 'Checkbox favorite',
        }}
      />

      <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>
    </Stack>
  );

  const renderIcon = (
    <Box
      onMouseEnter={checkbox.onTrue}
      onMouseLeave={checkbox.onFalse}
      sx={{ width: 36, height: 36 }}
    >
      {(checkbox.value || selected) && onSelect && !isInstaller(userLogged?.data?.user_role?.name) ? (
        <Checkbox
          checked={selected}
          onClick={onSelect}
          icon={<Iconify icon="eva:radio-button-off-fill" />}
          checkedIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          sx={{ width: 1, height: 1 }}
        />
      ) : (
        <Box
          component="img"
          src={`${CONFIG.assetsDir}/assets/icons/files/ic-folder.svg`}
          sx={{ width: 1, height: 1 }}
          onClick={
            isInstaller(userLogged?.data?.user_role?.name) ? onViewRow : null
          }
        />
      )}
    </Box>
  );
  const renderText = (
    <ListItemText
      // onClick={details.onTrue}
      onClick={onViewRow}
      primary={folder.name}
      secondary={
        <>
          {
            folder?.endDate ? `Duration: ${dayjs(folder?.startDate).to(folder?.endDate, true)}` :
              <Tooltip title="No Closing Date">
                <Iconify icon="material-symbols:sms-failed-outline" sx={{ color: 'error.main'}} />
              </Tooltip>
          }
          <Box
            component="span"
            sx={{
              mx: 0.75,
              width: 2,
              height: 2,
              borderRadius: '50%',
              bgcolor: 'currentColor',
            }}
          />
          (Starting: <b>{folder.startDate ? fDate(folder.startDate) : 'No Install Date'}</b>)
        </>
      }
      primaryTypographyProps={{ noWrap: false, typography: 'subtitle1' }}
      secondaryTypographyProps={{
        mt: 0.5,
        component: 'span',
        alignItems: 'center',
        typography: 'caption',
        color: 'text.disabled',
        display: 'inline-flex',
      }}
    />
  );

  const renderAvatar = (
    <AvatarGroup
      max={3}
      sx={{
        [`& .${avatarGroupClasses.avatar}`]: {
          width: 24,
          height: 24,
          '&:first-of-type': { fontSize: 12 },
        },
      }}
      onClick={details.onTrue}
    >
      {folder.usersAssignees?.map((person) => (
        <Tooltip key={person?.id} title={person?.name}>
          <Avatar key={person?.id} alt={person?.name} src={person?.avatarUrl} />
        </Tooltip>
      ))}
    </AvatarGroup>
  );

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          gap: 1,
          p: 2.5,
          maxWidth: 222,
          display: 'flex',
          borderRadius: 2,
          cursor: 'pointer',
          position: 'relative',
          bgcolor: 'transparent',
          flexDirection: 'column',
          alignItems: 'flex-start',
          ...((checkbox.value || selected) && {
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.customShadows.z20,
          }),
          ...sx,
        }}
        {...other}
      >
        {renderIcon}

        {renderAction}

        {renderText}

        {(!!folder?.usersAssignees?.length && !isInstaller(userLogged?.data?.user_role?.name)) && renderAvatar}
      </Paper>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              // details.onTrue();
              onViewRow();
            }}
          >
            <Iconify icon="lsicon:view-filled" />
            View Project
          </MenuItem>

          {verifyPermissions(
            listPermissions,
            CONFIG.permissions.system,
            CONFIG.permissions.moduleProjects,
            CONFIG.permissions.operationDelete
          ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.superadmin) ? [
            <Divider key="divider" sx={{ borderStyle: 'dashed' }} />,
            <MenuItem
              key="delete"
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete Project
            </MenuItem>
          ] : null}
        </MenuList>
      </CustomPopover>

      <ProjectFileDetails
        item={folder}
        favorited={favorite.value}
        onFavorite={favorite.onToggle}
        onCopyLink={handleCopy}
        open={details.value}
        onClose={details.onFalse}
        onDelete={() => {
          details.onFalse();
          onDelete();
        }}
        loadedUsers={loadedUsers}
        loadedProjectPermissions={loadedProjectPermissions}
        loadedStages={loadedStages}
        loadedStagesTask={loadedStagesTask}
        setTableData={setTableData}
        refetchProjects={refetchProjects}
      />

      <ProjectShareDialog
        open={share.value}
        shared={folder.shared}
        inviteEmail={inviteEmail}
        onChangeInvite={handleChangeInvite}
        onCopyLink={handleCopy}
        loadedUsers={loadedUsers}
        onClose={() => {
          share.onFalse();
          setInviteEmail('');
        }}
      />

      <ProjectNewFolderDialog
        open={editFolder.value}
        onClose={editFolder.onFalse}
        title="Edit Folder"
        onUpdate={() => {
          editFolder.onFalse();
          setFolderName(folderName);
          console.info('UPDATE FOLDER', folderName);
        }}
        folderName={folderName}
        onChangeFolderName={handleChangeFolderName}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Project"
        content={`Are you sure want to delete project ${folderName}?`}
        action={
          <Button variant="contained" color="error" onClick={onDelete}>
            Delete
          </Button>
        }
      />
    </>
  );
}
