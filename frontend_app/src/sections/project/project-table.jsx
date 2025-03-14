import { useMemo, useContext } from 'react';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import { tableCellClasses } from '@mui/material/TableCell';

import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import {
  TableNoData,
  TableHeadCustom,
  TableSelectedAction,
} from 'src/components/table';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectTableRow } from './project-table-row';




// ----------------------------------------------------------------------



// ----------------------------------------------------------------------

export function ProjectTable({
  sx,
  table,
  notFound,
  onDeleteRow,
  onKanbanView,
  onViewRow,
  dataFiltered,
  onOpenConfirm,
  loadedUsers,
  loadedProjectPermissions,
  loadedStages,
  loadedStagesTask,
  listPermissions,
  setTableData,
  refetchProjects,
  loadedProjects,
  ...other
}) {
  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    //
    selected,
    onSelectRow,
    onSelectAllRows,
    //
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = table;

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const TABLE_HEAD = [
    { id: 'startDate', label: 'Installation Date' },
    { id: 'duration', label: 'Duration' },
    { id: 'number', label: 'Number' },
    { id: 'inspectionDate', label: 'Inspection Date' },
    { id: 'name', label: 'Name' },
    { id: 'currentStage', label: 'Stage' },
    ...((loadedStages || []).map((stage) => ({
      id: stage.id,
      label: stage.name,
      order: stage.order,
      width: 10,
    }))),
    { id: '', width: 88 },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'startDate', label: 'Installation Date' },
    { id: 'duration', label: 'Duration' },
    { id: 'number', label: 'Number' },
    { id: 'hasPermission', label: 'Permission' },
    { id: '' },
  ];

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          m: (theme) => ({ md: theme.spacing(-2, -3, 0, -3) }),
          ...sx,
        }}
        {...other}
      >
        <TableSelectedAction
          dense={dense}
          numSelected={selected.length}
          rowCount={dataFiltered.length}
          onSelectAllRows={(checked) =>
            onSelectAllRows(
              checked,
              dataFiltered.map((row) => row.id)
            )
          }
          action={
            <>
              {/* <Tooltip title="Share">
                <IconButton color="primary">
                  <Iconify icon="solar:share-bold" />
                </IconButton>
              </Tooltip> */}

              <Tooltip title="Delete">
                <IconButton color="primary" onClick={onOpenConfirm}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            </>
          }
          sx={{
            pl: 1,
            pr: 2,
            top: 16,
            left: 24,
            right: 24,
            width: 'auto',
            borderRadius: 1.5,
          }}
        />

        <TableContainer sx={{ px: { md: 3 } }}>
          <Table
            size={dense ? 'small' : 'medium'}
            sx={{
              minWidth: !isMobile ? 960 : 0,
              borderCollapse: 'separate',
              borderSpacing: '0 2px',
            }}
          >
            <TableHeadCustom
              order={order}
              orderBy={orderBy}
              headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
              rowCount={dataFiltered.length}
              numSelected={selected.length}
              onSort={onSort}
              onSelectAllRows={
                verifyPermissions(
                  listPermissions,
                  CONFIG.permissions.system,
                  CONFIG.permissions.moduleProjects,
                  CONFIG.permissions.operationDelete
                ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.superadmin) ?
                  (checked) =>
                    onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    ) : null
              }
              sx={{
                [`& .${tableCellClasses.head}`]: {
                  '&:first-of-type': {
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                  },
                  '&:last-of-type': {
                    borderTopRightRadius: 12,
                    borderBottomRightRadius: 12,
                  },
                },
              }}
            />

            <TableBody>
              {dataFiltered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <ProjectTableRow
                    key={row.id}
                    row={row}
                    selected={selected.includes(row.id)}
                    onSelectRow={() => onSelectRow(row.id)}
                    onDeleteRow={() => onDeleteRow(row.id)}
                    onKanbanView={() => onKanbanView(row.id)}
                    onViewRow={() => onViewRow(row.id)}
                    loadedUsers={loadedUsers}
                    loadedProjectPermissions={loadedProjectPermissions}
                    loadedStages={loadedStages}
                    loadedStagesTask={loadedStagesTask}
                    listPermissions={listPermissions}
                    setTableData={setTableData}
                    refetchProjects={refetchProjects}
                    loadedProjects={loadedProjects}
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

              <TableNoData
                notFound={notFound}
                sx={{
                  m: -2,
                  borderRadius: 1.5,
                  border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                }}
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* <TablePaginationCustom
        page={page}
        dense={dense}
        rowsPerPage={rowsPerPage}
        count={dataFiltered.length}
        onPageChange={onChangePage}
        onChangeDense={onChangeDense}
        onRowsPerPageChange={onChangeRowsPerPage}
        sx={{
          [`& .${tablePaginationClasses.toolbar}`]: {
            borderTopColor: 'transparent',
          },
        }}
      /> */}
    </>
  );
}
