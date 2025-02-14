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
import { BankingContacts } from '../banking-contacts';

export function ModalListItemsSerials({
    openModal,
    setOpenModal,
    handleOpenModal,
    filters,
    handleFilterName,
    itemsAssetsLogsInfo,
    table,
    ...other
}) {

    const theme = useTheme();
    const popover = usePopover();

    const { isMobile } = useContext(LoadingContext);

    const handleClose = (modalId) => {
        setOpenModal((prev) => ({ ...prev, [modalId]: false }));
    };

    return (
        <>
            <ConfirmDialog
                open={openModal.listItemsSerials}
                onClose={() => {
                    handleClose('listItemsSerials');
                }}
                // title={`${modalTitle} (SKU: ${modalDataFiltered?.sku})`}
                maxWidth='md'
                content={
                    <>
                        {itemsAssetsLogsInfo ? (
                            <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
                                <BankingContacts
                                    title="Items Shipped / Received"
                                    subheader={`
                  ${itemsAssetsLogsInfo?.length} 
                  ${itemsAssetsLogsInfo[0]?.date ? ` Items with last changes at ${fDateTime(itemsAssetsLogsInfo[0]?.date)}` : `SKUs without changes`
                                        }`}
                                    list={itemsAssetsLogsInfo}
                                    openModal={openModal}
                                    setOpenModal={setOpenModal}
                                    handleOpenModal={handleOpenModal}
                                    table={table}
                                    filters={filters}
                                    handleFilterName={handleFilterName}
                                />
                            </Box>
                        ) : (
                            <TableContainer sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                                <Table>
                                    <TableBody>
                                        <TableNoData notFound={itemsAssetsLogsInfo?.length === 0} />
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