import axios from 'axios';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import { Box, Typography, LinearProgress } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { isInstaller } from 'src/utils/check-permissions';
import { fIsAfter, fIsBetween } from 'src/utils/format-time';
import { getProjectAttachments, getProjectInstaller } from 'src/utils/project-tasks-utils';

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

import { ProjectAttachmentsTable } from './project-attachments-table';
import { ProjectAttachmentsFilters } from './project-attachments-filters';
import { ProjectAttachmentsFiltersResult } from './project-attachments-filters-result';
import { ProjectAttachmentsModalView } from './project-attachments-modal-view';

// ----------------------------------------------------------------------

export function ProjectAttachmentsView() {

  const { isMobile } = useContext(LoadingContext);

  localStorage.setItem('backFromProjectDetails', 'projects');

  const lengthAttachments = useCallback((row) => {
    const files = getProjectAttachments(row);
    if (files?.project?.length === 0 && files?.tasks?.length === 0)
      return 0;
    const pLength = files?.project?.length || 0;
    const tLength = files?.tasks?.length || 0;
    return pLength + tLength;
  }, []);

  const {
    loadedProjects,
    refetchProjects,
    loadingProjects,
    loadedUsers,
    loadedProjectPermissions,
    loadedStages,
    loadedStagesTask,
    listPermissions,
    refetchSalesOrders,
  } = useDataContext();

  const table = useTable({
    defaultCurrentPage: parseInt(localStorage.getItem('projectPage'), 10) || 0,
    defaultRowsPerPage: parseInt(localStorage.getItem('projectRowsPerPage'), 10) || 10,
    defaultDense: true,
    defaultOrder: 'asc',
    defaultOrderBy: 'startDate'
  });

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const finalStages = useMemo(() => {
    if (loadedStages) {
      return loadedStages.filter(
        (stage) => 
          stage.name.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1 &&
          stage.otherName !== null &&
          stage.otherName !== ''
      );
    }
    return [];
  }, [loadedStages]);

  const router = useRouter();

  const openDateRange = useBoolean();

  const openInstallerFilter = useBoolean();

  const confirm = useBoolean();

  const confirmStaff = useBoolean();

  const confirmAllDescriptions = useBoolean();

  const openModalAttachments = useBoolean();

  const [selectedAttachmentStage, setSelectedAttachmentStage] = useState(null);

  const [selectedRow, setSelectedRow] = useState(null);

  const [isWarehouseStaff, setIsWarehouseStaff] = useState(false);

  const [view, setView] = useState(localStorage.getItem('projectView') || 'list');

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (refetchProjects) {
      refetchProjects()
        .then((response) => {
          setTableData(response.data.allProjects);
        })
        .catch((error) => {
          console.error('Error fetching projects:', error);
        });
    }
  }, [refetchProjects]);

  const filters = useSetState({
    list: localStorage.getItem('projectFilterList') || 'in progress',
    name: localStorage.getItem('projectFilterName') || '',
    type: JSON.parse(localStorage.getItem('projectFilterType')) || [],
    startDate: localStorage.getItem('projectFilterStartDate') || null,
    endDate: localStorage.getItem('projectFilterEndDate') || null,
    installer: JSON.parse(localStorage.getItem('projectFilterInstaller')) || {
      id: null,
      name: null,
    },
    custom: JSON.parse(localStorage.getItem('projectFilterCustom')) || {
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

  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData?.filter((row) => lengthAttachments(row) > 0),
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError,
  }), [tableData, filters.state, dateError, lengthAttachments, table.order, table.orderBy]);

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
    filters.state.custom.hasComments ||
    (!!filters.state.installer.id && !!filters.state.installer.name)

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleChangeView = useCallback((event, newView) => {
    if (newView !== null) {
      localStorage.setItem('projectView', newView);
      localStorage.removeItem('projectReminderTab');
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
      const listData = dataFiltered.map((item) => ({
        id: item.id,
        name: item.name,
        number: item.number,
        startDate: item.startDate,
      }));
      localStorage.setItem('installationFilteredList', JSON.stringify(listData));
      router.push(paths.dashboard.project.kanbanProjectId(id));
    },
    [router, dataFiltered]
  );

  const handleDetailsView = useCallback(
    (id) => {
      localStorage.setItem('projectId', id);
      localStorage.setItem('backFromProjectDetails', 'projects');
      const listData = dataFiltered.map((item) => ({
        id: item.id,
        name: item.name,
        number: item.number,
        startDate: item.startDate,
      }));
      localStorage.setItem('installationFilteredList', JSON.stringify(listData));
      router.push(paths.dashboard.project.details(id));
    },
    [router, dataFiltered]
  );

  const handleOpenModalAttachments = useCallback(
    (row) => {
      setSelectedRow(row);
      openModalAttachments.onTrue();
    },
    [openModalAttachments]
  );

  const attachments = useMemo(() => {
    if (selectedRow) {
      const files = getProjectAttachments(selectedRow, selectedAttachmentStage);
      return files?.project?.concat(files?.tasks);
    }
    return [];
  }, [selectedRow, selectedAttachmentStage]);

  const renderFilters = (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      sx={{ width: 1, mb: 0 }}
    >
      <ProjectAttachmentsFilters
        filters={filters}
        loadedUsers={loadedUsers}
        dateError={dateError}
        onResetPage={table.onResetPage}
        openDateRange={openDateRange.value}
        onOpenDateRange={openDateRange.onTrue}
        onCloseDateRange={openDateRange.onFalse}
        openInstallerFilter={openInstallerFilter.value}
        onOpenInstallerFilter={openInstallerFilter.onTrue}
        onCloseInstallerFilter={openInstallerFilter.onFalse}
        options={{ types: PROJECT_TYPE_OPTIONS }}
      />

      <ToggleButtonGroup size="small" value={view} exclusive onChange={handleChangeView}>
        <ToggleButton value="list">
          <Iconify icon="solar:list-bold" />
        </ToggleButton>

      </ToggleButtonGroup>

    </Stack>
  );

  const renderResults = (
    <ProjectAttachmentsFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      onResetPage={table.onResetPage}
    />
  );

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading installations files data...');

  return (
    <>
      {
        (tableData?.length === 0) ? (
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
                    <ProjectAttachmentsTable
                      table={table}
                      dataFiltered={dataFiltered}
                      onDeleteRow={handleDeleteItem}
                      onKanbanView={handleViewKanban}
                      onViewRow={handleDetailsView}
                      onViewAttachmentsRow={handleOpenModalAttachments}
                      setSelectedAttachmentStage={setSelectedAttachmentStage}
                      notFound={notFound}
                      onOpenConfirm={confirm.onTrue}
                      onOpenConfirmAllDescriptions={confirmAllDescriptions.onTrue}
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
                      canReset={canReset}
                    />
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

            <ProjectAttachmentsModalView
              project={selectedRow}
              attachments={attachments}
              stageName={selectedAttachmentStage}
              loadedStages={finalStages}
              open={openModalAttachments.value}
              onClose={openModalAttachments.onFalse}
            />

          </>
        )}
    </>
  );
}

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { list, name, type, startDate, endDate, installer, custom } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (list) {
    if (list === 'in progress') {
      inputData = inputData.filter((file) => file.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1);
    }
    else if (list === 'finished') {
      inputData = inputData.filter((file) => file.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) !== -1);
    }
  }

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
          return normalizedStageFilters.includes(file.currentStage?.name?.toLowerCase());
        }
        return false;
      });
    }
  }

  if (installer.id) {
    inputData = inputData.filter((file) => {
      const installerId = getProjectInstaller(file, CONFIG)?.id;
      if (installerId) {
        return String(installerId) === String(installer.id);
      }
      return false;
    });
  }

  if (custom.hasPermission) {
    inputData = inputData.filter(file => file.hasPermission);
  }

  if (custom.hasComments) {
    inputData = inputData.filter(file => file?.projectComments?.length > 0);
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
        if (custom.isPreparation.value && currentStage?.name?.toLowerCase().indexOf(custom.isPreparation.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isCoordination.value && currentStage?.name?.toLowerCase().indexOf(custom.isCoordination.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isInstallation.value && currentStage?.name?.toLowerCase().indexOf(custom.isInstallation.name.toLowerCase()) !== -1) {
          return true;
        }
        if (custom.isPermission.value && currentStage?.name?.toLowerCase().indexOf(custom.isPermission.name.toLowerCase()) !== -1) {
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
