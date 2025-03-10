import React, { useMemo, useState, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { List, Tooltip, ListItem } from '@mui/material';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDoubleClick } from 'src/hooks/use-double-click';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fDate, fDuration } from 'src/utils/format-time';
import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { FileThumbnail } from 'src/components/file-thumbnail';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectShareDialog } from './project-share-dialog';
import { ProjectFileDetails } from './project-file-details';





// ----------------------------------------------------------------------

export function ProjectTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onKanbanView,
  onViewRow,
  loadedUsers,
  loadedProjectPermissions,
  loadedStages,
  loadedStagesTask,
  listPermissions,
  setTableData,
  refetchProjects,
}) {

  const [rowUpdated, setRowUpdated] = useState(null);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  // useEffect(() => {
  //   if (item) {
  //     setRow(item);
  //   }
  // }, [item]);

  // useEffect(() => {
  //   if (refetchProject) {
  //     refetchProject();
  //   } 
  // }, [refetchProject]);

  // useEffect(() => {
  //   if (project) {
  //     setRow(project);
  //   }
  // }, [project]);

  const theme = useTheme();

  const { isMobile } = useContext(LoadingContext);

  const { copy } = useCopyToClipboard();

  const [inviteEmail, setInviteEmail] = useState('');

  const favorite = useBoolean(row?.isFavorited);

  const details = useBoolean();

  const share = useBoolean();

  const confirm = useBoolean();

  const popover = usePopover();

  const handleChangeInvite = useCallback((event) => {
    setInviteEmail(event.target.value);
  }, []);

  const handleClick = useDoubleClick({
    click: () => {
      details.onTrue();
    },
    doubleClick: () => console.info('DOUBLE CLICK'),
  });

  const handleCopy = useCallback(() => {
    toast.success('Copied!');
    copy(row?.url);
  }, [copy, row]);

  const defaultStyles = {
    borderTop: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    borderBottom: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    '&:first-of-type': {
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      borderLeft: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    },
    '&:last-of-type': {
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderRight: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
    },
  };

  return (
    <>
      <TableRow
        selected={selected}
        sx={{
          borderRadius: 2,
          [`&.${tableRowClasses.selected}, &:hover`]: {
            backgroundColor: 'background.paper',
            boxShadow: theme.customShadows.z20,
            transition: theme.transitions.create(['background-color', 'box-shadow'], {
              duration: theme.transitions.duration.shortest,
            }),
            '&:hover': { backgroundColor: 'background.paper', boxShadow: theme.customShadows.z20 },
          },
          [`& .${tableCellClasses.root}`]: { ...defaultStyles },
          ...(details.value && { [`& .${tableCellClasses.root}`]: { ...defaultStyles } }),
        }}
      >
        {(verifyPermissions(
          listPermissions,
          CONFIG.permissions.system,
          CONFIG.permissions.moduleProjects,
          CONFIG.permissions.operationDelete
        ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
            <TableCell padding="checkbox">
              <Checkbox
                checked={selected}
                onDoubleClick={() => console.info('ON DOUBLE CLICK')}
                onClick={onSelectRow}
                inputProps={{ id: `row-checkbox-${row?.id}`, 'aria-label': `row-checkbox` }}
              />
            </TableCell>
          )}

        {!isMobile ? (
          <>
            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{ whiteSpace: 'nowrap', cursor: 'pointer', }}
            >
              {/* {fDate(row?.salesOrder.date)} */}
              {fDate(row?.startDate)}
            </TableCell>
            <TableCell
              onClick={onViewRow}
              sx={{ whiteSpace: 'nowrap', cursor: 'pointer', }}
            >
              {row?.endDate ? fDuration(row?.startDate, row?.endDate) : 'No Closing Date'}
            </TableCell>

            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                {/* <FileThumbnail file="folder" /> */}

                <Typography
                  noWrap
                  variant="inherit"
                  sx={{
                    maxWidth: 360,
                    cursor: 'pointer',
                    ...(details.value && { fontWeight: 'fontWeightBold' }),
                  }}
                >
                  {row?.number}
                </Typography>
              </Stack>
            </TableCell>

            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{ whiteSpace: 'nowrap', cursor: 'pointer', }}
            >
              {row?.name}
            </TableCell>

            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{ whiteSpace: 'nowrap', cursor: 'pointer', }}
            >
              <Label color={
                row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ? 'default' :
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ? 'secondary' :
                    row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1 ? 'info' :
                      row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1 ? 'warning' :
                        row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1 ? 'success' : 'error'
              }>{row?.currentStage?.name}</Label>
            </TableCell>

            {loadedStages.map((stage) => {

              const stageOrder = stage.order;

              const stageName = stage.name;

              const itemOrder = row?.currentStage?.order

              const hasPermission = row?.hasPermission;

              const selectedTasks = row?.projectDefaultTasks?.filter(
                (task) => task.project_default_task.project_stage._id === stage.id
              )

              const sumPercentage = selectedTasks?.reduce((acc, task) => {
                if (task.project_default_task.project_stage._id === stage.id) {
                  return acc + task.percentage;
                }
                return acc;
              }, 0);

              const total = selectedTasks?.length;

              const percentage = total > 0 ? sumPercentage / total : 0;

              return (
                <TableCell
                  key={stage.id}
                  // onClick={handleClick} 
                  onClick={onViewRow}
                  sx={{ whiteSpace: 'nowrap', cursor: 'pointer', }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{
                    color: stageOrder > itemOrder && stageName !== CONFIG.stages.permission && !hasPermission ? 'default.main' :
                      stageOrder === itemOrder && stageName !== CONFIG.stages.permission && !hasPermission ? 'info.main' :
                        stageName === CONFIG.stages.permission && hasPermission && percentage < 100 ? 'info.main' :
                          stageName === CONFIG.stages.permission && !hasPermission ? 'default.main' :
                            stageOrder > itemOrder ? 'default.main' :
                              stageOrder === itemOrder ? 'info.main' : 'success.main'
                  }}>
                    {!hasPermission || stageName !== CONFIG.stages.permission ? (
                      <Tooltip title={
                        stageOrder > itemOrder ? `${stageName} is ahead of current stage` :
                          stageOrder === itemOrder && percentage === 0 ? `${stageName} is current stage` :
                            stageOrder === itemOrder && percentage > 0 && percentage < 50 ? `${stageName} is current stage and ${percentage.toFixed(2)} % completed` :
                              stageOrder === itemOrder && percentage >= 50 && percentage < 100 ? `${stageName} is current stage and ${percentage.toFixed(2)} % completed` :
                                `${stageName} is ${percentage.toFixed(2)} % completed and past current stage`
                      } placement="top" arrow>
                        <Iconify sx={{ width: '14px' }} icon={
                          stageOrder > itemOrder ? "jam:pie-chart-alt" :
                            stageOrder === itemOrder && percentage === 0 ? "icon-park-solid:pie" :
                              stageOrder === itemOrder && percentage > 0 && percentage < 25 ? "icon-park-solid:pie-two" :
                                stageOrder === itemOrder && percentage >= 25 && percentage < 50 ? "icon-park-solid:pie-four" :
                                  stageOrder === itemOrder && percentage >= 50 && percentage < 100 ? "icon-park-solid:pie-six" : "garden:circle-full-fill-12"
                          // stageOrder === itemOrder ? "mdi:circle-half-full" : "garden:circle-full-fill-12"
                        } />
                      </Tooltip>
                    ) : (
                      <Tooltip title={
                        !hasPermission ? `${stageName} is not available` :
                          percentage === 0 ? `${stageName} is not started` :
                            percentage > 0 && percentage < 50 ? `${stageName} is ${percentage.toFixed(2)} % completed` :
                              percentage >= 50 && percentage < 100 ? `${stageName} is ${percentage.toFixed(2)} % completed` :
                                `${stageName} is ${percentage.toFixed(2)} % completed`
                      } placement="top" arrow>
                        <Iconify sx={{ width: '14px' }} icon={
                          !hasPermission ? "jam:pie-chart-alt" :
                            percentage === 0 ? "icon-park-solid:pie" :
                              percentage > 0 && percentage < 25 ? "icon-park-solid:pie-two" :
                                percentage >= 25 && percentage < 50 ? "icon-park-solid:pie-four" :
                                  percentage >= 50 && percentage < 100 ? "icon-park-solid:pie-six" : "garden:circle-full-fill-12"
                          // stageOrder === itemOrder ? "mdi:circle-half-full" : "garden:circle-full-fill-12"
                        } />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              );
            }
            )}
          </>
        ) : (
          <TableCell
            // onClick={handleClick} 
            onClick={onViewRow}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <FileThumbnail file="folder" />

              <Typography
                noWrap
                variant="inherit"
                sx={{
                  maxWidth: 360,
                  cursor: 'pointer',
                  ...(details.value && { fontWeight: 'fontWeightBold' }),
                }}
              >
                {row?.number}
              </Typography>
            </Stack><br />
            Name: <Label color='default'>{row?.name}</Label><br />
            Installation Date: <Label color='default'>{fDate(row?.startDate)}</Label><br />
            {/* Closing Date: <Label color='default'>{fDate(row?.endDate)}</Label><br /> */}
            Duration: <Label color='default'>{row?.endDate ? fDuration(row?.startDate, row?.endDate) : 'No Closing Date'}</Label><br />
            <List dense sx={{ width: 1, bgcolor: 'background.paper' }}>
              {loadedStages.map((stage) => {
                const stageOrder = stage.order;
                const stageName = stage.name;
                const itemOrder = row?.currentStage?.order
                const hasPermission = row?.hasPermission;

                const selectedTasks = row?.projectDefaultTasks?.filter(
                  (task) => task.project_default_task.project_stage._id === stage.id
                )

                const sumPercentage = selectedTasks?.reduce((acc, task) => {
                  if (task.project_default_task.project_stage._id === stage.id) {
                    return acc + task.percentage;
                  }
                  return acc;
                }, 0);

                const total = selectedTasks?.length;

                const percentage = total > 0 ? sumPercentage / total : 0;


                const color =
                  stageOrder > itemOrder && stageName !== CONFIG.stages.permission && !hasPermission ? 'default.main' :
                    stageOrder === itemOrder && stageName !== CONFIG.stages.permission && !hasPermission ? 'info.main' :
                      stageName === CONFIG.stages.permission && hasPermission && percentage < 100 ? 'info.main' :
                        stageOrder > itemOrder ? 'default.main' :
                          stageOrder === itemOrder ? 'info.main' : 'success.main'

                const icon =
                  !hasPermission || stageName !== CONFIG.stages.permission ? (stageOrder > itemOrder ? "jam:pie-chart-alt" :
                    stageOrder === itemOrder && percentage === 0 ? "icon-park-solid:pie" :
                      stageOrder === itemOrder && percentage > 0 && percentage < 25 ? "icon-park-solid:pie-two" :
                        stageOrder === itemOrder && percentage >= 25 && percentage < 50 ? "icon-park-solid:pie-four" :
                          stageOrder === itemOrder && percentage >= 50 && percentage < 100 ? "icon-park-solid:pie-six" : "garden:circle-full-fill-12") :
                    (percentage === 0 ? "icon-park-solid:pie" :
                      percentage > 0 && percentage < 25 ? "icon-park-solid:pie-two" :
                        percentage >= 25 && percentage < 50 ? "icon-park-solid:pie-four" :
                          percentage >= 50 && percentage < 100 ? "icon-park-solid:pie-six" : "garden:circle-full-fill-12")

                return (
                  <ListItem
                    key={stage.id}
                    disableGutters
                    sx={{ py: 0.3 }} // Ajusta si quieres aún menos/más espacio vertical
                  >
                    <ListItemText primary={stage.name} />
                    <Iconify icon={icon} sx={{ color }} />
                  </ListItem>
                );
              })}
            </List>

          </TableCell>
        )}


        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap', cursor: 'pointer', }}>
          {/* <Checkbox
            color="warning"
            icon={<Iconify icon="eva:star-outline" />}
            checkedIcon={<Iconify icon="eva:star-fill" />}
            checked={favorite.value}
            onChange={favorite.onToggle}
            sx={{ p: 0.75 }}
          /> */}

          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

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
      </CustomPopover >

      <ProjectFileDetails
        item={row}
        favorited={favorite.value}
        onFavorite={favorite.onToggle}
        onCopyLink={handleCopy}
        open={details.value}
        onClose={details.onFalse}
        onDelete={onDeleteRow}
        loadedUsers={loadedUsers}
        loadedProjectPermissions={loadedProjectPermissions}
        loadedStages={loadedStages}
        loadedStagesTask={loadedStagesTask}
        setTableData={setTableData}
        refetchProjects={refetchProjects}
      />

      <ProjectShareDialog
        open={share.value}
        shared={row?.shared}
        inviteEmail={inviteEmail}
        onChangeInvite={handleChangeInvite}
        onCopyLink={handleCopy}
        loadedUsers={loadedUsers}
        onClose={() => {
          share.onFalse();
          setInviteEmail('');
        }}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Project"
        content={`Are you sure want to delete project ${row.name}?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
