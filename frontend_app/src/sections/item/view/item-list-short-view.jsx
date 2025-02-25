import axios from 'axios';
import { useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { LinearProgress } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { useItemsQuery, ITEM_SYNC_OPTIONS, useSenitronItemsQuery, ITEM_STATUS_SHORT_OPTIONS } from 'src/_mock/_items';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';
import {
    useTable,
    rowInPage,
    TableNoData,
    getComparator,
    TableHeadCustom,
    TableSelectedAction,
} from 'src/components/table';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ItemTableRow } from '../item-table-row';
import { ItemTableToolbar } from '../item-table-toolbar';
import { ItemTableFiltersResult } from '../item-table-filters-result';



// ----------------------------------------------------------------------

const STATUS_OPTIONS = [...ITEM_STATUS_SHORT_OPTIONS].concat([
    { value: 'synced', label: 'SKU Tracked' },
    { value: 'matched_100', label: 'SKU Matched 100%' },
    { value: 'excess_items', label: 'SKU with missing items' },
    { value: 'missing_items', label: 'SKU with excess items' },
]);

const headersCSV = [
    { label: 'SKU', key: 'sku' },
    { label: 'Qty', key: 'stockOnHand' },
    { label: 'Difference', key: 'difference' },
]

// ----------------------------------------------------------------------

export function ItemListShortView({ updating, setUpdating, setTitleLinearProgress }) {

    const { isMobile } = useContext(LoadingContext);

    const TABLE_HEAD = [
        { id: 'sku', label: 'SKU', width: isMobile ? 30 : 80 },
        ...(!isMobile ? [
            { id: 'name', label: 'Name', width: isMobile ? 50 : 220 },
        ] : []),
        { id: 'status', label: 'Status', width: isMobile ? 50 : 100 },
        { id: 'stockOnHand', label: 'On Hand', width: isMobile ? 50 : 100 },
        { id: 'quantity', label: 'RFID Count', width: isMobile ? 50 : 100 },
        { id: 'difference', label: 'Difference', width: isMobile ? 50 : 100 },
        { id: 'syncedWithSenitron', label: 'Tracked', width: 50 },
        { id: '', width: 50 },
    ];

    const TABLE_HEAD_MOBILE = [
        { id: 'info', label: 'SKUs' },
        { id: '' },
    ];

    const table = useTable({ defaultDense: true });

    const router = useRouter();

    const confirm = useBoolean();

    const { loading, error, data } = useItemsQuery();

    const { data: senitronData } = useSenitronItemsQuery();

    const [tableData, setTableData] = useState([]);

    const filters = useSetState({ name: '', syncedWithSenitron: [], status: STATUS_OPTIONS.includes(localStorage.getItem('itemStatus')) ? localStorage.getItem('itemStatus') : 'synced' });


    useEffect(() => {
        localStorage.removeItem('routeByAnalytics');
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


    useEffect(() => {
        if (data && data.length > 0 && senitronData && senitronData.length > 0) {
            const rData = data.map((item) => {
                const senitronItem = senitronData.find((sItem) => sItem?.itemNumber === item.itemId);
                return {
                    ...item,
                    previousSyncedWithSenitron: item.syncedWithSenitron,
                    syncedWithSenitron: item.syncedWithSenitron ? item.syncedWithSenitron : !!senitronItem,
                    quantity: senitronItem?.count || 0,
                    difference: parseInt(senitronItem?.count || '0', 10) - parseInt(item.stockOnHand || '0', 10),
                    assets: senitronItem?.assets || [],
                };
            });
            setTableData(rData);
            const payload = rData.filter((item) => !item.previousSyncedWithSenitron && item.syncedWithSenitron).map((item) => ({
                itemId: item.itemId,
                syncedWithSenitron: item.syncedWithSenitron,
            }));
            axios.post(`${CONFIG.apiUrl}/api_zoho/sync/senitron/`, payload)
                .then(() => {
                    console.log('Inventory items tracked with Senitron');
                })
                .catch((err) => {
                    console.error('Error syncing inventory items:', err);
                });
        } else if (!loading && !error) {
            console.error("No data returned from useItemsQuery");
            setTableData([]);
        }
    }, [data, senitronData, loading, error]);


    const dataFiltered = applyFilter({
        inputData: tableData,
        comparator: getComparator(table.order, table.orderBy),
        filters: filters.state,
    });

    const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

    const canReset =
        !!filters.state.name || filters.state.status !== 'synced' || filters.state.syncedWithSenitron.length > 0;

    const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

    const handleDeleteRow = useCallback(
        (id) => {
            const deleteRow = tableData.filter((row) => row.itemId !== id);

            toast.success('Delete success!');

            setTableData(deleteRow);

            table.onUpdatePageDeleteRow(dataInPage.length);
        },
        [dataInPage.length, table, tableData]
    );

    const handleDeleteRows = useCallback(() => {
        const deleteRows = tableData.filter((row) => !table.selected.includes(row.itemId));

        toast.success('Delete success!');

        setTableData(deleteRows);

        table.onUpdatePageDeleteRows({
            totalRowsInPage: dataInPage.length,
            totalRowsFiltered: dataFiltered.length,
        });
    }, [dataFiltered.length, dataInPage.length, table, tableData]);

    const handleEditRow = useCallback(
        (id) => {
            router.push(paths.dashboard.user.edit(id));
        },
        [router]
    );

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
            localStorage.setItem('routeByAnalytics', id);
            localStorage.setItem('itemStatus', filters.state.status);
            router.push(paths.dashboard.item.details(id));
        },
        [router, filters]
    );

    if (loading) {
        return (
            <DashboardContent>
                <Box display="flex" alignItems="center" mb={5}>
                    <Alert severity="info" sx={{ borderRadius: 0, display: 'none' }}>
                        <Typography>Loading...</Typography>
                    </Alert>
                </Box>
            </DashboardContent>
        );
    }

    if (error) {
        return (
            <DashboardContent>
                <Box display="flex" alignItems="center" mb={5}>
                    <Alert severity="error" sx={{ borderRadius: 0 }}>
                        <Typography>Error fetching items: {error.message}</Typography>
                    </Alert>
                </Box>
            </DashboardContent>
        );
    }

    if (!tableData || tableData.length === 0) {
        return (
            <DashboardContent>
                <TableContainer>
                    <Table>
                        <TableBody>
                            <TableNoData notFound={tableData.length === 0} />
                        </TableBody>
                    </Table>
                </TableContainer>
            </DashboardContent>
        );
    }

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
            <Card>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5 }}>
                    <Typography variant="h6">Tracked Inventory SKUs</Typography>
                </Box>
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
                                <Label
                                    variant={
                                        ((tab.value === 'synced' || tab.value === filters.state.status) && 'filled') ||
                                        'soft'
                                    }
                                    color={
                                        (tab.value === 'synced' && 'success') ||
                                        (tab.value === 'missing_items' && 'warning') ||
                                        (tab.value === 'excess_items' && 'error') ||
                                        (tab.value === 'matched_100' && 'info') ||
                                        'default'
                                    }
                                >
                                    {tab.value === 'synced' ?
                                        tableData.filter((it) => it.syncedWithSenitron).length :
                                        tab.value === 'missing_items' ?
                                            tableData.filter(it => parseInt(it.stockOnHand, 10) - parseInt(it.quantity, 10) < 0 && it.syncedWithSenitron).length :
                                            tab.value === 'excess_items' ?
                                                tableData.filter(it => parseInt(it.stockOnHand, 10) - parseInt(it.quantity, 10) > 0 && it.syncedWithSenitron).length :
                                                tab.value === 'matched_100' ?
                                                    tableData.filter(it => parseInt(it.stockOnHand, 10) - parseInt(it.quantity, 10) === 0 && it.syncedWithSenitron).length :
                                                    tableData.filter((it) => it.status === tab.value).length}
                                    {/* {['active', 'confirmation_pending', 'inactive'].includes(tab.value)
                      ? tableData.filter((user) => user.status === tab.value).length
                      : tableData.length} */}
                                </Label>
                            }
                        />
                    ))}
                </Tabs>

                <ItemTableToolbar
                    filters={filters}
                    onResetPage={table.onResetPage}
                    options={{ values: ITEM_SYNC_OPTIONS.map((option) => option.label) }}
                    dataFiltered={dataFiltered}
                    headersCSV={headersCSV}
                    setUpdating={setUpdating}
                    setTitleLinearProgress={setTitleLinearProgress}
                    title={filters.state.status === 'synced' ? 'SKU Tracked' :
                        filters.state.status === 'matched_100' ? 'SKU Matched 100%' :
                            filters.state.status === 'excess_items' ? 'SKU with excess items' :
                                filters.state.status === 'missing_items' ? 'SKU with missing items' :
                                    filters.state.status
                    }
                />

                {canReset && (
                    <ItemTableFiltersResult
                        filters={filters}
                        totalResults={dataFiltered.length}
                        onResetPage={table.onResetPage}
                        sx={{ p: 2.5, pt: 0 }}
                    />
                )}

                <Box sx={{ position: 'relative' }}>
                    <TableSelectedAction
                        dense={table.dense}
                        numSelected={table.selected.length}
                        rowCount={dataFiltered.length}
                        onSelectAllRows={(checked) =>
                            table.onSelectAllRows(
                                checked,
                                dataFiltered.map((row) => row.itemId)
                            )
                        }
                        action={
                            <Tooltip title="Delete">
                                <IconButton color="primary" onClick={confirm.onTrue}>
                                    <Iconify icon="solar:trash-bin-trash-bold" />
                                </IconButton>
                            </Tooltip>
                        }
                    />

                    <Scrollbar>
                        <TableContainer sx={{ maxHeight: 440 }}>
                            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 960 : 280 }} stickyHeader>
                                <TableHeadCustom
                                    order={table.order}
                                    orderBy={table.orderBy}
                                    headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                                    rowCount={dataFiltered.length}
                                    numSelected={table.selected.length}
                                    onSort={table.onSort}
                                    onSelectAllRows={(checked) =>
                                        table.onSelectAllRows(
                                            checked,
                                            dataFiltered.map((row) => row.itemId)
                                        )
                                    }
                                />

                                <TableBody>
                                    {dataFiltered
                                        .slice(
                                            table.page * table.rowsPerPage,
                                            table.page * table.rowsPerPage + table.rowsPerPage
                                        )
                                        .map((row) => (
                                            <ItemTableRow
                                                key={row.itemId}
                                                row={row}
                                                selected={table.selected.includes(row.itemId)}
                                                onSelectRow={() => table.onSelectRow(row.itemId)}
                                                onDeleteRow={() => handleDeleteRow(row.itemId)}
                                                onEditRow={() => handleEditRow(row.itemId)}
                                                onViewRow={() => handleViewRow(row.itemId)}
                                            />
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

                                    {/* <TableEmptyRows
                                        height={table.dense ? 56 : 56 + 20}
                                        emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                                    /> */}

                                    <TableNoData notFound={notFound} />
                                </TableBody>
                            </Table>
                        </TableContainer>
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

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title="Delete"
                content={
                    <>
                        Are you sure want to delete <strong> {table.selected.length} </strong> items?
                    </>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            handleDeleteRows();
                            confirm.onFalse();
                        }}
                    >
                        Delete
                    </Button>
                }
            />
        </>
    );
}

function applyFilter({ inputData, comparator, filters }) {
    const { name, syncedWithSenitron, status } = filters;

    const stabilizedThis = inputData.map((el, index) => [el, index]);

    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });

    inputData = stabilizedThis.map((el) => el[0]);

    if (name) {
        inputData = inputData.filter(
            (item) => item.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item.sku.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item.itemId.toString().indexOf(name.toLowerCase()) !== -1 ||
                item.stockOnHand.toString().indexOf(name.toLowerCase()) !== -1
        );
    }
    if (status === 'synced') {
        inputData = inputData.filter((item) => item.syncedWithSenitron === true);
    } else if (status === 'matched_100') {
        inputData = inputData.filter(item => parseInt(item.stockOnHand, 10) - parseInt(item.quantity, 10) === 0 && item.syncedWithSenitron);
    } else if (status === 'excess_items') {
        inputData = inputData.filter(item => parseInt(item.stockOnHand, 10) - parseInt(item.quantity, 10) > 0 && item.syncedWithSenitron);
    } else if (status === 'missing_items') {
        inputData = inputData.filter(item => parseInt(item.stockOnHand, 10) - parseInt(item.quantity, 10) < 0 && item.syncedWithSenitron);
    }

    // if ()

    // if (syncedWithSenitron.length) {
    //   const trueValues = ['synced', 'yes'];
    //   const falseValues = ['not synced', 'no'];

    //   const shouldIncludeTrue = syncedWithSenitron.some(val => trueValues.includes(val.toLowerCase()));
    //   const shouldIncludeFalse = syncedWithSenitron.some(val => falseValues.includes(val.toLowerCase()));

    //   inputData = inputData.filter(item => {
    //     if (shouldIncludeTrue && shouldIncludeFalse) {
    //       return true;
    //     }
    //     if (shouldIncludeTrue) {
    //       return item.syncedWithSenitron === true;
    //     }
    //     if (shouldIncludeFalse) {
    //       return item.syncedWithSenitron === false;
    //     }
    //     return true;
    //   });
    // }
    return inputData;
}
