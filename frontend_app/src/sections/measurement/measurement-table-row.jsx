import React, { useMemo, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { Button, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableRow, { tableRowClasses } from '@mui/material/TableRow';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDoubleClick } from 'src/hooks/use-double-click';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fDate, fDateTime } from 'src/utils/format-time';
import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

// import { ProjectShareDialog } from './project-share-dialog';
// import { ProjectFileDetails } from './project-file-details';






// ----------------------------------------------------------------------

export function MeasurementTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onCloseRow,
  onViewRow,
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const router = useRouter();

  const theme = useTheme();

  const { isMobile } = useContext(LoadingContext);

  const { copy } = useCopyToClipboard();

  const details = useBoolean();

  const confirm = useBoolean();

  const confirmCustomerAssociated = useBoolean();

  const confirmClose = useBoolean();

  const popover = usePopover();

  const handleSeeAssociated = useCallback(() => {
    if (row?.project?.id) {
      localStorage.setItem('projectId', row?.project?.id);
      localStorage.setItem('backFromProjectDetails', 'measurements');
      router.push(paths.dashboard.project.details(row?.project?.id));
    }
    else if (row?.service?.id) {
      localStorage.setItem('serviceId', row?.service?.id);
      localStorage.setItem('backFromServiceDetails', 'measurements');
      router.push(paths.dashboard.service.details(row?.service?.id));
    }
    else {
      confirmCustomerAssociated.onTrue();
    }
  }, [router, row, confirmCustomerAssociated]);

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
            '&:hover': {
              backgroundColor: 'background.paper',
              boxShadow: theme.customShadows.z20
            },
          },
          [`& .${tableCellClasses.root}`]: { ...defaultStyles },
          ...(details.value && { [`& .${tableCellClasses.root}`]: { ...defaultStyles } }),
          bgcolor: 'inherit',
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
          onClick={onViewRow}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: 'inherit',
          }}
          align='left'
        >
          {row?.firstDate ? (
            <>
              {fDate(row.firstDate)}
            </>
          ) : (
            <Tooltip title="No First Measurement Date" arrow>
              <Iconify icon="ph:calendar-x-bold" sx={{ color: 'error.main' }} />
            </Tooltip>
          )}

        </TableCell>

        <TableCell
          onClick={onViewRow}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: 'inherit',
          }}
          align='left'
        >
          {row?.checkDate ? (
            <>
              {fDate(row.checkDate)}
            </>
          ) : (
            <Tooltip title="No Check Date" arrow>
              <Iconify icon="ph:calendar-x-bold" sx={{ color: 'error.main' }} />
            </Tooltip>
          )}

        </TableCell>


        <TableCell
          // onClick={handleClick} 
          onClick={onViewRow}
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: 'inherit',
          }}
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
          sx={{
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontWeight: 'inherit',
          }}
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
              {row?.salesOrder?.customer_name || row?.customer?.name}
            </Typography>
          </Stack>
        </TableCell>

        {!isMobile && (
          <>
            <TableCell
              onClick={handleSeeAssociated}
              sx={{
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: 'inherit',
              }}
            >
              <Tooltip title="Click to see details..." arrow>
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
                    <Label
                      variant="soft"
                      color={
                        row?.project?.id ? 'success' :
                          row?.service?.id ? 'warning' :
                            'default'
                      }
                      sx={{ cursor: 'pointer' }}
                    >
                      {
                        row?.project?.id ? `Installation: ${row?.project?.number}` :
                          row?.service?.id ? `Service: ${row?.service?.number}` :
                            'To Customer'
                      }
                    </Label>
                  </Typography>
                </Stack>
              </Tooltip>
            </TableCell>

            <TableCell
              // onClick={handleClick} 
              onClick={onViewRow}
              sx={{
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: 'inherit',
              }}
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
                  {row?.address ? row?.address : 'No Address'}
                </Typography>
              </Stack>
            </TableCell>
            <TableCell
              // onClick={handleClick} 
              onClick={() => {
                localStorage.removeItem('projectReminderTab');
                onViewRow();
              }}
              sx={{
                whiteSpace: 'nowrap',
                cursor: 'pointer',
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
              onViewRow();
            }}
          >
            <Iconify icon="lsicon:view-filled" />
            View Measurement
          </MenuItem>

          {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ? [
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
              Delete Measurement
            </MenuItem>
          ] : null}
        </MenuList>
      </CustomPopover >

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Service"
        content={`Are you sure want to delete measurement ${row.number}?`}
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

      <ConfirmDialog
        open={confirmCustomerAssociated.value}
        onClose={confirmCustomerAssociated.onFalse}
        title="Customer Associated"
        content={
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {row?.number} is associated with a customer.
            </Typography>
            <Stack direction="column" spacing={1}>
              <Typography variant="caption">
                Name: <b>{row?.customer?.name}</b>
              </Typography>
              <Typography variant="caption">
                Address: <b>{row?.customer?.address}</b>
              </Typography>
              <Typography variant="caption">
                Phone: <b>{row?.customer?.phone}</b>
              </Typography>
            </Stack>
          </>
        }
      />

    </>
  );
}
