import React, { useContext } from 'react';

import { LoadingContext } from 'src/auth/context/loading-context';
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
import { Stack } from '@mui/material';
import { textTransform } from '@mui/system';

// ----------------------------------------------------------------------

export function TaskDefaultTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow, onViewRow, onReturnList }) {

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

        {!isMobile ? (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>{row.name}</TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>{row.order}</TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>{row.projectStage.name}</TableCell>

            <TableCell onClick={() => onEditRow()}>
              <Label
                variant="soft"
                color={
                  (row.projectStageStatus === 'finished' && 'success') ||
                  (row.projectStageStatus === 'in progress' && 'info') ||
                  (row.projectStageStatus === 'not started' && 'warning') ||
                  (row.projectStageStatus === 'failed' && 'error') ||
                  'default'
                }
                sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {row.projectStageStatus}
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
            Order: <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
              onClick={() => onEditRow()}
            >
              <u>{row.order}</u>
            </Label><br />
            Stage: <Label
              sx={{ cursor: 'pointer' }}
              variant="soft"
              color='default'
              onClick={() => onEditRow()}
            >
              {row.projectStage ? row.projectStage.name : '--'}
            </Label><br />
            Linked Status: <Label
                variant="soft"
                color={
                  (row.projectStageStatus === 'finished' && 'success') ||
                  (row.projectStageStatus === 'in progress' && 'info') ||
                  (row.projectStageStatus === 'not started' && 'warning') ||
                  (row.projectStageStatus === 'failed' && 'error') ||
                  'default'
                }
                sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {row.projectStageStatus}
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
            Edit Task
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Task
          </MenuItem>

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete task: (${row.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
