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

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

export function ServiceTaskDefaultTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow, onViewRow, onReturnList }) {

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

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>{row.serviceStage.name}</TableCell>

            <TableCell onClick={() => onEditRow()}>
              <Label
                variant="soft"
                color={
                  (row.serviceStageStatus === 'finished' && 'success') ||
                  (row.serviceStageStatus === 'in progress' && 'info') ||
                  (row.serviceStageStatus === CONFIG.taskStatus.notStarted && 'warning') ||
                  (row.serviceStageStatus === 'failed' && 'error') ||
                  'default'
                }
                sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {row.serviceStageStatus}
              </Label>
            </TableCell>

            <TableCell onClick={() => onEditRow()}>
              <Label
                variant="soft"
                color={
                  (row.hasAttachments && 'success') || 'error'
                }
                sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {row.hasAttachments ? 'Yes' : 'No'}
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
              {row.serviceStage ? row.serviceStage.name : '--'}
            </Label><br />
            Linked Status: <Label
                variant="soft"
                color={
                  (row.serviceStageStatus === 'finished' && 'success') ||
                  (row.serviceStageStatus === 'in progress' && 'info') ||
                  (row.serviceStageStatus === CONFIG.taskStatus.notStarted && 'warning') ||
                  (row.serviceStageStatus === 'failed' && 'error') ||
                  'default'
                }
                sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {row.serviceStageStatus}
              </Label><br/>
              Has Attachments?: <Label
                variant="soft"
                color={
                  (row.hasAttachments && 'success') || 'error'
                }
                sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {row.hasAttachments ? 'Yes' : 'No'}
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
            Edit Service Task
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Service Task
          </MenuItem>

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete service task: (${row.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
