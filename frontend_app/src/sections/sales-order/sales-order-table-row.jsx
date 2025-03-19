import React, { useMemo, useContext } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Paper, Table, Divider, Collapse, TableBody, TableContainer } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { SalesOrderCreateProjectDialogForm } from './sales-order-create-project-dialog';


// ----------------------------------------------------------------------

export function SalesOrderTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  openCreateProjectDialog,
  setOpenCreateProjectDialog,
  currentSalesOrder,
  setCurrentSalesOrder,
  loadedUsers,
}) {

  const { isMobile } = useContext(LoadingContext);

  const {
    listPermissions
  } = useDataContext();

  const userLogged = useMemo(() => sessionStorage.getItem('userLogged'), []);

  const confirm = useBoolean();

  const confirmDelete = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        {!isMobile ? (
          <>
            <TableCell padding="checkbox">
              <Checkbox id={row.salesorder_id} checked={selected} onClick={onSelectRow} />
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.salesorder_id)}>{row.salesorder_number}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.salesorder_id)}>{row.customer_name}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.salesorder_id)}>{fDate(row.date)}</TableCell>
            <TableCell onClick={() => onViewRow(row.salesorder_id)}>
              <Label
                variant="soft"
                color={
                  (row.status === 'confirmed' && 'success') ||
                  (row.status !== 'confirmed' && 'warning') ||
                  'default'
                }
                sx={{ cursor: 'pointer' }}
              >
                {row.status}
              </Label>
            </TableCell>
          </>
        ) : (
          <>
            <TableCell padding="checkbox">
              <Checkbox id={row.salesorder_id} checked={selected} onClick={onSelectRow} />
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow(row.salesorder_id)}>
              <Label variant="soft" sx={{ cursor: 'pointer' }}>SO #</Label>: {row.salesorder_number}<br />
              <Label variant="soft" sx={{ cursor: 'pointer' }}>Customer</Label>: {row.customer_name}<br />
              <Label variant="soft" sx={{ cursor: 'pointer' }}>Date</Label>: {fDate(row.date)}<br />
              <Label variant="soft" sx={{ cursor: 'pointer' }}>Status</Label>:
              <Label
                variant="soft"
                color={
                  (row.status === 'confirmed' && 'success') ||
                  (row.status !== 'confirmed' && 'warning') ||
                  'default'
                }
                sx={{ cursor: 'pointer' }}
              >
                {row.status}
              </Label>
            </TableCell>
          </>
        )}

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Stack direction="row" alignItems="center">
            {row.line_items?.length > 0 ? (
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
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>
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
                <TableContainer sx={{ maxHeight: '400px' }}>
                  <Table stickyHeader>
                    <TableBody>
                      {row.line_items?.map((item, index) => (
                        <React.Fragment key={`${item.id}-${index}-${item.serialNumber}`}>
                          {!isMobile ? (
                            <TableRow key={`${item.id}-${index}-${item.serialNumber}`}>
                              <TableCell>
                                <Label color='default'>Item</Label><br />
                                {item.description || item.name || item.group_name}
                              </TableCell>
                              <TableCell>
                                <Label color='default'>Qty</Label><br />
                                {item.quantity}
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow key={`${item.id}-${index}-${item.serialNumber}`}>
                              <TableCell sx={{ maxWidth: '50px' }}>
                                <Label color='default'>Item:</Label> {item.description || item.name || item.group_name}<br />
                                <Label color='default'>Qty:</Label> {item.quantity}
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
              // confirm.onTrue();
              popover.onClose();
              setCurrentSalesOrder(row);
              setOpenCreateProjectDialog(true)
            }}
          >
            <Iconify icon="solar:folder-bold" />
            Create Project
          </MenuItem>
          <MenuItem
            onClick={() => {
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            View Sales Order
          </MenuItem>
          {(verifyPermissions(
            listPermissions,
            CONFIG.permissions.system,
            CONFIG.permissions.moduleProjects,
            CONFIG.permissions.operationDelete
          ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
              <>
                <Divider key="divider" sx={{ borderStyle: 'dashed' }} />
                <MenuItem
                  key="delete"
                  onClick={() => {
                    confirmDelete.onTrue();
                    popover.onClose();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                  Delete Sales Order
                </MenuItem>
              </>
            )}

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Create Project"
        content={
          <>
            Are you sure want to create new project from sales order:<strong> {row.salesorder_number}</strong>?
          </>
        }
        action={
          <Button variant="contained" color="success" onClick={() => {
            confirm.onFalse();
            setCurrentSalesOrder(row);
            setOpenCreateProjectDialog(true);
          }}>
            Create
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Sales Order"
        content={`Are you sure want to delete sales order ${row.salesorder_number}?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />

      <SalesOrderCreateProjectDialogForm
        currentSalesOrder={currentSalesOrder}
        loadedUsers={loadedUsers}
        open={openCreateProjectDialog}
        onClose={() => setOpenCreateProjectDialog(false)}
      />

    </>
  );
}
