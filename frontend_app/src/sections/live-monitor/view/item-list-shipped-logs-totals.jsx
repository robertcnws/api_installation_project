import React, { useContext, useEffect, useMemo, useState } from 'react';
import { LoadingContext } from 'src/auth/context/loading-context';
import { fDate, fDateTime } from 'src/utils/format-time';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import ListItemText from '@mui/material/ListItemText';
import { CustomPopover, usePopover } from 'src/components/custom-popover';
import { Label } from 'src/components/label';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Collapse, MenuItem, MenuList, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import { emptyRows, getComparator, TableEmptyRows, TableHeadCustom, TableNoData, TablePaginationCustom } from 'src/components/table';
import { ModalItemSerialsDetails } from 'src/sections/live-monitor/view/modal-item-serials-details';
import { ItemTableFiltersResult } from 'src/sections/item/item-table-filters-result';
import { ModalSublistItemsSerials } from './modal-sublist-items-serials';
import { BankingContactsToolbar } from '../banking-contacts-toolbar';







// ----------------------------------------------------------------------

const headersCSV = [
    { label: 'SKU', key: 'sku' },
    { label: 'Date', key: 'createdTime' },
    { label: 'New Serials', key: 'news' },
    { label: 'Lost Serials', key: 'losts' },
];


export function ItemListShippedLogsTotals({
    title,
    subheader,
    list,
    openModal,
    setOpenModal,
    handleOpenModal,
    table,
    filters,
    handleFilterName,
    globalDateFilters,
    setStateWidthModal,
    isLive,
    setIsLive,
    ...other
}) {

    const { isMobile } = useContext(LoadingContext);

    const date = fDate(globalDateFilters.state.endDate, 'YYYY-MM-DD');

    const [modalDataFiltered, setModalDataFiltered] = useState(null);
    const modalItemSerialsDetailsTitle = 'Item Serials Details';
    const modalListItemsSerialsTitle = 'List Items Serials';
    const [isItemTable, setIsItemTable] = useState(false);
    const popover = usePopover();


    useEffect(() => {
        setStateWidthModal('md');
        setIsItemTable(false);
    }, [setStateWidthModal]);

    return (
        <>
            <Card {...other}>
                <CardHeader
                    title={title}
                    subheader={subheader}
                />
                <Scrollbar sx={{ maxHeight: 430, minHeight: 430 }}>
                    {list?.length > 0 ? (
                        <Box
                            sx={{
                                p: 1,
                                gap: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 360,
                            }}
                        >
                            {list.map((item, index) => (
                                <Item
                                    key={`${item.itemId}-${index}`}
                                    item={item}
                                    setModalDataFiltered={setModalDataFiltered}
                                    handleOpenModal={handleOpenModal}
                                    date={date}
                                    isLive={isLive}
                                />
                            ))}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableBody>
                                    <TableNoData notFound={list?.length === 0} />
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Scrollbar>
            </Card>

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
                        }}
                    >
                        <Iconify icon="solar:printer-minimalistic-bold" />
                        Print
                    </MenuItem>
                </MenuList>
            </CustomPopover>

            <ModalItemSerialsDetails
                openModal={openModal}
                setOpenModal={setOpenModal}
                modalDataFiltered={modalDataFiltered}
                modalTitle={modalItemSerialsDetailsTitle}
                headersCSV={headersCSV}
                table={table}
                date={date}
            />

            <ModalSublistItemsSerials
                openModal={openModal}
                setOpenModal={setOpenModal}
                modalDataFiltered={list}
                headersCSV={headersCSV}
                table={table}
                filters={filters}
                handleFilterName={handleFilterName}
                modalTitle={modalListItemsSerialsTitle}
            />
        </>
    );
}

function Item({ item, sx, setModalDataFiltered, handleOpenModal, date, isLive, ...other }) {
    return (
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center', ...sx }} {...other}>
            <ListItemText
                primary={item.sku}
                secondary={
                    <>
                        {item.logs.length > 0 && (
                            <>
                                <Box
                                    component="span"
                                    sx={{ display: 'inline-flex', alignItems: 'center', typography: 'body2', color: 'success.main', gap: 1 }}
                                >
                                    <Iconify icon="eva:arrow-ios-upward-fill" width={16} height={16} />
                                    <span>
                                        <b>{
                                            calculateTotalStatus({ date, item, status: 'live' })
                                        }</b> Received
                                    </span>
                                </Box>
                                <br />
                                <Box
                                    component="span"
                                    sx={{ display: 'inline-flex', alignItems: 'center', typography: 'body2', color: 'error.main', gap: 1 }}
                                >
                                    <Iconify icon="eva:arrow-ios-downward-fill" width={16} height={16} />
                                    <span>
                                        <b>{
                                            calculateTotalStatus({ date, item, status: 'remove' }) + calculateTotalStatus({ date, item, status: 'kill' })
                                        }</b> Shipped <span style={{ color: 'orange', fontSize: 'smaller' }}> </span>
                                        <span style={{ fontSize: 'smaller' }}>
                                            <span style={{ color: 'error' }}>
                                                ( Removed: <b>{
                                                    calculateTotalStatus({ date, item, status: 'remove' })
                                                }</b>
                                            </span>,
                                            <span style={{ color: 'darkorange' }}>
                                                 Kill: <b>{
                                                    calculateTotalStatus({ date, item, status: 'kill' })
                                                }</b>
                                            </span> )
                                        </span>
                                    </span>
                                </Box>
                            </>
                        )}
                    </>
                }
            />

            <Tooltip title="See details">
                <IconButton onClick={() => {
                    setModalDataFiltered(item);
                    handleOpenModal('itemSerialsDetails');
                }}>
                    <Iconify icon="solar:transfer-horizontal-bold-duotone" />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

function calculateTotalStatus({ date, item, status }) {
    return item.logs.reduce((acc, h) => {
        if (h.currentStatusName?.toLowerCase().includes(status)
            && !h.lastStatusName?.toLowerCase().includes(status)
            && !acc.seen.has(h.serialNumber)
            && fDate(h.createdTime, 'YYYY-MM-DD').includes(date)) {
            acc.seen.add(h.serialNumber);
            acc.count += 1;
        }
        return acc;
    }, { count: 0, seen: new Set() }).count
}
