import axios from 'axios';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import { Box, Typography, LinearProgress } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, rowInPage, getComparator } from 'src/components/table';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { MeasurementTable } from '../measurement-table';
import { MeasurementFilters } from '../measurement-filters';
import { MeasurementFiltersResult } from '../measurement-filters-result';




// ----------------------------------------------------------------------

export function MeasurementView() {

  const { isMobile } = useContext(LoadingContext);

  localStorage.setItem('backFromMeasurementDetails', 'measurements');

  const {
    loadedMeasurements,
    refetchMeasurements,
    loadingMeasurements,
  } = useDataContext();

  const table = useTable({ defaultRowsPerPage: 10, defaultDense: true, defaultOrder: 'desc', defaultOrderBy: 'firstDate' });

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const router = useRouter();

  const openDateRange = useBoolean();

  const confirm = useBoolean();

  const upload = useBoolean();

  const [view, setView] = useState(localStorage.getItem('measurementView') || 'list');

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    localStorage.setItem('backFromMeasurementDetails', '');
    localStorage.setItem('backFromMeasurementDetailsProjectId', '');
    localStorage.setItem('backFromMeasurementDetailsServiceId', '');
  });

  useEffect(() => {
    if (refetchMeasurements) {
      refetchMeasurements();
    }
    setTableData(loadedMeasurements || []);
  }, [refetchMeasurements, loadedMeasurements]);

  useEffect(() => {
    if (loadedMeasurements) {
      setTableData(loadedMeasurements);
    }
  }, [loadedMeasurements]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/measurements/ws/measurements/`);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
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

  const filters = useSetState({
    name: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.state.name;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleChangeView = useCallback((event, newView) => {
    if (newView !== null) {
      localStorage.setItem('measurementView', newView);
      setView(newView);
    }
  }, []);

  const handleDeleteItem = useCallback(
    async (id) => {

      const promise = axios.delete(`${CONFIG.apiUrl}/measurements/delete/measurement/${id}/`, {
        data: {
          userReporter: userLogged?.data,
        }
      });

      const response = await promise;

      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);

      refetchMeasurements?.();

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData, refetchMeasurements, userLogged]
  );

  const handleDeleteItems = useCallback(
    async () => {
      const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

      const promise = axios.delete(`${CONFIG.apiUrl}/measurements/delete/measurements/`, {
        data: {
          ids: table.selected,
          userReporter: userLogged?.data,
        },
      });

      const response = await promise;

      toast.success('Delete success!');

      setTableData(deleteRows);

      refetchMeasurements?.();

      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    }, [dataFiltered.length, dataInPage.length, table, tableData, refetchMeasurements, userLogged]);


  const handleCloseItem = useCallback(
    async (id, isClosed) => {
      const promise = axios.post(`${CONFIG.apiUrl}/measurements/update/measurement/${id}/close-measurement/`, {
        userReporter: JSON.stringify(userLogged?.data),
        isClosed,
      });

      await promise;

      toast.success('Closing success!');

      refetchMeasurements?.();

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, refetchMeasurements, userLogged]
  );

  const handleDetailsView = useCallback(
    (id) => {
      localStorage.setItem('measurementId', id);
      localStorage.setItem('backFromMeasurementDetails', 'measurements');
      const listData = dataFiltered.map((item) => ({
        id: item.id,
        number: item.number,
        customerName: item.salesOrder?.customer_name || item.customer.name,
      }));
      localStorage.setItem('measurementFilteredList', JSON.stringify(listData));
      router.push(paths.dashboard.measurement.details(id));
    },
    [router, dataFiltered]
  );

  const renderFilters = (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      sx={{ width: 1, mb: 0 }}
    >
      <MeasurementFilters
        filters={filters}
        onResetPage={table.onResetPage}
      />



      <ToggleButtonGroup size="small" value={view} exclusive onChange={handleChangeView}>
        <ToggleButton value="list">
          <Iconify icon="solar:list-bold" />
        </ToggleButton>

        {/* <ToggleButton value="grid">
          <Iconify icon="mingcute:dot-grid-fill" />
        </ToggleButton>

        <ToggleButton value="calendar">
          <Iconify icon="ion:calendar-outline" />
        </ToggleButton>

        {!isInstaller(userLogged?.data?.user_role?.name) && (
          <ToggleButton value="kanban">
            <Iconify icon="tabler:layout-kanban" />
          </ToggleButton>
        )} */}

      </ToggleButtonGroup>

      {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff) && (

        <Button
          component={RouterLink}
          href={paths.dashboard.measurement.new}
          // color="inherit"
          // variant="outlined"
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New
        </Button>
      )}

    </Stack>
  );

  const renderResults = (
    <MeasurementFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      onResetPage={table.onResetPage}
    />
  );

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading measurements data...');

  return (
    <>
      {
        (loadingMeasurements) ? (
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
        ) : (
          <>
            <DashboardContent>

              <Stack spacing={2.5} sx={{ my: { xs: 3, md: 3 } }}>
                {renderFilters}

                {canReset && renderResults}
              </Stack>

              {notFound ? (
                <EmptyContent filled sx={{ py: 10 }} />
              ) : (
                <>
                  {view === 'list' && (
                    <MeasurementTable
                      table={table}
                      dataFiltered={dataFiltered}
                      onDeleteRow={handleDeleteItem}
                      onCloseRow={handleCloseItem}
                      onViewRow={handleDetailsView}
                      notFound={notFound}
                      onOpenConfirm={confirm.onTrue}
                      setTableData={setTableData}
                    />
                    // ) : view === 'grid' ? (
                    //   <MeasurementGridView
                    //     table={table}
                    //     dataFiltered={dataFiltered}
                    //     onDeleteItem={handleDeleteItem}
                    //     onKanbanView={handleViewKanban}
                    //     onViewRow={handleDetailsView}
                    //     onOpenConfirm={confirm.onTrue}
                    //     loadedUsers={loadedUsers}
                    //     loadedMeasurementPermissions={loadedMeasurementPermissions}
                    //     loadedMeasurementStages={finalStages}
                    //     loadedMeasurementStagesTask={loadedMeasurementStagesTask}
                    //     listPermissions={listPermissions}
                    //     setTableData={setTableData}
                    //     refetchMeasurements={refetchMeasurements}
                    //     onOpenConfirmStaff={confirmStaff.onTrue}
                    //     isWarehouseStaff={isWarehouseStaff}
                    //     setIsWarehouseStaff={setIsWarehouseStaff}
                    //   />
                    // ) : view === 'calendar' ? (
                    //   <MeasurementCalendarView measurements={dataFiltered} isOnlyWeek={false} />
                    // ) : (
                    //   <KanbanMeasurementView measurements={dataFiltered} refetchMeasurements={refetchMeasurements} />
                  )}
                </>
              )}
            </DashboardContent>

            <ConfirmDialog
              open={confirm.value}
              onClose={confirm.onFalse}
              title="Delete"
              content={
                <>
                  Are you sure want to delete <strong> {table.selected.length} </strong> measurement(s)?
                </>
              }
              action={
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    handleDeleteItems();
                    confirm.onFalse();
                  }}
                >
                  Delete
                </Button>
              }
            />
          </>
        )}
    </>
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
      (file) => file.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file.number.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file.salesOrder.salesorder_id.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file.salesOrder.salesorder_number.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file.salesOrder.customer_id.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file.salesOrder.customer_name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file.address.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        JSON.stringify(file.userManager).toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        JSON.stringify(file.usersAssignees).toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        JSON.stringify(file.currentStage).toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }


  return inputData;
}
