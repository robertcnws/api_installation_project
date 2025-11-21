import { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import { LinearProgress } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { useSetState } from 'src/hooks/use-set-state';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';
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

import { TrackTableRow } from '../track-table-row';
import { TrackTableToolbar } from '../track-table-toolbar';
import { TrackTableFiltersResult } from '../track-table-filters-result';




// ----------------------------------------------------------------------


const headersCSV = [
  { label: 'Name', key: 'name' },
  { label: 'Description', key: 'description' },
]

// ----------------------------------------------------------------------

export function TrackListView() {

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { loadedTracks, loadingTracks, errorTracks, refetchTracks } = useDataContext();

  const [updating, setUpdating] = useState(false);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading data...');

  const TABLE_HEAD = [
    { id: 'user', label: 'User' },
    { id: 'action', label: 'Action' },
    { id: 'date', label: 'Date' },
    { id: 'manageData', label: 'Managed Data' },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'info', label: 'INFO' },
  ];

  const table = useTable({ defaultDense: true, defaultOrder: 'desc', defaultOrderBy: 'createdTime' });

  const [tableData, setTableData] = useState([]);

  const filters = useSetState({ name: '' });


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
    if (refetchTracks) {
      refetchTracks();
    }
    setTableData(loadedTracks || []);
  }, [refetchTracks, loadedTracks]);

  useEffect(() => {
    if (loadedTracks) {
      setTableData(loadedTracks);
    }
  }, [loadedTracks]);

  useEffect(() => {
    const socket = new WebSocket(`${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/tracks/`);
    // socket.onopen = () => {
    //   console.log('WebSocket connected');
    // };
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    // socket.onclose = (e) => {
    //   console.log('WebSocket closed', e);
    // };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
        setTableData((prevData) => {
          const existingItemIndex = prevData.findIndex(item => String(item.id) === String(message.item.id));
          if (existingItemIndex !== -1) {
            const updatedData = [...prevData];
            updatedData[existingItemIndex] = message.item;
            return updatedData;
          }
          return [message.item, ...prevData];
        });
      }
      else if (message.type === 'deleted') {
        setTableData((prevData) => prevData.filter(item => String(item.id) !== String(message.item.id)));
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);


  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.state.name ;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  if (loadingTracks) {
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

  if (errorTracks) {
    return (
      <DashboardContent>
        <Box display="flex" alignItems="center" mb={5}>
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            <Typography>Error fetching items: {errorTracks.message}</Typography>
          </Alert>
        </Box>
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
    <DashboardContent>
        <CustomBreadcrumbs
          // heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.general.analytics },
            { name: 'Track', href: paths.dashboard.track.root },
            { name: 'List' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          

          <TrackTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            dataFiltered={dataFiltered}
            headersCSV={headersCSV}
            setUpdating={setUpdating}
            setTitleLinearProgress={setTitleLinearProgress}
            title='Tracking Logs'
          />

          {canReset && (
            <TrackTableFiltersResult
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
            />
            <Scrollbar>
              {tableData && tableData.length > 0 ? (
                <TableContainer sx={{ maxHeight: 600, minHeight: 600 }}>
                  <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? '100%' : 380 }} stickyHeader>
                    <TableHeadCustom
                      order={table.order}
                      orderBy={table.orderBy}
                      headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                      rowCount={dataFiltered.length}
                      onSort={table.onSort}
                    />

                    <TableBody>
                      {dataFiltered
                        .slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <TrackTableRow
                            key={row.id}
                            row={row}
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

function applyFilter({ inputData, comparator, filters }) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => item.action.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
      JSON.stringify(item.userReporter).toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        JSON.stringify(item.managedData).toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }
  
  return inputData;
}
