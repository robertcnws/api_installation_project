import dayjs from 'dayjs';
import React, { useMemo, useState, useContext, useCallback } from 'react';

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

import { useBoolean } from 'src/hooks/use-boolean';
import { useDoubleClick } from 'src/hooks/use-double-click';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fDate } from 'src/utils/format-time';
import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

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

  const [rowUpdated, setRowUpdated] = useState(null);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const today = dayjs().format('YYYY-MM-DD');

  // const endDate = dayjs(row?.endDate).format('YYYY-MM-DD');

  // console.log('now', today);
  // console.log('endDate', endDate);
  // console.log('fIsAfter', fIsAfter(now, endDate));

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

  const confirmClose = useBoolean();

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
              onClick={onViewRow}
              sx={{
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: 'inherit',
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
                  {row?.project?.id ? `Installation: ${row?.project?.number}` : row?.service?.id ? `Service: ${row?.service?.number}` : 'No Installation/Service'}
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
                  {row?.address ? row?.address : 'No Address'}
                </Typography>
              </Stack>
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
    </>
  );
}
