import React, { useState, useCallback, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { Collapse, Grid, LinearProgress, Link, ListItemText, Paper, Stack, TableCell, TableRow } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';


import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { ITEM_STATUS_SHORT_OPTIONS, ITEM_SYNC_OPTIONS, useItemsQuery, useSenitronItemsQuery } from 'src/_mock/_items';
import { CONFIG } from 'src/config-global';
import { usePopover } from 'src/components/custom-popover';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import { fDate, fIsBetween } from 'src/utils/format-time';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';
import {
    useTable,
    emptyRows,
    rowInPage,
    TableNoData,
    getComparator,
    TableEmptyRows,
    TableHeadCustom,
    TableSelectedAction,
    TablePaginationCustom,
} from 'src/components/table';

import { ItemTableRow } from '../../item/item-table-row';
import { ItemTableToolbar } from '../../item/item-table-toolbar';
import { ItemTableFiltersResult } from '../../item/item-table-filters-result';
import { ItemTableShippedLogsToolbar } from '../item-table-shipped-logs-toolbar';






// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'lost', label: 'Losts' },
    { value: 'not_matched', label: 'To Reconcile' },
    { value: 'matched', label: 'Matched' },

];

const headersCSV = [
    { label: 'SKU', key: 'sku' },
    { label: 'Qty Shipped', key: 'itemTotalQty' },
    { label: 'RFID Count', key: 'shipmentSerialsQuantity' },
    { label: 'Difference', key: 'differenceShipped' },
]

// ----------------------------------------------------------------------

export function ItemListShippedLogsView({
    // itemsAssetsLogsInfo,
    // itemsZohoSenitron,
    // finalGroupedArray,
    setTotalsItemsNoReconciled,
    setTotalsItemsLost,
    setTotalsItemsAll,
    setListItemsNoReconciled,
    setListItemsLost,
    updating,
    setUpdating,
    setTitleLinearProgress,
    globalDateFilters
}) {

    const {
        itemsAssetsLogsInfo,
        itemsZohoSenitron,
        finalGroupedArray,
        setCountLostItems,
    } = useDataContext();

    const { isMobile } = useContext(LoadingContext);

    const TABLE_HEAD = [
        { id: 'sku', label: 'SKU', width: isMobile ? 100 : 350 },
        { id: 'date', label: 'Date', width: isMobile ? 50 : 200 },
        { id: 'itemTotalQty', label: 'Qty Shipped', width: isMobile ? 50 : 100 },
        { id: 'shipmentSerialsQuantity', label: 'RFID Count', width: isMobile ? 50 : 100 },
        { id: 'differenceShipped', label: 'Difference', width: isMobile ? 50 : 100 },
        { id: '' },
    ];

    const TABLE_HEAD_MOBILE = [
        { id: 'info', label: 'Shipped Logs' },
    ];

    const table = useTable({ defaultDense: true });

    const router = useRouter();

    const [tableData, setTableData] = useState([]);

    const [openRowIds, setOpenRowIds] = useState(new Set());

    const toggleRow = (id) => {
        setOpenRowIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const filters = useSetState({
        name: '',
        status: STATUS_OPTIONS.includes(localStorage.getItem('itemStatus')) ? localStorage.getItem('itemStatus') : 'all',
        startDate: null,
        endDate: null,
    });


    useEffect(() => {
        localStorage.removeItem('routeByAnalytics');
        localStorage.removeItem('routeByLiveMonitor');
        localStorage.removeItem('routeByOrder');
        localStorage.removeItem('routeByShipment');
        localStorage.removeItem('routeByShipmentBySku');
    }, []);


    useEffect(() => {
        const page = localStorage.getItem('itemPage');
        if (page) {
            table.setPage(parseInt(page, 10));
        }
        const rowsPerPage = localStorage.getItem('itemRowsPerPage');
        if (rowsPerPage) {
            table.setRowsPerPage(parseInt(rowsPerPage, 10));
        }
    }, [table]);


    const handleShippedSerialQuantity = useCallback(
        (itemShipped) => itemShipped?.logs.reduce(
            (acc, h) => acc + ((h.currentStatusName.toLowerCase().includes('removed') || h.currentStatusName.toLowerCase().includes('kill')) ? 1 : 0), 0
        ), []
    );


    const listSerials = useMemo(
        () => itemsAssetsLogsInfo?.filter((item) => item?.date === fDate(filters.state.endDate, 'YYYY-MM-DD')),
        [itemsAssetsLogsInfo, filters.state.endDate]);


    const listShipments = useMemo(
        () => finalGroupedArray?.filter((item) => item?.date === fDate(filters.state.endDate, 'YYYY-MM-DD')),
        [finalGroupedArray, filters.state.endDate]);

    // const listShipments = useMemo(() => finalGroupedArray, [finalGroupedArray]);

    // console.log('listShipments', listShipments);

    const updateCountItemLost = useCallback(
        (count) => setCountLostItems(count), [setCountLostItems]
    );


    useEffect(() => {
        // const update = () => {
        if (itemsZohoSenitron && itemsZohoSenitron.length > 0 && listSerials && listSerials.length > 0 && listShipments && listShipments.length > 0) {

            const allowedIds = itemsZohoSenitron?.filter((item) => item.syncedWithSenitron).map((item) => item.itemId);

            const allowedIdsSet = new Set(allowedIds);

            const syncedShipments = listShipments?.filter(item => allowedIdsSet.has(item.itemId));

            const rData = syncedShipments?.map((item) => {
                const senitronItem = listSerials?.find((sItem) => sItem?.itemNumber === item.itemId);
                return {
                    ...item,
                    shippedSerialsQuantity: handleShippedSerialQuantity(senitronItem) || 0,
                    differenceShipped: handleShippedSerialQuantity(senitronItem) ?
                        (item.itemTotalQty - handleShippedSerialQuantity(senitronItem)) : item.itemTotalQty,
                    receivedSerialsQuantity: senitronItem?.logs.reduce(
                        (acc, h) => acc + (h.currentStatusName.toLowerCase().includes('live') ? 1 : 0), 0
                    ) || 0,
                    isReconciled: false,
                    logs: senitronItem?.logs,
                };
            });

            const rDataZohoSenitron = rData?.map((item) => {
                const senitronItem = itemsZohoSenitron?.find((sItem) => sItem?.itemId === item.itemId);
                return {
                    ...item,
                    isReconciled: parseInt(senitronItem?.stockOnHand, 10) - parseInt(senitronItem?.quantity, 10) === 0 || false,
                }

            });

            const existingItemIds = new Set(rDataZohoSenitron.map(item => item.itemId));

            const newItems = listSerials
                .filter(item => !existingItemIds.has(item.itemNumber))
                .map(item => ({
                    ...item,
                    itemId: item.itemNumber,
                    itemTotalQty: 0,
                    shippedSerialsQuantity: handleShippedSerialQuantity(item) || 0,
                    differenceShipped: handleShippedSerialQuantity(item) ?
                        (0 - handleShippedSerialQuantity(item)) : 0,
                    receivedSerialsQuantity: item?.logs.reduce(
                        (acc, h) => acc + (h.currentStatusName.toLowerCase().includes('live') ? 1 : 0), 0
                    ) || 0,
                }));


            const updatedRDataZohoSenitron = [...rDataZohoSenitron, ...newItems];



            const filteredData = updatedRDataZohoSenitron?.map(item => {

                const filteredLogs = item.logs?.filter(log => fDate(log.createdAt, 'YYYY-MM-DD') === fDate(filters.state.endDate, 'YYYY-MM-DD'));
                return {
                    ...item,
                    logs: filteredLogs,
                };
            });

            const finalFilteredData = filteredData?.map((item) => {
                const senitronItem = itemsZohoSenitron?.find((sItem) => sItem?.itemId === item.itemId);
                return {
                    ...item,
                    isReconciled: parseInt(senitronItem?.stockOnHand, 10) - parseInt(senitronItem?.quantity, 10) === 0 || false,
                }

            });

            // console.log('finalFilteredData', finalFilteredData);

            const lostCount = finalFilteredData.filter(
                (it) => it.differenceShipped < 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')
            ).length;

            if (lostCount > 0 && fDate(filters.state.endDate, 'YYYY-MM-DD') === fDate(new Date(), 'YYYY-MM-DD')) {
                updateCountItemLost(lostCount);
            }
            else {
                updateCountItemLost(0);
            }

            setTableData(finalFilteredData);

        }
        else {
            updateCountItemLost(0);
        }
    }, [listSerials, listShipments, itemsZohoSenitron, filters.state.endDate, setCountLostItems, handleShippedSerialQuantity, updateCountItemLost]);

    useEffect(() => {
        setListItemsLost(tableData?.filter((item) => item.differenceShipped < 0 && !item.isReconciled && item.date === fDate(filters.state.endDate, 'YYYY-MM-DD')));
        setTotalsItemsLost(tableData?.filter((item) => item.differenceShipped < 0 && !item.isReconciled && item.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length);
        setListItemsNoReconciled(tableData?.filter((item) => item.differenceShipped > 0 && !item.isReconciled && item.date === fDate(filters.state.endDate, 'YYYY-MM-DD')));
        setTotalsItemsNoReconciled(tableData?.filter((item) => item.differenceShipped > 0 && !item.isReconciled && item.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length);
        setTotalsItemsAll(tableData?.length);
    }, [tableData, setTotalsItemsLost, setTotalsItemsNoReconciled, setTotalsItemsAll, setListItemsLost, setListItemsNoReconciled, filters.state.endDate]);

    const dataFiltered = applyFilter({
        inputData: tableData,
        comparator: getComparator(table.order, table.orderBy),
        filters: filters.state,
    });

    const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

    const canReset =
        !!filters.state.name || filters.state.status !== 'all';

    const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

    const handleFilterStatus = useCallback(
        (event, newValue) => {
            table.onResetPage();
            localStorage.setItem('itemStatus', newValue);
            filters.setState({ status: newValue });
        },
        [filters, table]
    );

    const handleViewRow = useCallback(
        (id) => {
            localStorage.removeItem('routeByOrder');
            localStorage.removeItem('routeByShipment');
            localStorage.removeItem('routeByAnalytics');
            localStorage.setItem('routeByLiveMonitor', id);
            localStorage.setItem('itemStatus', filters.state.status);
            router.push(paths.dashboard.item.details(id));
        },
        [router, filters]
    );

    const handleViewShipment = useCallback(
        (id) => {
            localStorage.setItem('routeShipmentByLiveMonitor', id);
            router.push(paths.dashboard.shipment.details(id));
        },
        [router]
    );

    // if (!tableData || tableData.length === 0) {
    //     return (
    //         <DashboardContent>
    //             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5 }}>
    //                 <Typography variant="h6">Shipped Logs</Typography>
    //             </Box>
    //             <TableContainer sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
    //                 <Table>
    //                     <TableBody>
    //                         <TableNoData notFound={tableData.length === 0} />
    //                     </TableBody>
    //                 </Table>
    //             </TableContainer>
    //         </DashboardContent>
    //     );
    // }

    const renderSecondary = (row) => (
        <TableRow>
            <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
                <Collapse
                    in={openRowIds.has(row.itemId)}
                    timeout="auto"
                    unmountOnExit
                    sx={{ bgcolor: 'background.neutral' }}
                    key={`${row.id}-collapse`}
                >
                    <Paper sx={{ m: 1.5 }} key='renderSecondary'>
                        {row.linePackages?.map((item, index) => (
                            <React.Fragment key={`${item.package_id}-${index}`}>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    sx={{
                                        p: (theme) => theme.spacing(1, 1, 1, 1),
                                        '&:not(:last-of-type)': {
                                            borderBottom: (theme) => `solid 2px ${theme.vars.palette.background.neutral}`,
                                        },
                                    }}
                                >
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={11}>
                                            <ListItemText
                                                secondary={
                                                    <>
                                                        <Grid container spacing={1}>
                                                            {!isMobile && (
                                                                <Grid item xs={4}>
                                                                    <Typography variant="body2">
                                                                        SKU: <strong>{row.sku}</strong>
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                            <Grid item xs={!isMobile ? 3 : 7.9}>
                                                                # Shipment: <strong> </strong>
                                                                <Link color="inherit" onClick={() => handleViewShipment(item.shipmentId)} underline="always" sx={{ cursor: 'pointer' }}>
                                                                    <strong>{item.shipmentNumber}</strong>
                                                                </Link>
                                                            </Grid>
                                                            <Grid item xs={!isMobile ? 3 : 3.1}>
                                                                <Typography variant="body2">
                                                                    # Pkg: <strong>{item.packageNumber}</strong>
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={!isMobile ? 2 : 1}>
                                                                <Typography variant="body2">
                                                                    PkgQty: <strong>{parseInt(item.quantity, 10)}</strong>
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </>
                                                }
                                                primaryTypographyProps={{ variant: 'body2' }}
                                                secondaryTypographyProps={{
                                                    component: 'span',
                                                    color: 'text.disabled',
                                                    mt: 0.5,
                                                    ml: 0.5,
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Stack>
                            </React.Fragment>
                        ))}
                    </Paper>
                </Collapse>
            </TableCell>
        </TableRow>
    );

    if (updating) {
        return (
            <DashboardContent>
                <Box
                    sx={{
                        width: '350px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '80vh',
                        margin: 'auto'
                    }}
                >
                    <LinearProgress
                        key="error"
                        sx={{
                            mb: 2,
                            width: '100%',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: 'black',
                            },
                            backgroundColor: '#e0e0e0',
                        }}
                    />
                </Box>
            </DashboardContent>
        );
    }

    return (
        <>
            <Card sx={{ minHeight: isMobile ? '100%' : '40vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                    <Typography variant="h6">Shipped Logs</Typography>
                </Box>
                {tableData?.length > 0 && (
                    <Tabs
                        value={filters.state.status}
                        onChange={handleFilterStatus}
                        sx={{
                            bgcolor: 'whitesmoke',
                            px: 2.5,
                            boxShadow: (theme) =>
                                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
                        }}
                    >
                        {STATUS_OPTIONS.map((tab) => (
                            <Tab
                                key={tab.value}
                                iconPosition="end"
                                value={tab.value}
                                label={tab.label}

                                icon={
                                    <Box
                                        sx={{
                                            bgcolor: tab.value === 'lost' && tableData.filter((it) => it.differenceShipped < 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length > 0 ? 'error.main' :
                                                tab.value === 'not_matched' && tableData.filter((it) => it.differenceShipped > 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length > 0 ? 'warning.main' : 'transparent',
                                            color: tab.value === 'lost' && tableData.filter((it) => it.differenceShipped < 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length > 0 ? 'white' : 'inherit',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: '8px',
                                            border: tab.value === 'lost' && tableData.filter((it) => it.differenceShipped < 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length > 0 ? '2px solid red' :
                                                tab.value === 'not_matched' && tableData.filter((it) => it.differenceShipped > 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length > 0 ? '2px solid #F57C00' : '1px solid transparent',
                                            display: 'inline-block',
                                        }}
                                    >
                                        <Label
                                            variant={
                                                ((tab.value === 'lost' || tab.value === 'not_matched' || tab.value === filters.state.status) && 'filled') ||
                                                'soft'
                                            }
                                            color={
                                                (tab.value === 'matched' && 'success') ||
                                                (tab.value === 'not_matched' && 'warning') ||
                                                (tab.value === 'lost' && 'error') ||
                                                'default'
                                            }
                                        >
                                            {tab.value === 'matched' ?
                                                tableData.filter((it) => it.differenceShipped === 0 && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length :
                                                tab.value === 'not_matched' ?
                                                    tableData.filter((it) => it.differenceShipped > 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length :
                                                    tab.value === 'lost' ?
                                                        tableData.filter((it) => it.differenceShipped < 0 && !it.isReconciled && it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length :
                                                        tableData.filter((it) => it.date === fDate(filters.state.endDate, 'YYYY-MM-DD')).length
                                            }
                                        </Label>
                                    </Box>
                                }
                            />
                        ))}
                    </Tabs>
                )}

                <ItemTableShippedLogsToolbar
                    filters={filters}
                    onResetPage={table.onResetPage}
                    options={{ values: STATUS_OPTIONS.map((option) => option.label) }}
                    dataFiltered={dataFiltered}
                    headersCSV={headersCSV}
                    setUpdating={setUpdating}
                    setTitleLinearProgress={setTitleLinearProgress}
                    isListAll={false}
                    globalDateFilters={globalDateFilters}
                    title={filters.state.status === 'all' ? 'All SKUs' :
                        filters.state.status === 'lost' ? 'Losts Shipped SKUs' :
                            filters.state.status === 'matched' ? 'Shipped SKUs matched' :
                                filters.state.status === 'not_matched' ? 'Shipped SKUs NOT matched' :
                                    filters.state.status
                    }
                />

                {canReset && (
                    <ItemTableFiltersResult
                        filters={filters}
                        totalResults={dataFiltered.length}
                        onResetPage={table.onResetPage}
                        hasNotAll={false}
                        sx={{ p: 2.5, pt: 0 }}
                    />
                )}

                <Box sx={{ position: 'relative' }}>

                    <Scrollbar>
                        {tableData?.length > 0 ? (
                            <TableContainer sx={{
                                maxHeight: filters.state.status === 'all' ? 305 : 205,
                                minHeight: filters.state.status === 'all' ? 305 : 205
                            }}>
                                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 960 : 380 }} stickyHeader>
                                    <TableHeadCustom
                                        order={table.order}
                                        orderBy={table.orderBy}
                                        headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                                        rowCount={dataFiltered.length}
                                        numSelected={table.selected.length}
                                        onSort={table.onSort}
                                        sx={{ color: 'red' }}
                                    />
                                    <TableBody>
                                        {dataFiltered
                                            .slice(
                                                table.page * table.rowsPerPage,
                                                table.page * table.rowsPerPage + table.rowsPerPage
                                            )
                                            .map((row, index) => (
                                                <React.Fragment key={`${row.itemId}-${index}`}>
                                                    {!isMobile ? (
                                                        <TableRow key={`${row.itemId}-${index}`} sx={{ cursor: 'pointer' }}>
                                                            <TableCell>
                                                                <Link color="inherit" onClick={() => handleViewRow(row.itemId)} underline="always" sx={{ cursor: 'pointer' }}>
                                                                    {row.sku}
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell>
                                                                <ListItemText
                                                                    primary={fDate(row.date)}
                                                                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{row.itemTotalQty}</TableCell>
                                                            <TableCell>
                                                                {!row.isReconciled ? row.shippedSerialsQuantity : row.itemTotalQty}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Label
                                                                    sx={{ cursor: 'pointer' }}
                                                                    variant="soft"
                                                                    color={
                                                                        (row.differenceShipped === 0 ? 'success' :
                                                                            row.differenceShipped > 0 && !row.isReconciled ? 'warning' :
                                                                                row.differenceShipped < 0 && !row.isReconciled ? 'error' : 'info')
                                                                    }
                                                                >
                                                                    {!row.isReconciled ? row.differenceShipped : 0}
                                                                </Label>
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
                                                                {row.linePackages?.length > 0 ? (
                                                                    <IconButton
                                                                        color={openRowIds.has(row.itemId) ? 'inherit' : 'default'}
                                                                        onClick={() => toggleRow(row.itemId)}
                                                                        sx={{ ...(openRowIds.has(row.itemId) && { bgcolor: 'action.hover' }) }}
                                                                    >
                                                                        <Iconify icon={openRowIds.has(row.itemId) ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                                                                    </IconButton>
                                                                ) : (
                                                                    <Label
                                                                        variant="soft"
                                                                        color="warning"
                                                                    >
                                                                        No Data Shipment
                                                                    </Label>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        <TableRow key={`${row.itemId}-${index}`} sx={{ cursor: 'pointer' }}>
                                                            <TableCell>
                                                                <Link color="inherit" onClick={() => handleViewRow(row.itemId)} underline="always" sx={{ cursor: 'pointer' }}>
                                                                    {row.sku}
                                                                </Link>
                                                                <ListItemText
                                                                    secondary={`Date: ${fDate(row.date)}`}
                                                                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                                />
                                                                <ListItemText
                                                                    secondary={`Qty: ${row.itemTotalQty}, Count: ${!row.isReconciled ? row.shippedSerialsQuantity : row.itemTotalQty}`}
                                                                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                                />
                                                                <ListItemText
                                                                    secondary={
                                                                        <>
                                                                            Difference:{" "}
                                                                            <Label
                                                                                sx={{ cursor: 'pointer' }}
                                                                                variant="soft"
                                                                                color={
                                                                                    row.differenceShipped === 0
                                                                                        ? 'success'
                                                                                        : row.differenceShipped > 0 && !row.isReconciled
                                                                                            ? 'warning'
                                                                                            : row.differenceShipped < 0 && !row.isReconciled
                                                                                                ? 'error'
                                                                                                : 'info'
                                                                                }
                                                                            >
                                                                                {!row.isReconciled ? row.differenceShipped : 0}
                                                                            </Label>
                                                                        </>
                                                                    }
                                                                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                                />
                                                                <ListItemText
                                                                    secondary={
                                                                        <>
                                                                            {row.linePackages?.length > 0 ? (
                                                                                <IconButton
                                                                                    color={openRowIds.has(row.itemId) ? 'inherit' : 'default'}
                                                                                    onClick={() => toggleRow(row.itemId)}
                                                                                    sx={{ 
                                                                                        ...(openRowIds.has(row.itemId) && { bgcolor: 'action.hover' }), 
                                                                                        fontSize: 'small'
                                                                                    }}
                                                                                >
                                                                                    Shipment Details <Iconify icon={openRowIds.has(row.itemId) ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                                                                                </IconButton>
                                                                            ) : (
                                                                                <Label
                                                                                    variant="soft"
                                                                                    color="warning"
                                                                                >
                                                                                    No Data Shipment
                                                                                </Label>
                                                                            )}
                                                                        </>
                                                                    }
                                                                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                                />

                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    {openRowIds.has(row.itemId) && renderSecondary(row)}
                                                </React.Fragment>
                                            ))}

                                        {dataFiltered.length > 0 && (
                                            <TableCustomPaginationZohoStyleRow
                                                columnsLength={isMobile ? TABLE_HEAD_MOBILE.length : TABLE_HEAD.length}
                                                data={dataFiltered}
                                                page={table.page}
                                                rowsPerPage={table.rowsPerPage}
                                                handleChangePage={(event, newPage) => {
                                                    localStorage.setItem('itemPage', newPage);
                                                    table.onChangePage(event, newPage);
                                                }}
                                                handleChangeRowsPerPage={(event) => {
                                                    localStorage.setItem('itemRowsPerPage', event.target.value);
                                                    table.onChangeRowsPerPage(event);
                                                }}
                                                dense={table.dense}
                                                onChangeDense={table.onChangeDense}
                                            />
                                        )}

                                        <TableNoData notFound={notFound} sx={{ height: 80 }} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <TableContainer sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                                <Table>
                                    <TableBody>
                                        <TableNoData notFound={tableData.length === 0} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Scrollbar>
                </Box>

                {/* <TablePaginationCustom
                    page={table.page}
                    dense={table.dense}
                    count={dataFiltered.length}
                    rowsPerPage={table.rowsPerPage}
                    onPageChange={(event, newPage) => {
                        localStorage.setItem('itemPage', newPage);
                        table.onChangePage(event, newPage);
                    }}
                    onChangeDense={table.onChangeDense}
                    onRowsPerPageChange={(event) => {
                        localStorage.setItem('itemRowsPerPage', event.target.value);
                        table.onChangeRowsPerPage(event);
                    }}
                /> */}
            </Card>
        </>
    );
}

function applyFilter({ inputData, comparator, filters }) {
    const { name, status, startDate, endDate } = filters;

    const stabilizedThis = inputData.map((el, index) => [el, index]);

    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });

    inputData = stabilizedThis.map((el) => el[0]);

    if (name) {
        inputData = inputData.filter(
            (item) => item.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item.sku?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item.itemId?.toString().indexOf(name.toLowerCase()) !== -1
        );
    }
    if (status === 'lost') {
        inputData = inputData.filter((item) => item.differenceShipped < 0 && !item.isReconciled);
    } else if (status === 'matched') {
        inputData = inputData.filter((item) => item.differenceShipped === 0);
    } else if (status === 'not_matched') {
        inputData = inputData.filter((item) => item.differenceShipped > 0 && !item.isReconciled);
    }
    if (startDate && endDate) {
        inputData = inputData.filter((item) => fIsBetween(item.date, startDate, endDate));
    }
    return inputData;
}
