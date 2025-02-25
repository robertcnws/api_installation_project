import { useContext } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { ListItemText } from '@mui/material';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

import { UserQuickEditForm } from './user-quick-edit-form';
import { UserQuickChangePasswordForm } from './user-quick-change-password';



// ----------------------------------------------------------------------

export function UserTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {

  const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

  const { isMobile } = useContext(LoadingContext)

  const confirm = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  const quickChangePassword = useBoolean();

  return (
    <>
      {!isMobile ? (
        <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
          <TableCell padding="checkbox">
            {userLogged?.data.id !== row.id && (
              <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
            )}
          </TableCell>

          <TableCell sx={{ cursor: 'pointer' }}>
            <Stack spacing={2} direction="row" alignItems="center">
              <Avatar alt={row.username} src={row.avatarUrl} />

              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                <Link color="inherit" onClick={quickEdit.onTrue} sx={{ cursor: 'pointer' }}>
                  {row.username}
                </Link>
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {row.email}
                </Box>
              </Stack>
            </Stack>
          </TableCell>

          <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={quickEdit.onTrue}>{row.firstName}</TableCell>

          <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={quickEdit.onTrue}>{row.lastName}</TableCell>

          <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={quickEdit.onTrue}>{row.phoneNumber}</TableCell>

          <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={quickEdit.onTrue}>{row.userRole.name}</TableCell>

          <TableCell sx={{ cursor: 'pointer' }} onClick={quickEdit.onTrue}>
            <Label
              variant="soft"
              color={
                (row.isActive && 'success') ||
                (!row.isActive && 'error') ||
                'default'
              }
            >
              {row.isActive ? 'Active' : 'Inactive'}
            </Label>
          </TableCell>

          <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={quickEdit.onTrue}>{fDateTime(row.lastLogin)}</TableCell>

          <TableCell>
            <Stack direction="row" alignItems="center">
              <Tooltip title="Change Password" placement="top" arrow>
                <IconButton
                  color={quickChangePassword.value ? 'inherit' : 'default'}
                  onClick={quickChangePassword.onTrue}
                >
                  <Iconify icon="mdi:password-reset" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quick Edit" placement="top" arrow>
                <IconButton
                  color={quickEdit.value ? 'inherit' : 'default'}
                  onClick={quickEdit.onTrue}
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>

              <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            </Stack>
          </TableCell>
        </TableRow>
      ) : (
        <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
          <TableCell padding="checkbox">
            <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
          </TableCell>

          <TableCell sx={{ cursor: 'pointer' }}>
            <Stack spacing={2} direction="row" alignItems="center">
              <Avatar alt={row.username} src={row.avatarUrl} />

              <Stack sx={{ typography: 'body2', flex: '0 0 auto', alignItems: 'flex-start' }}>
                <Link color="inherit" onClick={quickEdit.onTrue} sx={{ cursor: 'pointer' }}>
                  {row.username}
                </Link>
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {row.email}
                </Box>
              </Stack>
            </Stack><br />
            Name: {row.firstName} {row.lastName}<br />
            Phone: {row.phoneNumber}<br />
            Role: {row.role}<br />
            Last Login: {fDateTime(row.lastLogin)}<br />
            Status: <Label
              variant="soft"
              color={
                (row.isActive && 'success') ||
                (!row.isActive && 'error') ||
                'default'
              }
            >
              {row.isActive ? 'Active' : 'Inactive'}
            </Label>
            <ListItemText
              secondary={
                <>
                  <IconButton
                    color={quickChangePassword.value ? 'inherit' : 'info'}
                    onClick={quickChangePassword.onTrue}
                    sx={{ fontSize: '1rem' }}
                  >
                    Change <Iconify icon="mdi:password-reset" />
                  </IconButton>
                  <IconButton
                    color={quickEdit.value ? 'inherit' : 'info'}
                    onClick={quickEdit.onTrue}
                    sx={{ fontSize: '1rem' }}
                  >
                    Edit <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </>
              }
            />
          </TableCell>
        </TableRow>
      )}

      <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

      <UserQuickChangePasswordForm currentUser={row} open={quickChangePassword.value} onClose={quickChangePassword.onFalse} />

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              quickEdit.onTrue();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              quickChangePassword.onTrue();
              popover.onClose();
            }}
          >
            <Iconify icon="mdi:password-reset" />
            Change password
          </MenuItem>
          {userLogged?.data.username !== row.username && (
            <MenuItem
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete
            </MenuItem>
          )}

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete User"
        content={
          <ListItemText
            primary={`Do you want to delete this user (${row.firstName} ${row.lastName}, username: ${row.username}) ?`}
            secondary="Once you delete this user, you can't recover it."
          />
        }
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
