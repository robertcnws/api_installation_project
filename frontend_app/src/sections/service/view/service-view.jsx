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

import { fIsAfter, fIsBetween } from 'src/utils/format-time';
import { isAdministrator, isServiceStaff, listRolesAndSubroles } from 'src/utils/check-permissions';
import { getServiceInstaller } from 'src/utils/service-tasks-utils';

import { CONFIG } from 'src/config-global';
import { PROJECT_TYPE_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, rowInPage, getComparator } from 'src/components/table';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { ServiceTable } from '../service-table';
import { ServiceFilters } from '../service-filters';
// import { ServiceGridView } from '../service-grid-view';
// import { ServiceCalendarView } from '../calendar/view';
// import { KanbanServiceView } from '../kanban-service/view';
import { ServiceFiltersResult } from '../service-filters-result';


// import { ServiceNewFolderDialog } from '../service-new-folder-dialog';

// ----------------------------------------------------------------------

export function ServiceView() {

  const { isMobile } = useContext(LoadingContext);

  localStorage.setItem('backFromServiceDetails', 'services');

  const {
    loadedServices,
    refetchServices,
    loadingServices,
    loadedUsers,
    loadedSuperadminUsers,
    loadedServiceStages,
    // loadedServiceStagesTask,
    // listPermissions,
    // refetchSalesOrders,
  } = useDataContext();

  const table = useTable({ 
    defaultCurrentPage: parseInt(localStorage.getItem('servicePage'), 10) || 0,
    defaultRowsPerPage: parseInt(localStorage.getItem('serviceRowsPerPage'), 10) || 10,
    defaultDense: true, 
    defaultOrder: 'asc', 
    defaultOrderBy: 'startDate' 
  });

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const finalStages = useMemo(() => {
    if (loadedServiceStages) {
      return loadedServiceStages.filter((stage) => stage.name.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1);
    }
    return [];
  }, [loadedServiceStages]);

  const router = useRouter();

  const openDateRange = useBoolean();

  const openInstallerFilter = useBoolean();

  const openUserManagerFilter = useBoolean();

  const openCreatedByFilter = useBoolean();

  const confirm = useBoolean();

  const confirmStaff = useBoolean();

  const [isWarehouseStaff, setIsWarehouseStaff] = useState(false);

  const upload = useBoolean();

  const [view, setView] = useState(localStorage.getItem('serviceView') || 'list');

  const [tableData, setTableData] = useState([]);

  const allCreatorsUsers = useMemo(() => [
    ...loadedUsers.filter(
      user => isServiceStaff(user.userRole.name) || isAdministrator(user.userRole.name)
    ),
    ...loadedSuperadminUsers,
  ], [loadedUsers, loadedSuperadminUsers]);

  useEffect(() => {
    if (refetchServices) {
      refetchServices();
    }
    setTableData(loadedServices || []);
  }, [refetchServices, loadedServices]);

  useEffect(() => {
    if (loadedServices) {
      setTableData(loadedServices);
    }
  }, [loadedServices]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/services/ws/services/`);
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
    list: localStorage.getItem('serviceFilterList') || 'in progress',
    name: localStorage.getItem('serviceFilterName') || '',
    type: JSON.parse(localStorage.getItem('serviceFilterType')) || [],
    startDate: localStorage.getItem('serviceFilterStartDate') || null,
    endDate: localStorage.getItem('serviceFilterEndDate') || null,
    byFactory: localStorage.getItem('serviceFilterByFactory') === 'true' || false,
    notByFactory: localStorage.getItem('serviceFilterNotByFactory') === 'true' || false,
    installer: JSON.parse(localStorage.getItem('serviceFilterInstaller')) || {
      id: null,
      name: null,
    },
    userManager: JSON.parse(localStorage.getItem('serviceFilterUserManager')) || {
      id: null,
      name: null,
    },
    createdBy: JSON.parse(localStorage.getItem('serviceFilterCreatedBy')) || {
      id: null,
      name: null,
    },
    custom: JSON.parse(localStorage.getItem('serviceFilterCustom')) || {
      hasPermission: false,
      isPreparation: {
        name: 'preparation',
        value: false,
      },
      isRepair: {
        name: 'repair',
        value: false,
      },
      isClosing: {
        name: 'closing',
        value: false,
      },
      hasComments: false,
    }
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
    !!filters.state.name ||
    filters.state.type.length > 0 ||
    (!!filters.state.startDate && !!filters.state.endDate) ||
    (!!filters.state.installer.id && !!filters.state.installer.name) ||
    (!!filters.state.userManager.id && !!filters.state.userManager.name) ||
    (!!filters.state.createdBy.id && !!filters.state.createdBy.name) ||
    filters.state.custom.hasPermission ||
    filters.state.custom.isPreparation?.value ||
    filters.state.custom.isRepair?.value ||
    // filters.state.custom.isInstallation?.value ||
    // filters.state.custom.isPermission?.value ||
    filters.state.custom.isClosing?.value ||
    filters.state.custom.hasComments ||
    filters.state.byFactory ||
    filters.state.notByFactory;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleChangeView = useCallback((event, newView) => {
    if (newView !== null) {
      localStorage.setItem('serviceView', newView);
      setView(newView);
    }
  }, []);

  const handleDeleteItem = useCallback(
    async (id) => {

      const promise = axios.delete(`${CONFIG.apiUrl}/services/delete/service/${id}/`, {
        data: {
          userReporter: userLogged?.data,
        }
      });

      const response = await promise;

      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);

      refetchServices?.();

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData, refetchServices, userLogged]
  );

  const handleDeleteItems = useCallback(
    async () => {
      const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

      const promise = axios.delete(`${CONFIG.apiUrl}/services/delete/services/`, {
        data: {
          ids: table.selected,
          userReporter: userLogged?.data,
        },
      });

      const response = await promise;

      toast.success('Delete success!');

      setTableData(deleteRows);

      refetchServices?.();

      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    }, [dataFiltered.length, dataInPage.length, table, tableData, refetchServices, userLogged]);


  const handleCloseItem = useCallback(
    async (id, isClosed) => {
      const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${id}/close-service/`, {
        userReporter: JSON.stringify(userLogged?.data),
        isClosed,
      });

      await promise;

      toast.success('Closing success!');

      refetchServices?.();

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, refetchServices, userLogged]
  );


  const handleViewKanban = useCallback(
    (id) => {
      localStorage.setItem('serviceId', id);
      const listData = dataFiltered.map((item) => ({
        id: item.id,
        name: item.name,
        number: item.number,
        version: item.version,
        startDate: item.startDate,
      }));
      localStorage.setItem('serviceFilteredList', JSON.stringify(listData));
      router.push(paths.dashboard.service.kanbanServiceId(id));
    },
    [router, dataFiltered]
  );

  const handleDetailsView = useCallback(
    (id) => {
      localStorage.setItem('serviceId', id);
      localStorage.setItem('backFromServiceDetails', 'services');
      const listData = dataFiltered.map((item) => ({
        id: item.id,
        name: item.name,
        number: item.number,
        version: item.version,
        startDate: item.startDate,
      }));
      localStorage.setItem('serviceFilteredList', JSON.stringify(listData));
      router.push(paths.dashboard.service.details(id));
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
      <ServiceFilters
        filters={filters}
        loadedUsers={loadedUsers}
        allCreatorsUsers={allCreatorsUsers}
        dateError={dateError}
        onResetPage={table.onResetPage}
        openDateRange={openDateRange.value}
        onOpenDateRange={openDateRange.onTrue}
        onCloseDateRange={openDateRange.onFalse}
        openInstallerFilter={openInstallerFilter.value}
        onOpenInstallerFilter={openInstallerFilter.onTrue}
        onCloseInstallerFilter={openInstallerFilter.onFalse}
        openUserManagerFilter={openUserManagerFilter.value}
        onOpenUserManagerFilter={openUserManagerFilter.onTrue}
        onCloseUserManagerFilter={openUserManagerFilter.onFalse}
        openCreatedByFilter={openCreatedByFilter.value}
        onOpenCreatedByFilter={openCreatedByFilter.onTrue}
        onCloseCreatedByFilter={openCreatedByFilter.onFalse}
        options={{ types: PROJECT_TYPE_OPTIONS }}
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
          href={paths.dashboard.service.new}
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
    <ServiceFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      onResetPage={table.onResetPage}
    />
  );

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading services data...');

  return (
    <>
      {
        (loadingServices) ? (
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
                    <ServiceTable
                      table={table}
                      dataFiltered={dataFiltered}
                      onDeleteRow={handleDeleteItem}
                      onCloseRow={handleCloseItem}
                      // onKanbanView={handleViewKanban}
                      onViewRow={handleDetailsView}
                      notFound={notFound}
                      onOpenConfirm={confirm.onTrue}
                      loadedUsers={loadedUsers}
                      // loadedServicePermissions={loadedServicePermissions}
                      loadedServiceStages={finalStages}
                      // loadedServiceStagesTask={loadedServiceStagesTask}
                      // listPermissions={listPermissions}
                      setTableData={setTableData}
                      refetchServices={refetchServices}
                      loadedServices={loadedServices}
                    // onOpenConfirmStaff={confirmStaff.onTrue}
                    // isWarehouseStaff={isWarehouseStaff}
                    // setIsWarehouseStaff={setIsWarehouseStaff}
                    />
                    // ) : view === 'grid' ? (
                    //   <ServiceGridView
                    //     table={table}
                    //     dataFiltered={dataFiltered}
                    //     onDeleteItem={handleDeleteItem}
                    //     onKanbanView={handleViewKanban}
                    //     onViewRow={handleDetailsView}
                    //     onOpenConfirm={confirm.onTrue}
                    //     loadedUsers={loadedUsers}
                    //     loadedServicePermissions={loadedServicePermissions}
                    //     loadedServiceStages={finalStages}
                    //     loadedServiceStagesTask={loadedServiceStagesTask}
                    //     listPermissions={listPermissions}
                    //     setTableData={setTableData}
                    //     refetchServices={refetchServices}
                    //     onOpenConfirmStaff={confirmStaff.onTrue}
                    //     isWarehouseStaff={isWarehouseStaff}
                    //     setIsWarehouseStaff={setIsWarehouseStaff}
                    //   />
                    // ) : view === 'calendar' ? (
                    //   <ServiceCalendarView services={dataFiltered} isOnlyWeek={false} />
                    // ) : (
                    //   <KanbanServiceView services={dataFiltered} refetchServices={refetchServices} />
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
                  Are you sure want to delete <strong> {table.selected.length} </strong> service(s)?
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

function applyFilter({ inputData, comparator, filters, dateError }) {

  const { 
    list, 
    name, 
    type, 
    startDate, 
    endDate, 
    byFactory, 
    notByFactory, 
    installer, 
    userManager, 
    createdBy, 
    custom 
  } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (list) {
    if (list === 'in progress') {
      inputData = inputData.filter(
        (file) => file.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1 && !file.isClosed
      );
    }
    else if (list === 'finished') {
      inputData = inputData.filter(
        (file) => file.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) !== -1 && !file.isClosed
      );
    }
    else if (list === 'closed') {
      inputData = inputData.filter(
        (file) => file.isClosed
      );
    }
  }

  if (name) {
    inputData = inputData?.filter(
      (file) => file?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file?.number?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file?.salesOrder?.salesorder_id?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file?.salesOrder?.salesorder_number?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file?.salesOrder?.customer_id?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file?.salesOrder?.customer_name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        file?.address?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        JSON.stringify(file?.userManager)?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        JSON.stringify(file?.usersAssignees)?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        JSON.stringify(file?.currentStage)?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (type && type.length > 0) {
    const statusFilters = type.filter(t => t === 'active' || t === 'inactive');
    const stageFilters = type.filter(t => t !== 'active' && t !== 'inactive');

    if (statusFilters.length === 1) {
      if (statusFilters[0] === 'active') {
        inputData = inputData.filter(file => file.isActive);
      } else if (statusFilters[0] === 'inactive') {
        inputData = inputData.filter(file => !file.isActive);
      }
    }

    if (stageFilters.length > 0) {
      const normalizedStageFilters = stageFilters.map(stage => stage.toLowerCase());
      inputData = inputData.filter(file => {
        if (file.currentStage && file.currentStage.name) {
          return normalizedStageFilters.includes(file.currentStage?.name?.toLowerCase());
        }
        return false;
      });
    }
  }

  if (byFactory && !notByFactory) {
    inputData = inputData.filter(file => file.byFactory);
  }

  if (notByFactory && !byFactory) {
    inputData = inputData.filter(file => !file.byFactory);
  }

  if (installer.id) {
    inputData = inputData.filter((file) => {
      const installerId = getServiceInstaller(file, CONFIG)?.id;
      if (installerId) {
        return String(installerId) === String(installer.id);
      }
      return false;
    });
  }

  if (userManager.id) {
    inputData = inputData.filter((file) => {
      const userManagerId = file?.userManager?.id;
      if (userManagerId) {
        return String(userManagerId) === String(userManager.id);
      }
      return false;
    });
  }

  if (createdBy.id) {
    inputData = inputData.filter((file) => {
      const createdById = file?.createdBy?.id;
      if (createdById) {
        return String(createdById) === String(createdBy.id);
      }
      return false;
    });
  }

  if (custom.hasComments) {
    inputData = inputData.filter(file => file.serviceComments.length > 0);
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((file) => fIsBetween(file.startDate, startDate, endDate));
    }
  }

  if (custom.isPreparation.value || custom.isRepair.value || custom.isClosing.value) {
    inputData = inputData.filter(file => {
      const { currentStage } = file;
      if (currentStage && currentStage.name) {
        if (custom.isPreparation.value && currentStage?.name?.toLowerCase().indexOf(custom.isPreparation.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isRepair.value && currentStage?.name?.toLowerCase().indexOf(custom.isRepair.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isClosing.value && currentStage?.name?.toLowerCase().indexOf(custom.isClosing.name.toLowerCase()) !== -1) {
          return true;
        }
      }
      return false;
    });
  }


  return inputData;
}
