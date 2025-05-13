import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import {
  DataGrid,
  gridClasses,
  GridToolbarExport,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSetState } from 'src/hooks/use-set-state';

import { CONFIG } from 'src/config-global';
import { PRODUCT_STOCK_OPTIONS } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectTableToolbar } from '../project-table-toolbar';
import { ProjectTableFiltersResult } from '../project-table-filters-result';
import {
  RenderCellDate,
  RenderCellStage,
  RenderCellMobile,
  RenderCellProject,
  RenderCellPercentage,
} from '../project-table-row';





// ----------------------------------------------------------------------

const PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const HIDE_COLUMNS = { category: false };

const HIDE_COLUMNS_TOGGLABLE = ['category', 'actions'];

// ----------------------------------------------------------------------

export function ProjectListView({ projects, loadingProjects, ...other }) {
  
  const { isMobile } = useContext(LoadingContext)

  const router = useRouter();

  const filters = useSetState({ publish: [], stock: [] });

  const [tableData, setTableData] = useState([]);

  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [filterButtonEl, setFilterButtonEl] = useState(null);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(HIDE_COLUMNS);

  const currentProjects = useMemo(() =>
    projects.filter((project) => project.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1),
    [projects]);

  useEffect(() => {
    if (currentProjects.length) {
      setTableData(currentProjects);
    }
  }, [currentProjects]);

  const canReset = filters.state.publish.length > 0 || filters.state.stock.length > 0;

  const dataFiltered = applyFilter({ inputData: tableData, filters: filters.state });

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);
    },
    [tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !selectedRowIds.includes(row.id));

    toast.success('Delete success!');

    setTableData(deleteRows);
  }, [selectedRowIds, tableData]);

  const handleViewRow = useCallback(
    (id) => {
      localStorage.setItem('projectId', id);
      router.push(paths.dashboard.project.details(id));
    },
    [router]
  );

  // const CustomToolbarCallback = useCallback(
  //   () => (
  //     <CustomToolbar
  //       filters={filters}
  //       canReset={canReset}
  //       selectedRowIds={selectedRowIds}
  //       setFilterButtonEl={setFilterButtonEl}
  //       filteredResults={dataFiltered.length}
  //       onOpenConfirmDeleteRows={confirmRows.onTrue}
  //     />
  //   ),
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [filters.state, selectedRowIds]
  // );

  const columns = !isMobile ? [
    {
      field: 'name',
      headerName: 'Installations in progress',
      flex: 1,
      minWidth: 360,
      hideable: false,
      sortable: false,
      renderCell: (params) => (
        <RenderCellProject params={params} onViewRow={() => handleViewRow(params.row.id)} />
      ),
    },
    {
      field: 'startDate',
      headerName: 'Install Date',
      width: 180,
      sortable: false,
      renderCell: (params) => <RenderCellDate params={params} />,
    },
    {
      field: 'percentage',
      headerName: 'Percentage',
      width: 100,
      type: 'singleSelect',
      valueOptions: PRODUCT_STOCK_OPTIONS,
      sortable: false,
      renderCell: (params) => <RenderCellPercentage params={params} />,
    },
    {
      field: 'currentStage',
      headerName: 'Stage',
      width: 120,
      type: 'singleSelect',
      editable: true,
      valueOptions: PUBLISH_OPTIONS,
      sortable: false,
      renderCell: (params) => <RenderCellStage params={params} />,
    },
  ] : [
    {
      field: 'installation',
      headerName: 'Installations in progress',
      width: 385,
      type: 'singleSelect',
      editable: true,
      valueOptions: PUBLISH_OPTIONS,
      sortable: false,
      renderCell: (params) => <RenderCellMobile params={params} onViewRow={() => handleViewRow(params.row.id)} />,
    }
  ]

  const getTogglableColumns = () =>
    columns
      .filter((column) => !HIDE_COLUMNS_TOGGLABLE.includes(column.field))
      .map((column) => column.field);

  return (
    <Card sx={{ mt: !isMobile ? 1.5 : -7, ml: !isMobile ? -4 : 0}} {...other}>
        <Scrollbar sx={{ maxHeight: !isMobile ? 360 : '100%', minHeight: !isMobile ? 360 : '100%'}}>

          <DataGrid
            // checkboxSelection
            disableColumnMenu
            disableRowSelectionOnClick
            rows={dataFiltered}
            columns={columns}
            loading={loadingProjects}
            getRowHeight={() => 'auto'}
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            // onRowSelectionModelChange={(newSelectionModel) => setSelectedRowIds(newSelectionModel)}
            // columnVisibilityModel={columnVisibilityModel}
            // onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
            slots={{
              // toolbar: CustomToolbarCallback,
              noRowsOverlay: () => <EmptyContent />,
              noResultsOverlay: () => <EmptyContent title="No results found" />,
            }}
            // slotProps={{
            //   panel: { anchorEl: filterButtonEl },
            //   toolbar: { setFilterButtonEl },
            //   columnsManagement: { getTogglableColumns },
            // }}
            sx={{
              [`& .${gridClasses.cell}`]: {
                alignItems: 'center', display: 'inline-flex'
              },
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
              },
            }}
          />
        </Scrollbar>
      </Card>
  );
}

function CustomToolbar({
  filters,
  canReset,
  selectedRowIds,
  filteredResults,
  setFilterButtonEl,
  onOpenConfirmDeleteRows,
}) {
  return (
    <>
      <GridToolbarContainer>
        <ProjectTableToolbar
          filters={filters}
          options={{ stocks: PRODUCT_STOCK_OPTIONS, publishs: PUBLISH_OPTIONS }}
        />

        <GridToolbarQuickFilter />

        <Stack
          spacing={1}
          flexGrow={1}
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
        >
          {!!selectedRowIds.length && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={onOpenConfirmDeleteRows}
            >
              Delete ({selectedRowIds.length})
            </Button>
          )}

          <GridToolbarColumnsButton />
          <GridToolbarFilterButton ref={setFilterButtonEl} />
          <GridToolbarExport />
        </Stack>
      </GridToolbarContainer>

      {canReset && (
        <ProjectTableFiltersResult
          filters={filters}
          totalResults={filteredResults}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}
    </>
  );
}

function applyFilter({ inputData, filters }) {
  const { stock, publish } = filters;

  if (stock.length) {
    inputData = inputData.filter((product) => stock.includes(product.inventoryType));
  }

  if (publish.length) {
    inputData = inputData.filter((product) => publish.includes(product.publish));
  }

  return inputData;
}
