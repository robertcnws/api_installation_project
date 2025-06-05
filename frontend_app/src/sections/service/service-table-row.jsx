import dayjs from 'dayjs';
import React, { useMemo, useState, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { Box, Button, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { lighten, useTheme } from '@mui/material/styles';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDoubleClick } from 'src/hooks/use-double-click';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { listRolesAndSubroles } from 'src/utils/check-permissions';
import { fDate, fIsAfter, fDuration, fDateTime } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

// import { ProjectShareDialog } from './project-share-dialog';
// import { ProjectFileDetails } from './project-file-details';






// ----------------------------------------------------------------------

export function ServiceTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onCloseRow,
  // onKanbanView,
  onViewRow,
  loadedUsers,
  // loadedProjectPermissions,
  loadedServiceStages,
  // loadedStagesTask,
  listPermissions,
  setTableData,
  refetchServices,
}) {

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const today = dayjs().format('YYYY-MM-DD');

  const theme = useTheme();

  const { isMobile } = useContext(LoadingContext);

  const details = useBoolean();

  const confirm = useBoolean();

  const confirmClose = useBoolean();

  const popover = usePopover();

  const handleSeeAssociated = useCallback(() => {
    if (row?.associatedProject?.id) {
      localStorage.setItem('projectId', row?.associatedProject?.id);
      localStorage.setItem('backFromProjectDetails', 'services');
      router.push(paths.dashboard.project.details(row?.project?.id));
    }
  }, [router, row]);

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
            backgroundColor: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
            )) ? lighten(theme.palette.error.lighter, 0.6) : 'background.paper') : 'background.paper',
            boxShadow: theme.customShadows.z20,
            transition: theme.transitions.create(['background-color', 'box-shadow'], {
              duration: theme.transitions.duration.shortest,
            }),
            '&:hover': {
              backgroundColor: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
                row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
              )) ? lighten(theme.palette.error.lighter, 0.6) : 'background.paper') : 'background.paper'
              , boxShadow: theme.customShadows.z20
            },
          },
          [`& .${tableCellClasses.root}`]: { ...defaultStyles },
          ...(details.value && { [`& .${tableCellClasses.root}`]: { ...defaultStyles } }),
          bgcolor: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
            row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
            row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
          )) ? lighten(theme.palette.error.lighter, 0.7) : 'inherit') : 'inherit',
        }}
      >
        {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
          <TableCell padding="checkbox">
            <Checkbox
              checked={selected}
              onDoubleClick={() => console.info('ON DOUBLE CLICK')}
              onClick={onSelectRow}
              inputProps={{ id: `row-checkbox-${row?.id}`, 'aria-label': `row-checkbox` }}
            />
          </TableCell>
        )}
        <TableCell
          // onClick={handleClick} 
          onClick={onViewRow}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
            )) ? 'fontWeightBold' : 'inherit') : 'inherit',
          }}
          align='left'
        >
          {row?.startDate ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Typography noWrap variant="inherit" sx={{ maxWidth: 360, cursor: 'pointer' }}>
                {fDate(row.startDate)}
              </Typography>
              <Typography noWrap variant="inherit" sx={{ maxWidth: 360, cursor: 'pointer', color: 'text.secondary' }}>
                {row?.duration ? (row?.duration === 1 ? '1 day' : `${row?.duration} days`) : row?.endDate ? fDuration(row?.startDate, row?.endDate) : 'No Duration'}
              </Typography>
            </Box>
          ) : (
            <Tooltip title="No Start Date" arrow>
              <Iconify icon="ph:calendar-x-bold" sx={{ color: 'error.main' }} />
            </Tooltip>
          )}

        </TableCell>


        {/* <TableCell
          onClick={onViewRow}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
            )) ? 'fontWeightBold' : 'inherit') : 'inherit',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography
              noWrap
              variant="inherit"
              sx={{
                maxWidth: 360,
                cursor: 'pointer',
                ...(details.value && { fontWeight: 'fontWeightBold' }),
              }}
            >
              {row?.number}-{row?.version}
            </Typography>
          </Stack>
        </TableCell> */}

        <TableCell
          // onClick={handleClick} 
          onClick={onViewRow}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
            )) ? 'fontWeightBold' : 'inherit') : 'inherit',
          }}
        >
          <Label color={
            row?.byFactory ? 'success' : 'error'
          }>{row?.byFactory ? 'YES' : 'NO'}</Label>

        </TableCell>

        {!isMobile && (
          <>
            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
                )) ? 'fontWeightBold' : 'inherit') : 'inherit',
              }}
            >
              <Label color={
                row?.serviceType === 'installed_by_us' ? 'success' : 'error'
              }>{row?.serviceType === 'installed_by_us' ? 'YES' : 'NO'}</Label>

            </TableCell>
            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{
                cursor: 'pointer',
                maxWidth: 200,
                fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
                )) ? 'fontWeightBold' : 'inherit') : 'inherit',
              }}
            >
              {row?.name}
            </TableCell>
            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{
                cursor: 'pointer',
                maxWidth: 200,
                fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
                )) ? 'fontWeightBold' : 'inherit') : 'inherit',
              }}
            >
              {row?.createdBy?.first_name || row?.createdBy?.firstName} {row?.createdBy?.last_name || row?.createdBy?.lastName}
            </TableCell>

            <TableCell
              onClick={onViewRow}
              sx={{
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
                )) ? 'fontWeightBold' : 'inherit') : 'inherit',
              }}
            >
              <Stack direction="column" alignItems="left" spacing={0}>
                <Typography
                  noWrap
                  variant="inherit"
                  sx={{
                    maxWidth: 360,
                    cursor: 'pointer',
                    color: row?.userManager?.name ? 'text.primary' : 'text.disabled',
                    ...(details.value && { fontWeight: 'fontWeightBold' }),
                  }}
                >
                  {row?.userManager?.firstName || row?.userManager?.first_name || 'No Responsible'}
                </Typography>
                <Typography
                  noWrap
                  variant="inherit"
                  sx={{
                    maxWidth: 360,
                    cursor: 'pointer',
                    color: row?.userManager?.name ? 'text.primary' : 'text.disabled',
                    ...(details.value && { fontWeight: 'fontWeightBold' }),
                  }}
                >
                  {row?.userManager?.lastName || row?.userManager?.last_name}
                </Typography>
              </Stack>
            </TableCell>

            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{ whiteSpace: 'nowrap', cursor: 'pointer', }}
            >
              <Label color={
                row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ? 'default' :
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1 ? 'secondary' :
                    row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1 ? 'success' : 'error'
              }>{row?.currentStage?.name}</Label>
            </TableCell>

            {loadedServiceStages.map((stage) => {

              const stageOrder = stage.order;

              const stageName = stage.name;

              const itemOrder = row?.currentStage?.order

              const hasPermission = row?.hasPermission;

              const selectedTasks = row?.serviceDefaultTasks?.filter(
                (task) => task.service_default_task.service_stage._id === stage.id
              )

              const sumPercentage = selectedTasks?.reduce((acc, task) => {
                if (task.service_default_task.service_stage._id === stage.id) {
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
                        stageOrder > itemOrder ? (stageName !== CONFIG.stages.permission ? `${stageName} is ahead of current stage` : `${stageName} is not available`) :
                          stageOrder === itemOrder && percentage === 0 ? (stageName !== CONFIG.stages.permission ? `${stageName} is current stage` : `${stageName} is not available`) :
                            stageOrder === itemOrder && percentage > 0 && percentage < 50 ? (stageName !== CONFIG.stages.permission ? `${stageName} is current stage and ${percentage.toFixed(2)} % completed` : `${stageName} is not available`) :
                              stageOrder === itemOrder && percentage >= 50 && percentage < 100 ? (stageName !== CONFIG.stages.permission ? `${stageName} is current stage and ${percentage.toFixed(2)} % completed` : `${stageName} is not available`) :
                                `${stageName} is ${percentage.toFixed(2)} % completed and past current stage`
                      } placement="top" arrow>
                        <Iconify sx={{ width: '14px' }} icon={
                          stageOrder > itemOrder ? (stageName !== CONFIG.stages.permission ? "jam:pie-chart-alt" : "garden:circle-full-fill-12") :
                            stageOrder === itemOrder && percentage === 0 ? (stageName !== CONFIG.stages.permission ? "icon-park-solid:pie" : "garden:circle-full-fill-12") :
                              stageOrder === itemOrder && percentage > 0 && percentage < 25 ? (stageName !== CONFIG.stages.permission ? "icon-park-solid:pie-two" : "garden:circle-full-fill-12") :
                                stageOrder === itemOrder && percentage >= 25 && percentage < 50 ? (stageName !== CONFIG.stages.permission ? "icon-park-solid:pie-four" : "garden:circle-full-fill-12") :
                                  stageOrder === itemOrder && percentage >= 50 && percentage < 100 ? (stageName !== CONFIG.stages.permission ? "icon-park-solid:pie-six" : "garden:circle-full-fill-12") : "garden:circle-full-fill-12"
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
            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{
                cursor: 'pointer',
                maxWidth: 200,
                fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
                )) ? 'fontWeightBold' : 'inherit') : 'inherit',
                fontSize: '0.75rem',
              }}
            >
              {fDate(row?.createdTime)}
            </TableCell>
            <TableCell
              // onClick={handleClick} 
              onClick={() => {
                localStorage.removeItem('projectReminderTab');
                onViewRow();
              }}
              sx={{
                // whiteSpace: 'nowrap',
                cursor: 'pointer',
                maxWidth: 200,
                fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
                  row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                )) ? 'fontWeightBold' : 'inherit') : 'inherit',
                fontSize: '0.75rem',
              }}
              align='center'
            >
              {/* {fDate(row?.salesOrder.date)} */}
              {fDateTime(row?.lastModifiedTime) ? fDateTime(row?.lastModifiedTime) :
                <Tooltip title="No Updated Datetime" arrow>
                  <Iconify icon="ph:calendar-x-bold" sx={{ color: 'error.main' }} />
                </Tooltip>
              }
            </TableCell>
          </>
        )}

        <TableCell
          onClick={row?.associatedProject?.id ? handleSeeAssociated : onViewRow}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            maxWidth: 200,
            fontWeight: row?.endDate ? ((fIsAfter(today, dayjs(row?.endDate).format('YYYY-MM-DD')) && (
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              row?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.repair.toLowerCase()) !== -1
            )) ? 'fontWeightBold' : 'inherit') : 'inherit',
          }}
          align='center'
        >
          {row?.associatedProject?.id ? (
            <Tooltip title={`Click to see details of ${row?.associatedProject?.name}...`} arrow>
              <Stack direction="column" alignItems="center" spacing={0}>
                <Typography
                  noWrap
                  variant="inherit"
                  sx={{
                    maxWidth: 360,
                    cursor: 'pointer',
                    ...(details.value && { fontWeight: 'fontWeightBold' }),
                  }}
                >
                  Installation:
                </Typography>
                <Typography
                  noWrap
                  variant="inherit"
                  sx={{
                    maxWidth: 360,
                    cursor: 'pointer',
                    color: row?.associatedProject?.id ? 'text.primary' : 'text.disabled',
                    ...(details.value && { fontWeight: 'fontWeightBold' }),
                  }}
                >
                  <Label
                    variant="soft"
                    color={
                      row?.associatedProject?.id ? 'success' : 'default'
                    }
                    sx={{ cursor: 'pointer' }}
                  >
                    {row?.associatedProject?.number || 'No Associated Installation'}
                  </Label>
                </Typography>
              </Stack>
            </Tooltip>
          ) : (
            <Tooltip title="No Associated Installation" arrow>
              <Iconify icon="ep:failed" sx={{ color: 'error.main' }} />
            </Tooltip>
          )}
        </TableCell>

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
            View Service
          </MenuItem>
          {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ? [
            <MenuItem
              key="close"
              onClick={!row?.isClosed ? () => {
                confirmClose.onTrue();
                popover.onClose();
              } : onCloseRow}
            >
              <Iconify icon={!row?.isClosed ? 'mdi:close-network' : 'material-symbols:reopen-window'} />
              {!row?.isClosed ? 'Close' : 'Reopen'} Service
            </MenuItem>
          ] : null}

          {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.superadmin) ? [
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
              Delete Service
            </MenuItem>
          ] : null}
        </MenuList>
      </CustomPopover >

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Service"
        content={`Are you sure want to delete service ${row.name}?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmClose.value}
        onClose={confirmClose.onFalse}
        title="Close Service"
        content={`Are you sure want to close service ${row.name}?`}
        action={
          <Button variant="contained" color="warning" onClick={onCloseRow}>
            Close
          </Button>
        }
      />
    </>
  );
}
