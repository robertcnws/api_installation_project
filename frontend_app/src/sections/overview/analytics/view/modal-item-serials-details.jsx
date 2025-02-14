import React, { useContext, useMemo } from 'react';
import Table from '@mui/material/Table';
import { Box, Stack, TableContainer, TableRow, TableCell, TableBody, Grid, Typography, ListItemText } from "@mui/material";
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import IconButton from '@mui/material/IconButton';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTheme } from '@mui/material/styles';
import { generatePrintablePDF } from 'src/utils/printable-pdf';
import { LoadingContext } from 'src/auth/context/loading-context';
import ExportCSV from "src/utils/export-csv";
import { TableHeadCustom, TableNoData } from 'src/components/table';
import { fDateTime } from 'src/utils/format-time';

export function ModalItemSerialsDetails({
  openModal,
  setOpenModal,
  modalDataFiltered,
  modalTitle,
  headersCSV,
  table,
  ...other
}) {
  
  const popover = usePopover();

  const { isMobile } = useContext(LoadingContext);

  const TABLE_HEAD = [
    { id: 'createdTime', label: 'Date', width: 300 },
    { id: 'news', label: 'Received (Serials)', width: 300 },
    { id: 'losts', label: 'Shipped (Serials)', width: 300 },
  ];

  const handleClose = (modalId) => {
    setOpenModal((prev) => ({ ...prev, [modalId]: false }));
  };

  const handleLength = (value) => value?.length;

  return (
    <>
      <ConfirmDialog
        open={openModal.itemSerialsDetails}
        onClose={() => {
          handleClose('itemSerialsDetails');
        }}
        // title={`${modalTitle} (SKU: ${modalDataFiltered?.sku})`}
        maxWidth='lg'
        content={
          <>
            {modalDataFiltered ? (
              <Box sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={11}>
                    <Stack direction="row" alignItems="center" spacing={1} flexGrow={1} sx={{ width: 1 }}>
                      <ListItemText
                        primary={<Typography variant="h6">{modalTitle} (SKU: {modalDataFiltered?.sku})</Typography>}
                        secondary={<Typography variant="body2">Date: {fDateTime(modalDataFiltered?.createdTime)}</Typography>}
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={1}>
                    <Stack direction="row" alignItems="flex-end" spacing={1} flexGrow={1} sx={{ width: 1 }}>
                      <IconButton onClick={popover.onOpen}>
                        <Iconify icon="eva:more-vertical-fill" />
                      </IconButton>
                    </Stack>
                  </Grid>
                </Grid>
                <br />

                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table size={table?.dense ? 'small' : 'medium'} sx={{ minWidth: 500 }} stickyHeader>
                    <TableHeadCustom
                      order={table?.order}
                      orderBy={table?.orderBy}
                      headLabel={TABLE_HEAD}
                      rowCount={modalDataFiltered?.length}
                      onSort={table?.onSort}
                    />
                    <TableBody>
                      {modalDataFiltered?.historialDifferences.map((row, index) => (
                        <>
                          {index !== handleLength(modalDataFiltered?.historialDifferences) - 1 && (
                            <>
                              {(row.differences.news.length > 0 || row.differences.losts.length > 0) && (
                                <TableRow key={`${index}-${fDateTime(row.date)}`}>
                                  <TableCell>{fDateTime(row.date)}</TableCell>
                                  <TableCell>{row.differences.news.join(', ')}</TableCell>
                                  <TableCell>{row.differences.losts.join(', ')}</TableCell>
                                </TableRow>
                              )}
                            </>
                          )}
                        </>
                      ))}
                      {/* {Array.from({ length: max }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>{modalDataFiltered?.differences.news[index] || ''}</TableCell>
                          <TableCell>{modalDataFiltered?.differences.losts[index] || ''}</TableCell>
                        </TableRow>
                      ))} */}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <TableContainer sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                <Table>
                  <TableBody>
                    <TableNoData notFound={modalDataFiltered?.length === 0} />
                  </TableBody>
                </Table>
              </TableContainer>
            )}
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
              // generatePrintablePDF({ data: modalDataFiltered, title: modalTitle });
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>

        </MenuList>
      </CustomPopover>
    </>
  );
}