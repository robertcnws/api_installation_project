import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
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
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
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
import { useDataContext } from 'src/auth/context/data/data-context';

import { SalesOrderTableRow } from '../sales-order-table-row';
import { SalesOrderTableToolbar } from '../sales-order-table-toolbar';
import { SalesOrderTableFiltersResult } from '../sales-order-table-filters-result';




// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All SO' }].concat([
  { value: 'confirmed', label: 'Confirmed SO' },
  { value: 'not_confirmed', label: 'Not Confirmed SO' },
]);

const SALES_ORDERS_TYPE_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed SO' },
  { value: 'not_confirmed', label: 'Not Confirmed SO' },
];

const headersCSV = [
  { label: 'SO #', key: 'salesorder_number' },
  { label: 'Customer', key: 'customer_name' },
  { label: 'Date', key: 'date' },
  { label: 'Status', key: 'status' },
]

const getValidTabValue = (options, currentValue) => options.some(
  (tab) => tab.value === currentValue
) ? currentValue : false;

// ----------------------------------------------------------------------

export function SalesOrderListView() {

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    loadedSalesOrders,
    refetchSalesOrders,
    refetchProjects,
    loadedUsers,
    isLoadingSalesOrders,
  } = useDataContext();

  const [listSalesOrders, setListSalesOrders] = useState(null);

  useEffect(() => {
    if (refetchProjects) {
      refetchProjects();
    }
  }, [refetchProjects]);

  // useEffect(() => {
  //   if (refetchSalesOrders) {
  //     refetchSalesOrders();
  //   }
  //   setListSalesOrders(loadedSalesOrders?.results);
  // }, [refetchSalesOrders, loadedSalesOrders]);

  useEffect(() => {
    if (loadedSalesOrders) {
      setListSalesOrders(loadedSalesOrders.results);
    }
  }, [loadedSalesOrders]);

  const [updating, setUpdating] = useState(false);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading data...');

  const TABLE_HEAD = [
    { id: 'salesorder_number', label: 'SO #', width: isMobile ? 30 : 80 },
    { id: 'customer_name', label: 'Customer', width: isMobile ? 50 : 100 },
    { id: 'date', label: 'Date', width: isMobile ? 50 : 100 },
    { id: 'status', label: 'Status', width: isMobile ? 50 : 100 },
    { id: '', width: 50 },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'info', label: 'INFO' },
    { id: '', width: 50 },
  ];

  const table = useTable({ defaultDense: true });

  const router = useRouter();

  const confirm = useBoolean();

  const confirmDelete = useBoolean();

  const filters = useSetState({ name: '', status: localStorage.getItem('salesOrderStatus') || 'all' });

  const collapse = useBoolean(
    filters.state.status === 'confirmed' ||
    filters.state.status === 'not_confirmed'
  );

  const statusValue = getValidTabValue(STATUS_OPTIONS, filters.state.status);
  const salesOrderTypeValue = getValidTabValue(SALES_ORDERS_TYPE_OPTIONS, filters.state.status);


  useEffect(() => {
    localStorage.removeItem('routeByAnalytics');
    localStorage.removeItem('routeByOrder');
    localStorage.removeItem('routeByShipment');
    localStorage.removeItem('routeByShipmentBySku');
  }, []);


  useEffect(() => {
    const page = localStorage.getItem('salesOrderPage');
    if (page) {
      table.setPage(parseInt(page, 10));
    }
    const rowsPerPage = localStorage.getItem('salesOrderRowsPerPage');
    if (rowsPerPage) {
      table.setRowsPerPage(parseInt(rowsPerPage, 10));
    }
  }, [table]);


  const dataFiltered = applyFilter({
    inputData: listSalesOrders || [],
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name || filters.state.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;


  const useDeleteSalesOrdersQuery = (salesOrdersIds) =>
    useQuery({
      queryKey: ['sales_orders_ids', salesOrdersIds.join(',')],
      queryFn: async () => {
        const res = await axios.get(`${CONFIG.apiUrl}/integration/delete_sales_orders/`, {
          params: { sales_orders_ids: salesOrdersIds.join(',') },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        return res.data;
      },
      refetchOnWindowFocus: false,
      enabled: false,
    });

  const [deleteSalesOrdersIds, setDeleteSalesOrdersIds] = useState([]);

  const { data, refetch } = useDeleteSalesOrdersQuery(deleteSalesOrdersIds);

  useEffect(() => {
    if (deleteSalesOrdersIds.length) {
      refetch()
        .then(() => {
          toast.success('Delete success!');
          const deleteRow = listSalesOrders?.filter(
            (row) => deleteSalesOrdersIds.indexOf(row.salesorder_id) === -1
          );
          setListSalesOrders(deleteRow);
          table.onUpdatePageDeleteRow(dataInPage.length);
          setDeleteSalesOrdersIds([]);
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Error deleting row');
          setDeleteSalesOrdersIds([]);
        });
    }
  }, [
    deleteSalesOrdersIds,
    refetch,
    listSalesOrders,
    table,
    dataInPage.length,
    setListSalesOrders,
    setDeleteSalesOrdersIds,
  ]);


  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = listSalesOrders?.filter((row) => row.salesorder_id === id);

      const salesOrdersIds = deleteRow?.map((row) => row.salesorder_id) || [];

      setDeleteSalesOrdersIds(salesOrdersIds);

    },
    [listSalesOrders]
  );


  const handleDeleteRows = useCallback(() => {
    const deleteRows = listSalesOrders?.filter((row) => table.selected.includes(row.salesorder_id));

    const salesOrdersIds = deleteRows?.map((row) => row.salesorder_id) || [];

    setDeleteSalesOrdersIds(salesOrdersIds);

  }, [table, listSalesOrders]);

  const handleCreateRows = useCallback(async () => {

    const salesOrders = listSalesOrders?.filter((row) => table.selected.includes(row.salesorder_id));

    try {
      const promise = axios.post(`${CONFIG.apiUrl}/projects/create/projects/`, {
        salesOrders,
        userReporter: userLogged?.data,
      });

      const response = await promise;

      if (response.status === 200) {
        toast.success(response.data.message);
        table.onUpdatePageDeleteRows({
          totalRowsInPage: dataInPage.length,
          totalRowsFiltered: dataFiltered.length,
        });
        refetchProjects?.();
        refetchSalesOrders?.();
        router.push(paths.dashboard.project.list);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }

  }, [
    dataFiltered.length,
    dataInPage.length,
    table,
    listSalesOrders,
    refetchProjects,
    refetchSalesOrders,
    router,
    userLogged?.data
  ]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      localStorage.setItem('salesOrderStatus', newValue);
      filters.setState({ status: newValue });
      if (newValue !== 'all') {
        collapse.onTrue();
      }
      else {
        collapse.onFalse();
      }
    },
    [filters, table, collapse]
  );

  const handleViewRow = useCallback(
    (id) => {
      localStorage.removeItem('routeByAnalytics');
      localStorage.removeItem('routeByOrder');
      localStorage.removeItem('routeByShipment');
      localStorage.removeItem('routeByShipmentBySku');
      localStorage.setItem('salesOrderStatus', filters.state.status);
      router.push(paths.dashboard.salesOrder.details(id));
    },
    [router, filters]
  );

  const [openCreateProjectDialog, setOpenCreateProjectDialog] = useState(false);

  const [currentSalesOrder, setCurrentSalesOrder] = useState(null);

  if (isLoadingSalesOrders) {
    return (
      <DashboardContent>
        <Box
          sx={{
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            alignSalesOrders: 'center',
            justifyContent: 'center',
            height: '80vh',
            margin: 'auto'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            {titleLinearProgress}
          </Typography>
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
      <DashboardContent>
        <CustomBreadcrumbs
          // heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.general.analytics },
            { name: 'Sales Order', href: paths.dashboard.salesOrder.root },
            { name: 'List' },
          ]}
          // action={
          //   <Button
          //     color="inherit"
          //     variant="outlined"
          //     startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
          //   >
          //     Print
          //   </Button>
          // }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', alignSalesOrders: 'center' }}>
            <Tabs
              value={statusValue}
              onChange={handleFilterStatus}
              sx={{
                px: 2.5,
                // boxShadow: (theme) =>
                //   `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
                width: '97%',
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
                        (tab.value === 'confirmed' && 'success') ||
                        ((tab.value !== 'confirmed' && tab.value !== 'all') && 'warning') ||
                        'default'
                      }
                    >
                      {tab.value === 'confirmed' ?
                        listSalesOrders?.filter((it) => it.status === 'confirmed').length :
                        tab.value === 'not_confirmed' ?
                          listSalesOrders?.filter((it) => it.status !== 'confirmed').length :
                          tab.value === 'all' ?
                            listSalesOrders?.length :
                            listSalesOrders?.filter((it) => it.status === tab.value).length}
                      {/* {['active', 'confirmation_pending', 'inactive'].includes(tab.value)
                      ? tableData.filter((user) => user.status === tab.value).length
                      : tableData.length} */}
                    </Label>
                  }
                />
              ))}
            </Tabs>
          </Box>

          <SalesOrderTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ values: STATUS_OPTIONS.map((option) => option.label) }}
            dataFiltered={dataFiltered}
            headersCSV={headersCSV}
            setUpdating={setUpdating}
            setTitleLinearProgress={setTitleLinearProgress}
            title={filters.state.status === 'all' ? 'All SO' :
              filters.state.status === 'confirmed' ? 'Confirmed SO' :
                filters.state.status === 'not_confirmed' ? 'Confirmed SO' :
                  filters.state.status
            }
          />

          {canReset && (
            <SalesOrderTableFiltersResult
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
                  dataFiltered.map((row) => row.salesorder_id)
                )
              }
              action={
                <>
                  <Tooltip title="Create Installation(s)">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:folder-bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Installation(s)">
                    <IconButton color="error" onClick={confirmDelete.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </>
              }
            />
            <Scrollbar>
              {listSalesOrders && listSalesOrders?.length > 0 ? (
                <TableContainer sx={{ maxHeight: filters.state.status !== 'all' ? 500 : 590 }}>
                  <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 960 : 380 }} stickyHeader>
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
                          dataFiltered.map((row) => row.salesorder_id)
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
                          <SalesOrderTableRow
                            key={`${row.salesorder_id}-${row._id}-${index}`}
                            row={row}
                            selected={table.selected.includes(row.salesorder_id)}
                            onSelectRow={() => table.onSelectRow(row.salesorder_id)}
                            onDeleteRow={() => handleDeleteRow(row.salesorder_id)}
                            onEditRow={() => handleEditRow(row.salesorder_id)}
                            onViewRow={() => handleViewRow(row.salesorder_id)}
                            openCreateProjectDialog={openCreateProjectDialog}
                            setOpenCreateProjectDialog={setOpenCreateProjectDialog}
                            currentSalesOrder={currentSalesOrder}
                            setCurrentSalesOrder={setCurrentSalesOrder}
                            loadedUsers={loadedUsers}
                          />
                        ))}

                      {dataFiltered.length > 0 && (
                        <TableCustomPaginationZohoStyleRow
                          columnsLength={isMobile ? TABLE_HEAD_MOBILE.length : TABLE_HEAD.length}
                          data={dataFiltered}
                          page={table.page}
                          rowsPerPage={table.rowsPerPage}
                          handleChangePage={(event, newPage) => {
                            localStorage.setItem('salesOrderPage', newPage);
                            table.onChangePage(event, newPage);
                          }}
                          handleChangeRowsPerPage={(event) => {
                            localStorage.setItem('salesOrderRowsPerPage', event.target.value);
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
              ) : (
                <TableContainer>
                  <Table>
                    <TableBody>
                      <TableNoData notFound={listSalesOrders?.length === 0} />
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
              localStorage.setItem('salesOrderPage', newPage);
              table.onChangePage(event, newPage);
            }}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={(event) => {
              localStorage.setItem('salesOrderRowsPerPage', event.target.value);
              table.onChangeRowsPerPage(event);
            }}
          /> */}
        </Card>
      </DashboardContent >

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Create Installation(s)"
        content={
          <>
            Are you sure want to create installation(s) from<strong> {table.selected.length} </strong> sales orders?
          </>
        }
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              handleCreateRows();
              confirm.onFalse();
            }}
          >
            Create
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Sales Order"
        content={
          <>
            Are you sure want to delete installation(s) from<strong> {table.selected.length} </strong> sales orders?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={() => {
            handleDeleteRows();
            confirmDelete.onFalse();
          }}>
            Delete
          </Button>
        }
      />

    </>
  );
}

function applyFilter({ inputData, comparator, filters }) {
  const { name, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (salesOrder) => salesOrder.customer_name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        salesOrder.salesorder_number.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        salesOrder.salesorder_id.toString().indexOf(name.toLowerCase()) !== -1 ||
        salesOrder.customer_id.toString().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    if (status === 'confirmed') {
      inputData = inputData.filter((salesOrder) => salesOrder.status === 'confirmed');
    } else if (status === 'not_confirmed') {
      inputData = inputData.filter(salesOrder => salesOrder.status !== 'confirmed');
    }
  }

  return inputData;
}
