import axios from 'axios';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { isInstaller } from 'src/utils/check-permissions';
import { fIsAfter, fIsBetween } from 'src/utils/format-time';

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

import { ProjectTable } from '../project-table';
import { ProjectFilters } from '../project-filters';
import { ProjectGridView } from '../project-grid-view';
import { ProjectCalendarView } from '../calendar/view';
import { KanbanProjectView } from '../kanban-project/view';
import { ProjectFiltersResult } from '../project-filters-result';
import { ProjectNewFolderDialog } from '../project-new-folder-dialog';
import { ProjectEditModalManageStaffView } from './project-edit-modal-manage-staff-view';



// ----------------------------------------------------------------------

export function ProjectView() {

  const { isMobile } = useContext(LoadingContext);

  localStorage.setItem('backFromProjectDetails', 'projects');

  const {
    loadedProjects,
    refetchProjects,
    loadedUsers,
    loadedProjectPermissions,
    loadedStages,
    loadedStagesTask,
    listPermissions,
    refetchSalesOrders,
  } = useDataContext();

  const table = useTable({ defaultRowsPerPage: 10, defaultDense: true, defaultOrder: 'asc', defaultOrderBy: 'startDate' });

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const finalStages = useMemo(() => {
    if (loadedStages) {
      return loadedStages.filter((stage) => stage.name.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1);
    }
    return [];
  }, [loadedStages]);

  const router = useRouter();

  const openDateRange = useBoolean();

  const confirm = useBoolean();

  const confirmStaff = useBoolean();

  const [isWarehouseStaff, setIsWarehouseStaff] = useState(false);

  const upload = useBoolean();

  // const [view, setView] = useState(
  //   isInstaller(userLogged?.data?.user_role?.name) ? 'grid' : localStorage.getItem('projectView') || 'list'
  // );

  const [view, setView] = useState(localStorage.getItem('projectView') || 'list');

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (refetchProjects) {
      refetchProjects();
    }
    setTableData(loadedProjects || []);
  }, [refetchProjects, loadedProjects]);

  useEffect(() => {
    if (loadedProjects) {
      setTableData(loadedProjects);
    }
  }, [loadedProjects]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/projects/`);
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

  const filters = useSetState({
    name: '',
    type: [],
    startDate: null,
    endDate: null,
    custom: {
      hasPermission: false,
      isPreparation: {
        name: 'preparation',
        value: false,
      },
      isCoordination: {
        name: 'coordination',
        value: false,
      },
      isInstallation: {
        name: 'installation',
        value: false,
      },
      isPermission: {
        name: 'permission',
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
    filters.state.custom.hasPermission ||
    filters.state.custom.isPreparation?.value ||
    filters.state.custom.isCoordination?.value ||
    filters.state.custom.isInstallation?.value ||
    filters.state.custom.isPermission?.value ||
    filters.state.custom.isClosing?.value ||
    filters.state.custom.hasComments;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleChangeView = useCallback((event, newView) => {
    if (newView !== null) {
      localStorage.setItem('projectView', newView);
      setView(newView);
    }
  }, []);

  const handleDeleteItem = useCallback(
    async (id) => {

      const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${id}/`, {
        data: {
          userReporter: userLogged?.data,
        }
      });

      const response = await promise;

      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);

      refetchProjects?.();

      refetchSalesOrders?.();

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData, refetchSalesOrders, refetchProjects, userLogged]
  );

  const handleDeleteItems = useCallback(
    async () => {
      const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

      const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/projects/`, {
        data: {
          ids: table.selected,
          userReporter: userLogged?.data,
        },
      });

      const response = await promise;

      toast.success('Delete success!');

      setTableData(deleteRows);

      refetchProjects?.();

      refetchSalesOrders?.();

      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    }, [dataFiltered.length, dataInPage.length, table, tableData, refetchSalesOrders, refetchProjects, userLogged]);


  const handleViewKanban = useCallback(
    (id) => {
      localStorage.setItem('projectId', id);
      router.push(paths.dashboard.project.kanbanProjectId(id));
    },
    [router]
  );

  const handleDetailsView = useCallback(
    (id) => {
      localStorage.setItem('projectId', id);
      localStorage.setItem('backFromProjectDetails', 'projects');
      router.push(paths.dashboard.project.details(id));
    },
    [router]
  );

  const renderFilters = (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      sx={{ width: 1, mb: 0 }}
    >
      <ProjectFilters
        filters={filters}
        dateError={dateError}
        onResetPage={table.onResetPage}
        openDateRange={openDateRange.value}
        onOpenDateRange={openDateRange.onTrue}
        onCloseDateRange={openDateRange.onFalse}
        options={{ types: PROJECT_TYPE_OPTIONS }}
      />



      <ToggleButtonGroup size="small" value={view} exclusive onChange={handleChangeView}>
        <ToggleButton value="list">
          <Iconify icon="solar:list-bold" />
        </ToggleButton>

        <ToggleButton value="grid">
          <Iconify icon="mingcute:dot-grid-fill" />
        </ToggleButton>

        <ToggleButton value="calendar">
          <Iconify icon="ion:calendar-outline" />
        </ToggleButton>

        {!isInstaller(userLogged?.data?.user_role?.name) && (
          <ToggleButton value="kanban">
            <Iconify icon="tabler:layout-kanban" />
          </ToggleButton>
        )}

      </ToggleButtonGroup>

    </Stack>
  );

  const renderResults = (
    <ProjectFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      onResetPage={table.onResetPage}
    />
  );

  return (
    <>
      <DashboardContent>
        {/* <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Project Manager</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="fluent-mdl2:activate-orders" />}
            onClick={handleSalesOrders}
          >
            Go to Sales Orders
          </Button>
        </Stack> */}
        {/* <Divider sx={{ borderStyle: 'dashed', mb: 1 }} /> */}

        <Stack spacing={2.5} sx={{ my: { xs: 3, md: 3 } }}>
          {renderFilters}

          {canReset && renderResults}
        </Stack>

        {notFound ? (
          <EmptyContent filled sx={{ py: 10 }} />
        ) : (
          <>
            {view === 'list' ? (
              <ProjectTable
                table={table}
                dataFiltered={dataFiltered}
                onDeleteRow={handleDeleteItem}
                onKanbanView={handleViewKanban}
                onViewRow={handleDetailsView}
                notFound={notFound}
                onOpenConfirm={confirm.onTrue}
                loadedUsers={loadedUsers}
                loadedProjectPermissions={loadedProjectPermissions}
                loadedStages={finalStages}
                loadedStagesTask={loadedStagesTask}
                listPermissions={listPermissions}
                setTableData={setTableData}
                refetchProjects={refetchProjects}
                loadedProjects={loadedProjects}
                onOpenConfirmStaff={confirmStaff.onTrue}
                isWarehouseStaff={isWarehouseStaff}
                setIsWarehouseStaff={setIsWarehouseStaff}
              />
            ) : view === 'grid' ? (
              <ProjectGridView
                table={table}
                dataFiltered={dataFiltered}
                onDeleteItem={handleDeleteItem}
                onKanbanView={handleViewKanban}
                onViewRow={handleDetailsView}
                onOpenConfirm={confirm.onTrue}
                loadedUsers={loadedUsers}
                loadedProjectPermissions={loadedProjectPermissions}
                loadedStages={finalStages}
                loadedStagesTask={loadedStagesTask}
                listPermissions={listPermissions}
                setTableData={setTableData}
                refetchProjects={refetchProjects}
                onOpenConfirmStaff={confirmStaff.onTrue}
                isWarehouseStaff={isWarehouseStaff}
                setIsWarehouseStaff={setIsWarehouseStaff}
              />
            ) : view === 'calendar' ? (
              <ProjectCalendarView projects={dataFiltered} isOnlyWeek={false} />
            ) : (
              <KanbanProjectView projects={dataFiltered} refetchProjects={refetchProjects} />
            )}
          </>
        )}
      </DashboardContent>

      <ProjectNewFolderDialog open={upload.value} onClose={upload.onFalse} />


      <ProjectEditModalManageStaffView
        isWarehouseStaff={isWarehouseStaff}
        open={confirmStaff.value}
        onClose={confirmStaff.onFalse}
        loadedUsers={loadedUsers}
        loadedProjectPermissions={loadedProjectPermissions}
        tableSelected={table.selected}
        table={table}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> installation project(s)?
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
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, type, startDate, endDate, custom } = filters;

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
          return normalizedStageFilters.includes(file.currentStage.name.toLowerCase());
        }
        return false;
      });
    }
  }

  if (custom.hasPermission) {
    inputData = inputData.filter(file => file.hasPermission);
  }

  if (custom.hasComments) {
    inputData = inputData.filter(file => file.projectComments.length > 0);
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((file) => fIsBetween(file.startDate, startDate, endDate));
    }
  }



  if (custom.isPreparation.value || custom.isCoordination.value || custom.isInstallation.value || custom.isPermission.value || custom.isClosing.value) {
    inputData = inputData.filter(file => {
      const { currentStage } = file;
      if (currentStage && currentStage.name) {
        if (custom.isPreparation.value && currentStage.name.toLowerCase().indexOf(custom.isPreparation.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isCoordination.value && currentStage.name.toLowerCase().indexOf(custom.isCoordination.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isInstallation.value && currentStage.name.toLowerCase().indexOf(custom.isInstallation.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isPermission.value && currentStage.name.toLowerCase().indexOf(custom.isPermission.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isClosing.value && currentStage.name.toLowerCase().indexOf(custom.isClosing.name.toLowerCase()) !== -1) {
          return true;
        }
      }
      return false;
    });
  }


  return inputData;
}
