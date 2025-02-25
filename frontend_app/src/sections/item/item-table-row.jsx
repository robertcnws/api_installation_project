import React, { useContext } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Paper, Table, Collapse, TableBody, ListItemText, TableContainer } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

export function ItemTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow, onViewRow }) {

  const { isMobile } = useContext(LoadingContext);

  const confirm = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        <TableCell padding="checkbox">
          <Checkbox id={row.itemId} checked={selected} onClick={onSelectRow} />
        </TableCell>

        {!isMobile ? (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.itemId)}>{row.sku}</TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.itemId)}>{row.name}</TableCell>

            <TableCell onClick={() => onViewRow(row.itemId)}>
              <Label
                variant="soft"
                color={
                  (row.status === 'active' && 'success') ||
                  (row.status === 'confirmation_pending' && 'warning') ||
                  (row.status === 'inactive' && 'error') ||
                  'default'
                }
                sx={{ cursor: 'pointer' }}
              >
                {row.status}
              </Label>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.itemId)}>{parseInt(row.stockOnHand, 10)}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.itemId)}>{parseInt(row.quantity, 10)}</TableCell>
            <TableCell onClick={() => onViewRow(row.itemId)}>
              <Label
                sx={{ cursor: 'pointer' }}
                variant="soft"
                color={
                  (row.difference === 0 ? 'success' : row.difference > 0 ? 'warning' : 'error')
                }
              >
                {row.difference}
              </Label>
            </TableCell>
            <TableCell onClick={() => onViewRow(row.itemId)}>
              <Label
                sx={{ cursor: 'pointer' }}
                variant="soft"
                color={
                  (row.syncedWithSenitron && 'info' || 'error')
                }
              >
                {row.syncedWithSenitron ? 'Yes' : 'No'}
              </Label>
            </TableCell>
          </>
        ) : (
          <TableCell >
            <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
              onClick={() => onViewRow(row.itemId)}
            >
              <u>{row.sku || row.name}</u>
            </Label><br />
            <Label
              variant="soft"
              color={
                (row.status === 'active' && 'success') ||
                (row.status === 'confirmation_pending' && 'warning') ||
                (row.status === 'inactive' && 'error') ||
                'default'
              }
              sx={{ cursor: 'pointer' }}
              onClick={() => onViewRow(row.itemId)}
            >
              {row.status}
            </Label>
            Tracked: <Label
              sx={{ cursor: 'pointer' }}
              variant="soft"
              color={
                (row.syncedWithSenitron && 'info' || 'error')
              }
              onClick={() => onViewRow(row.itemId)}
            >
              {row.syncedWithSenitron ? 'Yes' : 'No'}
            </Label><br />
            On Hand: <b>{parseInt(row.stockOnHand, 10)}</b>,
            RFID Count: <b>{parseInt(row.quantity, 10)}</b><br />
            Difference: <Label
              sx={{ cursor: 'pointer' }}
              variant="soft"
              color={
                (row.difference === 0 ? 'success' : row.difference > 0 ? 'warning' : 'error')
              }
              onClick={() => onViewRow(row.itemId)}
            >
              {row.difference}
            </Label>
            <ListItemText
              secondary={
                <>
                  {row.assets.length > 0 ? (
                    <IconButton
                      color={collapse.value ? 'inherit' : 'default'}
                      onClick={collapse.onToggle}
                      sx={{
                        ...(collapse.value && { bgcolor: 'action.hover' }),
                        fontSize: 'small',
                      }}
                    >
                      Details <Iconify icon={collapse.value ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                    </IconButton>
                  ) : (
                    <Label
                      variant="soft"
                      color="warning"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => onViewRow(row.itemId)}
                    >
                      No items
                    </Label>
                  )}
                </>
              }
            />
          </TableCell>
        )}
        {!isMobile && (
          <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
            <Stack direction="row" alignItems="center">
              {row.assets.length > 0 ? (
                <IconButton
                  color={collapse.value ? 'inherit' : 'default'}
                  onClick={collapse.onToggle}
                  sx={{ ...(collapse.value && { bgcolor: 'action.hover' }) }}
                >
                  <Iconify icon={collapse.value ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                </IconButton>
              ) : (
                <Label
                  variant="soft"
                  color="warning"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onViewRow(row.itemId)}
                >
                  No items
                </Label>
              )}
              {!isMobile && (
                <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              )}
            </Stack>
          </TableCell>
        )}
      </TableRow>

      <TableRow key='collapse-assets'>
        <TableCell sx={{ p: 0, border: 'none' }} colSpan={9}>
          <Collapse
            in={collapse.value}
            timeout="auto"
            unmountOnExit
            sx={{ bgcolor: 'background.neutral' }}
          >
            <Paper sx={{ m: 1.5 }}>
              {/* <Label color='info'>Assets</Label> */}
              <Stack spacing={2} direction="row" alignItems="center">
                <TableContainer sx={{ height: '400px' }}>
                  <Table stickyHeader>
                    <TableBody>
                      {row.assets.filter((item) => item.lastSeenAntenna && item.lastZone && item.text3)
                        .map((item, index) => (
                          <React.Fragment key={`${item.id}-${index}-${item.serialNumber}`}>
                            {!isMobile ? (
                              <TableRow key={`${item.id}-${index}-${item.serialNumber}`}>
                                <TableCell>
                                  <Label color='default'>Antenna</Label><br />
                                  {item.lastSeenAntenna}
                                </TableCell>
                                <TableCell>
                                  <Label color='default'>Serial</Label><br />
                                  {item.serialNumber}
                                </TableCell>
                                <TableCell>
                                  <Label color='default'>Last Zone</Label><br />
                                  {item.lastZone}
                                </TableCell>
                                <TableCell>
                                  <Label color='default'>Info</Label><br />
                                  {item.text3}
                                </TableCell>
                                <TableCell>
                                  <Label color='default'>Last Seen</Label><br />
                                  {item.lastSeen ? fDateTime(item.lastSeen) : `Updated:  ${fDateTime(item.updatedAt)}`}
                                </TableCell>
                              </TableRow>
                            ) : (
                              <TableRow key={`${item.id}-${index}-${item.serialNumber}`}>
                                <TableCell>
                                  <Label color='default'>Antenna:</Label> {item.lastSeenAntenna}<br />
                                  <Label color='default'>Serial:</Label> {item.serialNumber}<br />
                                  <Label color='default'>Last Zone:</Label> {item.lastZone}<br />
                                  <Label color='default'>Info:</Label> {item.text3}<br />
                                  <Label color='default'>Last Seen:</Label> {item.lastSeen ? fDateTime(item.lastSeen) : `Updated:  ${fDateTime(item.updatedAt)}`}
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Paper>
          </Collapse>
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
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            View Item
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Item
          </MenuItem>

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete item: ${row.sku} (${row.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
