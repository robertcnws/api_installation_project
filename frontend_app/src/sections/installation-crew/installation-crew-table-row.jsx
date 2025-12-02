import React, { useContext } from 'react';

import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function InstallationCrewTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow, onViewRow, onReturnList }) {

  const { isMobile } = useContext(LoadingContext);

  const confirm = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell>

        {/* { id: 'name', label: 'Name' },
    { id: 'installers', label: 'Installer(s)' },
    { id: 'assistants', label: 'Assistant(s)' },
    { id: 'costByUnit', label: 'Cost by unit' },
    { id: 'typeCrew', label: 'Crew type' },
    { id: 'status', label: 'Status' }, */}

        {!isMobile ? (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>{row.name}</TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              {row?.usersInstallers.map(installer => (
                <React.Fragment key={installer.id}>
                  {`${installer.firstName || installer.first_name} ${installer.lastName || installer.last_name}`}<br />
                </React.Fragment>
              )
              )}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              {row?.usersHelpers.map(assistant => (
                <React.Fragment key={assistant.name}>
                  {`${assistant.name}`}<br />
                </React.Fragment>
              )
              )}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              {fCurrency(row.costByUnit)} <b>({row.unit?.label})</b>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>{row.typeCrew?.label}</TableCell>

            <TableCell onClick={() => onEditRow()}>
              <Label
                variant="soft"
                color={
                  (row.isActive && 'success') ||
                  (!row.isActive && 'warning') ||
                  'default'
                }
                sx={{ cursor: 'pointer' }}
              >
                {row.isActive ? 'Active' : 'Inactive'}
              </Label>
            </TableCell>

          </>
        ) : (
          <TableCell >
            Name: <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
              onClick={() => onEditRow()}
            >
              <u>{row.name}</u>
            </Label><br />
            Cost By Unit: <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
              onClick={() => onEditRow()}
            >
              <u>{fCurrency(row.costByUnit)} ({row.unit?.label})</u>
            </Label><br />
            <Label
              variant="soft"
              color={
                (row.isActive && 'success') ||
                (!row.isActive && 'warning') ||
                'default'
              }
              sx={{ cursor: 'pointer' }}
              onClick={() => onEditRow()}
            >
              {row.isActive ? 'Active' : 'Inactive'}
            </Label>
          </TableCell>
        )}
        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Stack direction="row" alignItems="center">
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
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
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="ph:pencil-line" />
            Edit Installation Crew
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Installation Crew
          </MenuItem>

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete project installation crew: (${row.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
