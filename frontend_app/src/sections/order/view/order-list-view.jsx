import { useState, useCallback, useEffect, useContext } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { _orders, ORDER_STATUS_OPTIONS } from 'src/_mock';
import { SALES_ORDERS_STATUS_OPTIONS, useSalesOrdersQuery } from 'src/_mock/_orders';
import { CONFIG } from 'src/config-global';


import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LoadingContext } from 'src/auth/context/loading-context';

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

import { OrderTableRow } from '../order-table-row';
import { OrderTableToolbar } from '../order-table-toolbar';
import { OrderTableFiltersResult } from '../order-table-filters-result';


// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...SALES_ORDERS_STATUS_OPTIONS];


// ----------------------------------------------------------------------

export function OrderListView() {

  const { isMobile } = useContext(LoadingContext);

  const TABLE_HEAD = [
    { id: 'salesorderNumber', label: 'Number', width: isMobile ? 50 : 140 },
    { id: 'date', label: 'Date', width: isMobile ? 50 : 140 },
    { id: 'status', label: 'Status', width: isMobile ? 50 : 110 },
    { id: '', width: isMobile ? 30 : 68 },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'info', label: 'INFO' },
    { id: '' },
  ];


  const table = useTable({ defaultOrderBy: 'salesorderNumber', defaultDense: true });

  const router = useRouter();

  const confirm = useBoolean();

  const { loading, error, data } = useSalesOrdersQuery(null, null);

  const [tableData, setTableData] = useState([]);


  useEffect(() => {
    const page = localStorage.getItem('orderPage');
    if (page) {
      table.setPage(parseInt(page, 10));
    }
    const rowsPerPage = localStorage.getItem('orderRowsPerPage');
    if (rowsPerPage) {
      table.setRowsPerPage(parseInt(rowsPerPage, 10));
    }
  }, [table]);



  // useEffect(() => {
  //   const socket = new WebSocket(`wss://${CONFIG.apiHost}/${CONFIG.apiDomain}/ws/inventory_sales_orders/`);

  //   socket.onmessage = (event) => {
  //     const message = JSON.parse(event.data);
  //     if (message.type === 'created' || message.type === 'updated') {
  //       setTableData((prevData) => {
  //         const existingItemIndex = prevData.findIndex(item => item.salesorderId === message.item.salesorderId);
  //         if (existingItemIndex !== -1) {
  //           const updatedData = [...prevData];
  //           updatedData[existingItemIndex] = message.item;
  //           return updatedData;
  //         }
  //         return [message.item, ...prevData];
  //       });
  //     }
  //   };
  //   return () => {
  //     socket.close();
  //   };
  // }, []);

  useEffect(() => {
    if (data && data.length > 0) {
      setTableData(data);
    } else if (!loading && !error) {
      console.error("No data returned from useSalesOrdersQuery");
      setTableData([]);
    }
  }, [data, loading, error]);

  const filters = useSetState({
    salesorderNumber: '',
    status: 'all',
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.salesorderNumber ||
    filters.state.status !== 'all' ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.salesorderId !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.salesorderId));

    toast.success('Delete success!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.order.details(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.general.analytics },
            { name: 'Order', href: paths.dashboard.order.root },
            { name: 'List' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
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
                      ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                      'soft'
                    }
                    color={
                      (tab.value === 'fulfilled' && 'success') ||
                      (tab.value === 'partially_shipped' && 'warning') ||
                      (tab.value === 'draft' && 'error') ||
                      'default'
                    }
                  >
                    {['fulfilled', 'confirmed', 'partially_shipped', 'draft'].includes(tab.value)
                      ? tableData.filter((user) => user.status === tab.value).length
                      : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <OrderTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            dateError={dateError}
          />

          {canReset && (
            <OrderTableFiltersResult
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
                  dataFiltered.map((row) => row.salesorderId)
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

            <Scrollbar sx={{ minHeight: 444 }}>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }} stickyHeader>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={TABLE_HEAD}
                    rowCount={dataFiltered.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        dataFiltered.map((row) => row.salesorderId)
                      )
                    }
                  />

                  <TableBody>
                    {dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row, index) => (
                        <OrderTableRow
                          key={`${row.salesorderId}-${index}`}
                          row={row}
                          selected={table.selected.includes(row.salesorderId)}
                          onSelectRow={() => table.onSelectRow(row.salesorderId)}
                          onDeleteRow={() => handleDeleteRow(row.salesorderId)}
                          onViewRow={() => handleViewRow(row.salesorderId)}
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
              localStorage.setItem('orderPage', newPage);
              table.onChangePage(event, newPage);
            }}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={(event) => {
              localStorage.setItem('orderRowsPerPage', event.target.value);
              table.onChangeRowsPerPage(event);
            }}
          /> */}
        </Card>
      </DashboardContent>

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

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { status, salesorderNumber, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (salesorderNumber) {
    inputData = inputData.filter(
      (order) => (
        order.salesorderNumber.toLowerCase().indexOf(salesorderNumber.toLowerCase()) !== -1 ||
        order.salesorderId.toLowerCase().indexOf(salesorderNumber.toLowerCase()) !== -1 ||
        order.lineItems.toLowerCase().indexOf(salesorderNumber.toLowerCase()) !== -1)
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((order) => order.status === status);
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((order) => fIsBetween(order.date, startDate, endDate));
    }
  }

  return inputData;
}
