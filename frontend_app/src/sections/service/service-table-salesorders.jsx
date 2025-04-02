import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';
import {
    TableNoData,
    TableHeadCustom,
} from 'src/components/table';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ServiceTableRowSalesorders } from './service-table-row-salesorders';




// ----------------------------------------------------------------------

export function ServiceListSalesordersView({
    findedSalesOrders,
    table,
    openSalesOrderModal,
    setSelectedSalesOrder,
}) {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);


    const TABLE_HEAD = [
        { id: 'salesorder_number', label: 'SO #' },
        { id: 'customer', label: 'Customer' },
        { id: 'date', label: 'Date' },
        { id: 'status', label: 'Status' },
        { id: '' },
    ];

    const TABLE_HEAD_MOBILE = [
        { id: 'info', label: 'Sales Orders' },
        { id: '' },
    ];

    const router = useRouter();

    const confirm = useBoolean();

    const [tableData, setTableData] = useState([]);


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
        if (findedSalesOrders) {
            setTableData(findedSalesOrders || []);
        }
    }, [findedSalesOrders]);

    const handleReturnList = useCallback(
        () => {
            router.push(paths.dashboard.stage.list);
        },
        [router]
    );

    const handleViewRow = useCallback(
        (row) => {
            setSelectedSalesOrder(row);
            openSalesOrderModal.onTrue();
        },
        [openSalesOrderModal, setSelectedSalesOrder]
    );

    if (!tableData) {
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

    return (
        <DashboardContent>
            <Card sx={{ ml: !isMobile ? -5 : 0, mt: -2, minWidth: !isMobile ? '105.5%' : '100%' }}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                    <Scrollbar>
                        {tableData && tableData.length > 0 ? (
                            <TableContainer>
                                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 380 }} stickyHeader>
                                    <TableHeadCustom
                                        order={table.order}
                                        orderBy={table.orderBy}
                                        headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                                        rowCount={tableData.length}
                                        onSort={table.onSort}
                                    />

                                    <TableBody>
                                        {tableData
                                            .slice(
                                                table.page * table.rowsPerPage,
                                                table.page * table.rowsPerPage + table.rowsPerPage
                                            )
                                            .map((row, index) => (
                                                <ServiceTableRowSalesorders
                                                    key={`${row.salesorder_id}-${index}`}
                                                    row={row}
                                                    onViewRow={() => handleViewRow(row)}
                                                />
                                            ))}

                                        {tableData.length > 0 && (
                                            <TableCustomPaginationZohoStyleRow
                                                columnsLength={isMobile ? TABLE_HEAD_MOBILE.length : TABLE_HEAD.length}
                                                data={tableData}
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

                                        <TableNoData notFound={tableData?.length === 0} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableBody>
                                        <TableNoData notFound={tableData.length === 0} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Scrollbar>
                </Box>
            </Card>
        </DashboardContent >
    );
}
