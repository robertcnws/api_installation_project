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
import { fDateTime } from 'src/utils/format-time';

export function ModalSublistItemsSerials({
  openModal,
  setOpenModal,
  modalDataFiltered,
  modalTitle,
  headersCSV,
  filters,
  handleFilterName,
  table,
  ...other
}) {

  const theme = useTheme();
  const popover = usePopover();

  const { isMobile } = useContext(LoadingContext);

  const TABLE_HEAD = [
    { id: 'no', label: '#' },
    { id: 'sku', label: 'SKU', width: 300 },
    { id: 'createdTime', label: 'Date', width: 200 },
    { id: 'news', label: 'New Serials', width: 200 },
    { id: 'losts', label: 'Lost Serials', width: 200 },
  ];

  const handleClose = (modalId) => {
    setOpenModal((prev) => ({ ...prev, [modalId]: false }));
  };

  return (
    <>
      <ConfirmDialog
        open={openModal.subListItemsSerials}
        onClose={() => {
          handleClose('subListItemsSerials');
        }}
        title={`${modalTitle} (${modalDataFiltered?.length} items)`}
        maxWidth='lg'
        content={
          <>
            <Box sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} flexGrow={1} sx={{ width: 1 }}>
                <TextField
                  fullWidth
                  value={filters.state.name}
                  onChange={handleFilterName}
                  placeholder="Search by item (SKU)..."
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
              {modalDataFiltered?.length > 0 ? (
                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table size={table?.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }} stickyHeader>
                    <TableHeadCustom
                      order={table?.order}
                      orderBy={table?.orderBy}
                      headLabel={TABLE_HEAD}
                      rowCount={modalDataFiltered?.length}
                      onSort={table?.onSort}
                    />
                    <TableBody>
                      {modalDataFiltered?.map((item, index) => (
                        <TableRow key={`${item.itemId}-${index}`}>
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            {index + 1}
                          </TableCell>
                          <TableCell colSpan={!item.sku ? 2 : 0} sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            {item.sku || (item.itemNumber ? `Item ID: ${item.itemNumber}` : `Item Name: ${item.name}`)}
                          </TableCell>
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            <Label color='default'>
                              {fDateTime(item.createdTime)}
                            </Label>
                          </TableCell>
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            {item?.differences?.news?.map((serial, index2) => (
                              <Label color='default' key={index2}>{serial}</Label>
                            ))}
                          </TableCell>
                          <TableCell sx={{ bgcolor: !item.sku ? alpha(theme.palette.error.main, 0.1) : 'none' }}>
                            {item?.differences?.losts?.map((serial, index2) => (
                              <Label color='default' key={index2}>{serial}</Label>
                            ))}
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

        </MenuList>
      </CustomPopover>
    </>
  );
}