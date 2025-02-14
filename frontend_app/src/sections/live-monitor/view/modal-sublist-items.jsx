import React, { useContext } from 'react';
import Table from '@mui/material/Table';
import { Box, Button, TextField, Stack, TableContainer, TableHead, TableRow, TableCell, TableBody, InputAdornment, Checkbox, Alert, FormControlLabel } from "@mui/material";
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import IconButton from '@mui/material/IconButton';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Label } from "src/components/label";
import { alpha, useTheme } from '@mui/material/styles';
import { generatePrintablePDF } from 'src/utils/printable-pdf';
import { LoadingContext } from 'src/auth/context/loading-context';
import ExportCSV from "src/utils/export-csv";
import { TableHeadCustom, TableNoData } from 'src/components/table';

export function ModalSublistItems({
  openModal,
  setOpenModal,
  modalDataFiltered,
  modalTitle,
  headersCSV,
  modalButtonColor,
  filters,
  handleFilterName,
  handleViewRow,
  table,
  userLogged,
  hasIgnoredErrors,
  ignoreErrorsSelected,
  setIgnoreErrorsSelected,
  handleCheckboxChange,
  handleSelectAllIgnoreErrors,
  valueIgnoreErrors,
  handleUpdateIgnoreErrors,
  isIgnore,
  setIsIgnore,
  ...other
}) {

  const theme = useTheme();
  const popover = usePopover();

  const { isMobile } = useContext(LoadingContext);

  const TABLE_HEAD = [
    { id: 'no', label: '#' },
    { id: 'sku', label: 'SKU', width: 300 },
    ...(!isMobile ? [
      { id: 'name', label: 'Name', width: 500 },
    ] : []),
    { id: 'stockOnHand', label: 'On Hand', width: 200 },
    { id: 'quantity', label: 'RFID Count', width: 200 },
    { id: 'difference', label: 'Difference', width: 200 },
    ...(userLogged?.data.is_staff && hasIgnoredErrors ? [
      {
        id: 'ignoreErrors',
        label: (
          <FormControlLabel
            control={
              <Checkbox
                checked={ignoreErrorsSelected.length === modalDataFiltered.length && modalDataFiltered.length > 0}
                indeterminate={ignoreErrorsSelected.length > 0 && ignoreErrorsSelected.length < modalDataFiltered.length}
                onChange={(event) => {
                  if (event.target.checked) {
                    const allItemIds = modalDataFiltered.map((item) => item.itemId);
                    setIgnoreErrorsSelected(allItemIds);
                  } else {
                    setIgnoreErrorsSelected([]);
                  }
                }}
              />
            }
            label={isIgnore ? "Ignore Errors?" : "Restore Errors?"}
            sx={{ m: 0 }}
          />
        ),
        disableSorting: true,
        width: 500
      },
    ] : []),
    { id: '', label: 'Actions', width: 200 },
  ];

  const handleClose = (modalId) => {
    setOpenModal((prev) => ({ ...prev, [modalId]: false }));
  };

  return (
    <>
      <ConfirmDialog
        open={openModal.subListItems}
        onClose={() => {
          setIgnoreErrorsSelected([]);
          handleClose('subListItems');
        }}
        title={`${modalTitle} (${modalDataFiltered?.length} items)`}
        maxWidth='lg'
        maxHeight='lg'
        content={
          <>
            <Box sx={{ width: '100%', height: 860, bgcolor: 'background.paper', p: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} flexGrow={1} sx={{ width: 1 }}>
                <TextField
                  fullWidth
                  value={filters.state.name}
                  onChange={handleFilterName}
                  placeholder="Search by item (NAME, SKU, or ID)..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton onClick={popover.onOpen}>
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </Stack>
              <br />
              {ignoreErrorsSelected.length > 0 && (
                <>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Alert
                      severity={isIgnore ? 'error' : 'success'}
                      onClick={() => {
                        console.log('ignoreErrorsSelected', ignoreErrorsSelected);
                      }}
                      sx={{ flexGrow: 1 }}
                    >
                      {ignoreErrorsSelected.length} items to {isIgnore ? 'ignore' : 'restore'} errors have been selected.
                    </Alert>
                  </Box>
                  <br />
                </>
              )}

              {modalDataFiltered?.length > 0 ? (

                <TableContainer sx={{ maxHeight: 440, minHeight: 440 }}>
                  <Table size={table?.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 960 : 380 }} stickyHeader>
                    <TableHeadCustom
                      order={table?.order}
                      orderBy={table?.orderBy}
                      headLabel={TABLE_HEAD}
                      rowCount={modalDataFiltered?.length}
                      onSort={table?.onSort}
                    />
                    {/* <TableHead>
                  <TableRow>
                    <TableCell>No.</TableCell>
                    <TableCell sx={{ width: 300 }}>SKU</TableCell>
                    {!isMobile && <TableCell sx={{ width: 500 }}>Name</TableCell>}
                    <TableCell sx={{ width: 200 }}>On Hand</TableCell>
                    <TableCell sx={{ width: 200 }}>RFID Count</TableCell>
                    <TableCell sx={{ width: 200 }}>Difference</TableCell>
                    <TableCell sx={{ width: 200 }}>Actions</TableCell>
                  </TableRow>
                </TableHead> */}
                    <TableBody>
                      {modalDataFiltered?.map((item, index) => (
                        <TableRow key={`${item.itemId}-${index}`}>
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            {index + 1}
                          </TableCell>
                          <TableCell colSpan={!item.sku ? 2 : 0} sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            {item.sku || (item.itemNumber ? `Item ID: ${item.itemNumber}` : `Item Name: ${item.name}`)}
                          </TableCell>
                          {!isMobile && item.sku &&
                            <TableCell>{item.name}</TableCell>
                          }
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            <Label color='default'>
                              {item.stockOnHand}
                            </Label>
                          </TableCell>
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            <Label color='default'>
                              {item.quantity}
                            </Label>
                          </TableCell>
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            <Label color={item.difference === 0 ? 'success' : item.difference > 0 ? 'warning' : 'error'}>
                              {item.difference}
                            </Label>
                          </TableCell>
                          {userLogged?.data.is_staff && hasIgnoredErrors && (
                            <TableCell padding="checkbox" sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                              <Checkbox
                                checked={ignoreErrorsSelected.includes(item.itemId)}
                                onChange={(event) => handleCheckboxChange(event, item.itemId)}
                                inputProps={{ id: `row-checkbox-${item.itemId}`, 'aria-label': `Row checkbox` }}
                              />
                            </TableCell>
                          )}
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            <Button
                              onClick={() => {
                                handleViewRow(item.itemId);
                              }}
                              sx={{ color: modalButtonColor }}
                            >
                              <Iconify icon="solar:eye-bold" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                  <Table>
                    <TableBody>
                      <TableNoData notFound={modalDataFiltered?.length === 0} />
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

          </>
        }
      />
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
              generatePrintablePDF({ data: modalDataFiltered, title: modalTitle });
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <ExportCSV data={modalDataFiltered} headers={headersCSV} buttonText="Export CSV" docName={modalTitle} />
          </MenuItem>

          {userLogged?.data.is_staff && hasIgnoredErrors && (
            <MenuItem onClick={handleSelectAllIgnoreErrors}>
              <Iconify icon="solar:check-square-bold" />
              {ignoreErrorsSelected.length === modalDataFiltered.length
                ? (isIgnore ? 'Deselect All Ignore Errors' : 'Deselect All Errors')
                : (isIgnore ? 'Select All Ignore Errors' : 'Select All Errors')}
            </MenuItem>
          )}

          {ignoreErrorsSelected.length > 0 && (
            <MenuItem onClick={() => {
              popover.onClose();
              handleUpdateIgnoreErrors();
            }}>
              <Iconify icon="solar:forward-bold" />
              {isIgnore ? 'Ignore seleted errors' : 'Restore selected errors'}
            </MenuItem>
          )}

        </MenuList>
      </CustomPopover>
    </>
  );
}