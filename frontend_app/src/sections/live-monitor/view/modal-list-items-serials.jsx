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
import { fDateTime, fDate } from 'src/utils/format-time';
import { BankingContacts } from '../banking-contacts';

export function ModalListItemsSerials({
    openModal,
    setOpenModal,
    handleOpenModal,
    filters,
    handleFilterName,
    itemsAssetsLogsInfo,
    table,
    globalDateFilters,
    isLive,
    setIsLive,
    ...other
}) {

    const date = fDate(globalDateFilters.state.endDate, 'YYYY-MM-DD');

    const listFiltered = useMemo(() => itemsAssetsLogsInfo.filter(item => fDate(item.date, 'YYYY-MM-DD') === date), [itemsAssetsLogsInfo, date]);

    const totalListShipped = useMemo(() => listFiltered?.filter((item) => item.totalKilled > 0 || item.totalRemoved > 0).length, [listFiltered]);

    const totalListLive = useMemo(() => listFiltered?.filter((item) => item.totalLive > 0).length, [listFiltered]);

    const lastLog = listFiltered?.length > 0 ? listFiltered[0].logs[listFiltered[0].logs.length - 1] : 0;

    const [stateWidthModal, setStateWidthModal] = React.useState('md');


    // const listFiltered = useMemo(() => 
    //     itemsAssetsTrackInfo
    //       ?.filter(item => fDate(item.createdTime, 'YYYY-MM-DD') === date) // Filtra los items por createdTime
    //       .map(item => ({
    //         ...item,
    //         historialDifferences: Array.isArray(item.historialDifferences) 
    //           ? item.historialDifferences.filter(
    //               h => 
    //                 fDate(h.date, 'YYYY-MM-DD') === date &&
    //                 h.differences &&
    //                 (Array.isArray(h.differences.news) && h.differences.news.length > 0 || 
    //                  Array.isArray(h.differences.losts) && h.differences.losts.length > 0)
    //             )
    //           : []
    //       }))
    //       .filter(item => 
    //         Array.isArray(item.historialDifferences) && 
    //         item.historialDifferences.length > 0 &&
    //         item.historialDifferences.some((_, index) => index !== item.historialDifferences.length - 1)
    //       ) || []
    //   , [itemsAssetsTrackInfo, date]);


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
                    setStateWidthModal('md');
                }}
                // title={`${modalTitle} (SKU: ${modalDataFiltered?.sku})`}
                maxWidth={stateWidthModal}
                content={
                    <>
                        {listFiltered ? (
                            <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
                                <BankingContacts
                                    title={`Items ${isLive ? 'Received' : 'Shipped'}`}
                                    subheader={`
                  ${isLive ? totalListLive : totalListShipped} 
                  ${lastLog.createdTime ? ` SKUs with last changes at ${fDate(lastLog.createdTime)}` : `SKUs without changes`
                                        }`}
                                    list={listFiltered}
                                    openModal={openModal}
                                    setOpenModal={setOpenModal}
                                    handleOpenModal={handleOpenModal}
                                    table={table}
                                    filters={filters}
                                    handleFilterName={handleFilterName}
                                    globalDateFilters={globalDateFilters}
                                    setStateWidthModal={setStateWidthModal}
                                    isLive={isLive}
                                    setIsLive={setIsLive}
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