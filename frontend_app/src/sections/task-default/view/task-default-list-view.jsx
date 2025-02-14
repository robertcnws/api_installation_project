import { useState, useCallback, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import { LinearProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';
import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';

import {
  useTable,
  rowInPage,
  TableNoData,
  getComparator,
  TableHeadCustom,
  TableSelectedAction,
} from 'src/components/table';
import { RouterLink } from 'src/routes/components';

import { TaskDefaultTableRow } from '../task-default-table-row';
import { TaskDefaultTableToolbar } from '../task-default-table-toolbar';
import { TaskDefaultTableFiltersResult } from '../task-default-table-filters-result';




// ----------------------------------------------------------------------

const headersCSV = [
  { label: 'Name', key: 'name' },
  { label: 'Description', key: 'description' },
]

const getValidTabValue = (options, currentValue) => options.some(
  (tab) => tab.value === currentValue
) ? currentValue : false;

// ----------------------------------------------------------------------

export function TaskDefaultListView() {

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    loadedStages,
    loadedDefaultTasks,
    loadingDefaultTasks,
    errorDefaultTasks,
    refetchDefaultTasks
  } = useDataContext();

  const STATUS_OPTIONS = [{ value: 'all', label: 'All Tasks' }].concat(
    loadedStages?.map((stage) => ({
      value: stage.name,
      label: `${stage.name} Tasks`,
    }))
  );

  const [updating, setUpdating] = useState(false);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading data...');

  const TABLE_HEAD = [
    { id: 'name', label: 'Name' },
    { id: 'order', label: 'Order' },
    { id: 'projectStage', label: 'Installation Stage' },
    { id: 'projectStageStatus', label: 'Linked Status' },
    { id: '' },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'info', label: 'INFO' },
    { id: '' },
  ];

  const table = useTable({ defaultDense: true });

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);

  const filters = useSetState({ name: '', stage: localStorage.getItem('defaultTasksStage') || 'all' });

  const collapse = useBoolean(
    loadedStages?.some((stage) => stage.name === filters.state.stage)
  );

  const statusValue = getValidTabValue(STATUS_OPTIONS, filters.state.stage);


  useEffect(() => {
    localStorage.removeItem('routeByAnalytics');
    localStorage.removeItem('routeByOrder');
    localStorage.removeItem('routeByShipment');
    localStorage.removeItem('routeByShipmentBySku');
    localStorage.removeItem('currentDefaultTaskId');
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
    if (refetchDefaultTasks) {
      refetchDefaultTasks();
    }
    setTableData(loadedDefaultTasks || []);
  }, [refetchDefaultTasks, loadedDefaultTasks]);

  useEffect(() => {
    if (loadedDefaultTasks) {
      setTableData(loadedDefaultTasks);
    }
  }, [loadedDefaultTasks]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/project-default-tasks/`);
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onclose = (e) => {
      console.log('WebSocket closed', e);
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


  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = filters.state.stage !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axios.delete(`${CONFIG.apiUrl}/projects/delete/default-task/${id}/`, {
          data: {
            userReporter: userLogged?.data,
          }
        });
        const updatedRows = tableData.filter((row) => row.id !== id);
        setTableData(updatedRows);
        table.onUpdatePageDeleteRow(dataInPage.length);
        toast.success('Delete success!');
        refetchDefaultTasks?.();
      } catch (error) {
        console.error(error);
        toast.error('Error deleting default task');
      }
    },
    [dataInPage.length, table, tableData, userLogged?.data, refetchDefaultTasks]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await axios.delete(`${CONFIG.apiUrl}/projects/delete/default-tasks/`, {
        data: {
          ids: table.selected,
          userReporter: userLogged?.data,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      const updatedRows = tableData.filter((row) => !table.selected.includes(row.id));
      setTableData(updatedRows);
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
      toast.success('Delete success!');
      refetchDefaultTasks?.();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting default tasks');
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData, userLogged?.data, refetchDefaultTasks]);

  const handleEditRow = useCallback(
    (id) => {
      localStorage.setItem('currentDefaultTaskId', id);
      router.push(paths.dashboard.task.edit(id));
    },
    [router]
  );

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.task.list);
    },
    [router]
  );

  const handleFilterStage = useCallback(
    (event, newValue) => {
      table.onResetPage();
      localStorage.setItem('defaultTasksStage', newValue);
      filters.setState({ stage: newValue });
      if (loadedStages.some((stage) => stage.name === newValue)) {
        collapse.onTrue();
      }
      else {
        collapse.onFalse();
      }
    },
    [filters, table, collapse, loadedStages]
  );

  const handleViewRow = useCallback(
    (id) => {
      localStorage.removeItem('routeByAnalytics');
      localStorage.removeItem('routeByOrder');
      localStorage.removeItem('routeByShipment');
      localStorage.removeItem('routeByShipmentBySku');
      localStorage.setItem('stageStatus', filters.state.status);
      router.push(paths.dashboard.stage.details(id));
    },
    [router, filters]
  );

  if (loadingDefaultTasks) {
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

  if (errorDefaultTasks) {
    return (
      <DashboardContent>
        <Box display="flex" alignItems="center" mb={5}>
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            <Typography>Error fetching items: {errorDefaultTasks.message}</Typography>
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
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          // heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.general.analytics },
            { name: 'Task', href: paths.dashboard.task.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.task.new}
              // color="inherit"
              // variant="outlined"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Task
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Tabs
              value={statusValue}
              onChange={handleFilterStage}
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
                        ((tab.value === 'all' || tab.value === filters.state.stage) && 'filled') ||
                        'soft'
                      }
                      color={
                        (tab.value !== 'all' && 'success') ||
                        'default'
                      }
                    >
                      {
                        tab.value !== 'all' ?
                          tableData.filter((it) => it.projectStage.name === tab.value).length :
                          tableData.length
                      }
                    </Label>
                  }
                />
              ))}
            </Tabs>
            <Box sx={{ display: 'flex', alignItems: 'right' }}>
              <IconButton
                color={collapse.value ? 'inherit' : 'default'}
                onClick={collapse.onToggle}
                sx={{ ...(collapse.value && { bgcolor: 'action.hover' }) }}
              >
                <Iconify icon={collapse.value ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
              </IconButton>
            </Box>
          </Box>

          <TaskDefaultTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ values: STATUS_OPTIONS.map((option) => option.label) }}
            dataFiltered={dataFiltered}
            headersCSV={headersCSV}
            setUpdating={setUpdating}
            setTitleLinearProgress={setTitleLinearProgress}
            title={filters.state.stage === 'all' ? 'All Tasks' : `${filters.state.stage} Tasks`}
          />

          {canReset && (
            <TaskDefaultTableFiltersResult
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
                  dataFiltered.map((row) => row.id)
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
              {tableData && tableData.length > 0 ? (
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
                          dataFiltered.map((row) => row.id)
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
                          <TaskDefaultTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                            onEditRow={() => handleEditRow(row.id)}
                            onReturnList={() => handleReturnList()}
                            onViewRow={() => handleViewRow(row.id)}
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

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> tasks?
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
  const { name, stage } = filters;

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
        item.description.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item.projectStageStatus.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (stage !== 'all') {
    inputData = inputData.filter((item) => item.projectStage.name === stage);
  }
  return inputData;
}
