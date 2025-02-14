import { useState, useCallback, useEffect, useContext, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import IconButton from '@mui/material/IconButton';

import { LinearProgress, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { SHIPMENTS_STATUS_OPTIONS, useShipmentsQuery } from 'src/_mock/_shipment';
import { usePackagesQuery } from 'src/_mock/_package';


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

import { ShipmentTableRowListBySku } from '../shipment-table-row-list-by-sku';
import { ShipmentTableToolbarListBySku } from '../shipment-table-toolbar-list-by-sku';
import { ShipmentTableFiltersResultListBySku } from '../shipment-table-filters-result-list-by-sku';



// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...SHIPMENTS_STATUS_OPTIONS];


// ----------------------------------------------------------------------

export function ShipmentListBySkuView() {

  const filters = useSetState({
    sku: '',
    startDate: null,
    endDate: null,
  });

  const parseLineItems = (lineItems) => {
    if (typeof lineItems === 'string') {
      try {
        return JSON.parse(lineItems).filter(item => item.sku);
      } catch (err) {
        console.error('Error al parsear lineItems:', err);
        return [];
      }
    } else {
      return (lineItems || []).filter(item => item.sku);
    }
  }

  const parsePackages = (packages, date = null) => {
    if (typeof packages === 'string') {
      try {
        const parsedPackages = JSON.parse(packages)
          .filter(pkg => pkg.package_id)
          .map(pkg => ({ ...pkg, date }));
        return parsedPackages;
      } catch (err) {
        console.error('Error al parsear packages:', err);
        return [];
      }
    } else {
      return (packages || []).filter(pkg => pkg.package_id).map(pkg => ({ ...pkg, date }));
    }
  };

  const { isMobile } = useContext(LoadingContext);

  const [updating, setUpdating] = useState(false);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading data...');

  const TABLE_HEAD = [
    { id: 'sku', label: 'SKU', width: isMobile ? 50 : 140 },
    { id: 'date', label: 'Date', width: isMobile ? 50 : 110 },
    { id: 'itemTotalQty', label: 'Total Qty Shipped', width: isMobile ? 50 : 140 },
    { id: '', width: isMobile ? 30 : 68 },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'info', label: 'SKUs in Shipments' },
  ];


  const table = useTable({ defaultOrderBy: 'sku', defaultDense: true });

  const router = useRouter();

  const confirm = useBoolean();

  const { data: shipments } = useShipmentsQuery(null, null);

  const [dataShipments, setDataShipments] = useState([]);

  // const [tableData, setTableData] = useState([]);


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


  const allShipments = useMemo(() => shipments || null, [shipments]);

  // console.log('allShipments:', allShipments);

  const allPackages = useMemo(() => {
    if (allShipments) {
      const packages = [];
      allShipments.filter((shipment) => shipment?.date === filters.state.startDate).forEach(shipment => {
        const parsedPackage = parsePackages(shipment.packages, shipment.date);
        packages.push(parsedPackage);
      });
      return packages;
    }
    return null;
  }, [allShipments, filters.state.startDate]);

  // console.log('allPackages:', allPackages);


  // console.log('allShipments:', allPackages?.flatMap(pkgs => pkgs.map(pkg => pkg.package_id)) || []);

  const { data: linePackages } = usePackagesQuery(null, null, allPackages?.flatMap(pkgs => pkgs.map(pkg => pkg.package_id)));

  const allLinePackages = useMemo(() => linePackages || null, [linePackages]);

  const dataItems = useMemo(() => {
    if (linePackages) {
      const items = linePackages?.map(pkg => ({
        packageId: pkg.packageId,
        packageNumber: pkg.packageNumber,
        shipmentId: pkg.shipmentId,
        shipmentNumber: pkg.shipmentNumber,
        totalQuantity: pkg.totalQuantity,
        date: pkg.date,
        items: parseLineItems(pkg.lineItems) || [],
      }));
      return items;
    }
    return [];
  }, [linePackages]);


  // console.log('dataItems:', dataItems);


  const mergeItems = useMemo(() => {
    if (allShipments && allPackages && allLinePackages && dataItems) {
      const merged = dataItems.flatMap(itemList =>
        itemList.items.map(item => ({
          itemId: item.item_id,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          shipmentId: itemList.shipmentId,
          shipmentNumber: itemList.shipmentNumber,
          packageId: itemList.packageId,
          packageNumber: itemList.packageNumber,
          date: itemList.date,
        }))
      );
      return merged;
    }
    return [];
  }, [allShipments, allPackages, allLinePackages, dataItems]);

  const groupedItems = mergeItems.reduce((acc, currentItem) => {
    const { itemId, name, sku, packageId, quantity, shipmentId, shipmentNumber, packageNumber, date } = currentItem;
    const key = `${itemId}-${date}`;
    if (!acc[key]) {
      acc[key] = {
        itemId,
        name,
        sku,
        date,
        itemTotalQty: 0,
        linePackages: []
      };
    }
    acc[key].itemTotalQty += quantity;
    acc[key].linePackages.push({
      packageId,
      packageNumber,
      quantity,
      shipmentId,
      shipmentNumber
    });
    return acc;
  }, {});

  const finalGroupedArray = Object.values(groupedItems);

  const [tableData, setTableData] = useState(null);

  useEffect(() => {
    if (finalGroupedArray) {
      setTableData(finalGroupedArray);
    }
  }, [finalGroupedArray]);

  // console.log('finalGroupedArray:', tableData);

  const dateError = fIsAfter(null, filters.state.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  });

  // console.log('dataFiltered:', dataFiltered);

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.shipmentNumber ||
    !!filters.state.endDate;

  const notFound = (!dataFiltered?.length && canReset) || !dataFiltered?.length;



  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData?.filter((row) => row.itemId !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage?.length);
    },
    [dataInPage?.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData?.filter((row) => !table.selected.includes(row.itemId));

    toast.success('Delete success!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage?.length,
      totalRowsFiltered: dataFiltered?.length,
    });
  }, [dataFiltered?.length, dataInPage?.length, table, tableData]);

  const handleViewRow = useCallback(
    (id) => {
      localStorage.setItem('routeByShipmentBySku', id);
      router.push(paths.dashboard.item.details(id));
    },
    [router]
  );


  if (updating) {
    return (
      <DashboardContent>
        <Box
          sx={{
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
          heading="List By SKU"
          links={[
            { name: 'Dashboard', href: paths.dashboard.general.analytics },
            { name: 'Shipment', href: paths.dashboard.shipment.listBySku },
            { name: 'List By SKU' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>

          <ShipmentTableToolbarListBySku
            filters={filters}
            onResetPage={table.onResetPage}
            dataFiltered={dataFiltered}
            dateError={dateError}
            setUpdating={setUpdating}
            setTitleLinearProgress={setTitleLinearProgress}
          />

          {canReset && (
            <ShipmentTableFiltersResultListBySku
              filters={filters}
              totalResults={dataFiltered?.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered?.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered?.map((row) => row.itemId)
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
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 960 : 380 }} stickyHeader>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                    rowCount={dataFiltered?.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        dataFiltered?.map((row) => row.itemId)
                      )
                    }
                  />

                  <TableBody>
                    {dataFiltered?.slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                      .map((row, index) => (
                        <ShipmentTableRowListBySku
                          key={`${row.itemId}-${index}`}
                          row={row}
                          selected={table.selected.includes(row.itemId)}
                          onSelectRow={() => table.onSelectRow(row.itemId)}
                          onDeleteRow={() => handleDeleteRow(row.itemId)}
                          onViewRow={() => handleViewRow(row.itemId)}
                        />
                      ))}

                    {dataFiltered?.length > 0 && (
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
            count={dataFiltered?.length || 0}
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
            Are you sure want to delete <strong> {table.selected.length} </strong> shipments?
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
  // console.log('inputData:', inputData);
  const { sku, startDate, endDate } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (sku) {
    inputData = inputData?.filter(
      (ship) => (
        ship.sku.toLowerCase().indexOf(sku.toLowerCase()) !== -1 ||
        ship.name.toLowerCase().indexOf(sku.toLowerCase()) !== -1 ||
        ship.linePackages.some(pkg => pkg.packageNumber.toLowerCase().indexOf(sku.toLowerCase()) !== -1) ||
        ship.linePackages.some(pkg => pkg.shipmentNumber.toLowerCase().indexOf(sku.toLowerCase()) !== -1)
      )
    );
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData?.filter((ship) => fIsBetween(ship.date, startDate, endDate));
    }
    else if (endDate) {
      const oneDayBefore = new Date(endDate) - 1;
      inputData = inputData?.filter((ship) => fIsBetween(ship.date, oneDayBefore, endDate));
    }
  }

  return inputData;
}
