import dayjs from 'dayjs';
import React, { useMemo, useState, useContext } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { Box, Tooltip } from '@mui/material';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { lighten, useTheme } from '@mui/material/styles';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { getProjectAttachments } from 'src/utils/project-tasks-utils';
import { fDate, fTime, fIsAfter, fDateTime } from 'src/utils/format-time';
import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function ProjectAttachmentsTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  onViewAttachmentsRow,
  setSelectedAttachmentStage,
  loadedStages,
  listPermissions,
}) {

  // const { refetch: refetchProject } = useProjectByIdQuery(row?.id, {
  //   skip: !row?.id,
  // });

  const [rowUpdated, setRowUpdated] = useState(row);

  // useEffect(() => {
  //   if (refetchProject) {
  //     refetchProject()
  //       .then((response) => {
  //         setRowUpdated(response.data.projectById);
  //       })
  //       .catch((error) => {
  //         console.error('Error fetching project:', error);
  //       });
  //   }
  // }, [refetchProject]);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const today = dayjs().format('YYYY-MM-DD');

  const theme = useTheme();

  const { isMobile } = useContext(LoadingContext);

  const { copy } = useCopyToClipboard();

  const details = useBoolean();

  const share = useBoolean();

  const confirm = useBoolean();

  const popover = usePopover();

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
            backgroundColor: rowUpdated?.endDate ? ((fIsAfter(today, dayjs(rowUpdated?.endDate).format('YYYY-MM-DD')) && (
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
            )) ? lighten(theme.palette.error.lighter, 0.6) : 'background.paper') : 'background.paper',
            boxShadow: theme.customShadows.z20,
            transition: theme.transitions.create(['background-color', 'box-shadow'], {
              duration: theme.transitions.duration.shortest,
            }),
            '&:hover': {
              backgroundColor: rowUpdated?.endDate ? ((fIsAfter(today, dayjs(rowUpdated?.endDate).format('YYYY-MM-DD')) && (
                rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
                rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
                rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
              )) ? lighten(theme.palette.error.lighter, 0.6) : 'background.paper') : 'background.paper'
              , boxShadow: theme.customShadows.z20
            },
          },
          [`& .${tableCellClasses.root}`]: { ...defaultStyles },
          ...(details.value && { [`& .${tableCellClasses.root}`]: { ...defaultStyles } }),
          bgcolor: rowUpdated?.endDate ? ((fIsAfter(today, dayjs(rowUpdated?.endDate).format('YYYY-MM-DD')) && (
            rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
            rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
            rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
          )) ? lighten(theme.palette.error.lighter, 0.7) : 'inherit') : 'inherit',
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
                inputProps={{ id: `rowUpdated-checkbox-${rowUpdated?.id}`, 'aria-label': `rowUpdated-checkbox` }}
              />
            </TableCell>
          )}
        <TableCell
          // onClick={handleClick} 
          onClick={() => {
            localStorage.removeItem('projectReminderTab');
            setSelectedAttachmentStage(null);
            onViewAttachmentsRow();
          }}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: rowUpdated?.endDate ? ((fIsAfter(today, dayjs(rowUpdated?.endDate).format('YYYY-MM-DD')) && (
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
            )) ? 'fontWeightBold' : 'inherit') : 'inherit',
          }}
          align='center'
        >
          {/* {fDate(rowUpdated?.salesOrder.date)} */}
          {fDate(rowUpdated?.startDate) ? fDate(rowUpdated?.startDate) :
            <Tooltip title="No Start Date" arrow>
              <Iconify icon="ph:calendar-x-bold" sx={{ color: 'error.main' }} />
            </Tooltip>
          }
        </TableCell>
        <TableCell
          // onClick={handleClick} 
          onClick={() => {
            localStorage.removeItem('projectReminderTab');
            setSelectedAttachmentStage(null);
            onViewAttachmentsRow();
          }}
          sx={{
            cursor: 'pointer',
            maxWidth: 200,
            fontWeight: rowUpdated?.endDate ? ((fIsAfter(today, dayjs(rowUpdated?.endDate).format('YYYY-MM-DD')) && (
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
            )) ? 'fontWeightBold' : 'inherit') : 'inherit',
          }}
        >
          {rowUpdated?.name}
        </TableCell>

        {loadedStages.map((stage) => {

          const stageName = stage.name;

          const attachments = getProjectAttachments(rowUpdated, stageName);

          return (
            <TableCell
              key={stage.id}
              // onClick={handleClick} 
              onClick={() => {
                localStorage.removeItem('projectReminderTab');
                setSelectedAttachmentStage(stageName);
                onViewAttachmentsRow();
              }}
              sx={{ whiteSpace: 'nowrap', cursor: 'pointer', }}
            >
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                {(attachments?.project?.length > 0 || attachments?.tasks?.length > 0) ? (
                  <Tooltip title={`Files in stage: ${stageName}`} placement="top" arrow>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'column',
                      gap: 1,
                    }}>
                      <Box
                        component="img"
                        src={`${CONFIG.assetsDir}/assets/icons/files/ic-folder.svg`}
                        sx={{
                          width: 0.8,
                          height: 0.8,
                        }}
                        onClick={null}
                      />
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                      }}>
                        {attachments?.project?.length > 0 && (
                          <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.75rem', textAlign: 'center' }}>
                            {`${attachments?.project?.length} Project Files`}
                          </Typography>
                        )}
                        {attachments?.tasks?.length > 0 && (
                          <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.75rem', textAlign: 'center' }}>
                            {`${attachments?.tasks?.length} Tasks Files`}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Tooltip>
                ) : (<Tooltip title={`Files in stage: ${stageName}`} placement="top" arrow>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: 1,
                  }}>
                    <Iconify icon="material-icon-theme:folder-mojo" sx={{ color: 'text.disabled', width: 0.8, height: 0.8 }} />
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'column',
                    }}>
                      <Typography variant='body2' sx={{ color: 'error.main', fontSize: '0.75rem', textAlign: 'center' }}>
                        NO FILES
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>)}
              </Stack>
            </TableCell>
          );
        }
        )}
        <TableCell
          // onClick={handleClick} 
          onClick={() => {
            localStorage.removeItem('projectReminderTab');
            setSelectedAttachmentStage(null);
            onViewAttachmentsRow();
          }}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: rowUpdated?.endDate ? ((fIsAfter(today, dayjs(rowUpdated?.endDate).format('YYYY-MM-DD')) && (
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
              rowUpdated?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
            )) ? 'fontWeightBold' : 'inherit') : 'inherit',
            fontSize: '0.75rem',
          }}
          align='left'
        >
          {/* {fDate(rowUpdated?.salesOrder.date)} */}
          {fDateTime(rowUpdated?.lastModifiedTime) ?
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box component="span" sx={{ typography: 'caption', color: 'text.primary' }} >
                {fDate(rowUpdated?.lastModifiedTime)}
              </Box>
              <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
                {fTime(rowUpdated?.lastModifiedTime)}
              </Box>
            </Box> :
            <Tooltip title="No Updated Datetime" arrow>
              <Iconify icon="ph:calendar-x-bold" sx={{ color: 'error.main' }} />
            </Tooltip>
          }
        </TableCell>



        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap', cursor: 'pointer', }}>
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
              localStorage.removeItem('projectReminderTab');
              onViewRow();
            }}
          >
            <Iconify icon="lsicon:view-filled" />
            View Installation Details
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
              Delete Installation
            </MenuItem>
          ] : null}
        </MenuList>
      </CustomPopover >

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
