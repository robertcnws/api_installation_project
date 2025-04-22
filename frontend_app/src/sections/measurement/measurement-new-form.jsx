import axios from 'axios';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import { Button, Dialog, Switch, TextField, Typography, DialogActions, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar'
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import {
  useTable,
  rowInPage,
  getComparator,
} from 'src/components/table';

import { useDataContext } from 'src/auth/context/data/data-context';

// import { ServiceListSalesordersView } from './service-table-salesorders';
// import { ServiceDetailsContentOverview } from './service-details-content-overview';


// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function MeasurementNewForm({ currentUser }) {

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const table = useTable({ defaultDense: true, defaultRowsPerPage: 5, defaultOrder: 'desc', defaultOrderBy: 'date' });

  const {
    loadedServices,
  } = useDataContext();

  const [dataSearch, setDataSearch] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    salesorderNumber: '',
  });

  const openSalesOrderModal = useBoolean(false);

  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  const [someItemsSelected, setSomeItemsSelected] = useState(false);

  const [allIssuesCompleted, setAllIssuesCompleted] = useState(false);

  const [isSubmiting, setIsSubmiting] = useState(false);

  const [isNotRecent, setIsNotRecent] = useState(true);

  const allDataEmpty = Object.values(dataSearch).every(x => (x === null || x === ''));

  const [salesOrders, setSalesOrders] = useState([]);

  const [selectedListItems, setSelectedListItems] = useState([]);

  const [serviceType, setServiceType] = useState(null);

  const [serviceFiles, setServiceFiles] = useState([]);

  const [serviceNotes, setServiceNotes] = useState(null);

  const [fileToRemove, setFileToRemove] = useState(null);
  const confirm = useBoolean();

  const filters = useSetState({ name: '' });

  const dataFiltered = applyFilter({
    inputData: salesOrders,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const handleFilterName = useCallback(
    (event) => {
      table.onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, table]
  );

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.state.name;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmiting(true);

    try {
      const params = {
        ...dataSearch,
        isNotRecent,
      };
      const promise = axios.get(`${CONFIG.apiUrl}/integration/list_salesorder_to_service/`, {
        params,
      });

      const toastId = toast.loading('Searching...');

      try {
        const response = await promise;
        const count = response.data.results.length;
        toast.dismiss(toastId);
        if (count === 0) {
          toast.warning(`Warning: No salesorder(s) found!`);
        } else {
          const { results } = response.data;
          const orders = results.sort((a, b) => new Date(b.date) - new Date(a.date));

          const finalOrders = orders.filter((order) =>
            !loadedServices?.some((service) => service.salesOrder.salesorder_number === order.salesorder_number)
          );
          if (finalOrders.length === 0) {
            toast.warning('Warning: Salesorder already exists in services!');
          } else {
            toast.success(`${finalOrders.length} salesorder(s) found!`);
          }
          setSalesOrders(finalOrders);
        }
      } catch (error) {
        toast.dismiss(toastId);
        toast.error('Error to find salesorders');
      }

      setIsSubmiting(false);

    } catch (error) {
      setIsSubmiting(false);
      console.error(error);
    }
  }, [dataSearch, isNotRecent, loadedServices]);


  const handleCreateService = useCallback(async () => {
    setIsSubmiting(true);

    const formData = new FormData();

    const filePromises = serviceFiles.map(async (file) => {
      if (file instanceof File) {
        return file;
      }
      if (file.fileUrl) {
        const response = await fetch(file.fileUrl);
        const blob = await response.blob();
        return new File([blob], file.name, { type: blob.type });
      }
      return null;
    });

    const filesToUpload = (await Promise.all(filePromises)).filter((f) => f !== null);

    filesToUpload.forEach((file) => {
      formData.append('serviceAttachments', file);
    });

    formData.append('notes', serviceNotes || '');
    formData.append('serviceType', serviceType || '');
    formData.append('salesOrder', JSON.stringify(selectedSalesOrder) || '');
    formData.append('userReporter', JSON.stringify(userLogged?.data) || '');
    formData.append('issuedProducts', JSON.stringify(selectedListItems.filter((item) => item.selected)) || '');

    try {
      const promise = axios.post(`${CONFIG.apiUrl}/services/create/service/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.promise(promise, {
        loading: 'Creating service...',
        success: 'Service created!',
        error: 'Error to create service',
      });

      await promise;

      setIsSubmiting(false);

      setServiceFiles([]);
      setServiceNotes(null);

      openSalesOrderModal.onFalse();

      router.push(paths.dashboard.service.list);

    } catch (error) {
      setIsSubmiting(false);
      console.error(error);
    }
  }, [selectedSalesOrder, selectedListItems, userLogged, openSalesOrderModal, router, serviceType, serviceFiles, serviceNotes]);


  const handleDownloadFile = (file) => {
    if (!file || !file.fileUrl) return;

    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.name;
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClickRemoveFile = (file) => {
    setFileToRemove(file);
    confirm.onTrue();
  };

  const handleConfirmRemove = async () => {
    if (!fileToRemove) return;
    let updatedNew = [];

    updatedNew = serviceFiles.filter((f) => f.name !== fileToRemove.name);
    setServiceFiles(updatedNew);

    confirm.onFalse();
    setFileToRemove(null);
  };

  return (
    <>
      <Grid container spacing={1} sx={{ mt: -2 }}>
        <Grid xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant='h6'>Customer</Typography>
            </Box>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(3, 1fr)',
              }}
              sx={{ mb: 2 }}
            >
              <TextField
                name="firstName"
                label="Customer First Name"
                placeholder='Customer First Name'
                value={dataSearch.firstName || ''}
                onChange={(e) => {
                  setDataSearch({ ...dataSearch, firstName: e.target.value })
                  setIsNotRecent(true);
                  setSalesOrders([]);
                }}
              />
              <TextField
                name="lastName"
                label="Customer Last Name"
                placeholder='Customer Last Name'
                value={dataSearch.lastName || ''}
                onChange={(e) => {
                  setDataSearch({ ...dataSearch, lastName: e.target.value })
                  setIsNotRecent(true);
                  setSalesOrders([]);
                }}
              />
              <TextField
                name="phone"
                label="Phone or Mobile"
                placeholder='Phone or Mobile'
                value={dataSearch.phone || ''}
                onChange={(e) => {
                  setDataSearch({ ...dataSearch, phone: e.target.value })
                  setIsNotRecent(true);
                  setSalesOrders([]);
                }}
              />
            </Box>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
              sx={{ mb: 2 }}
            >
              <TextField
                type="email"
                name="email"
                label="Email"
                placeholder='Email'
                value={dataSearch.email || ''}
                onChange={(e) => {
                  setDataSearch({ ...dataSearch, email: e.target.value })
                  setIsNotRecent(true);
                  setSalesOrders([]);
                }}
              />
              <TextField
                name="address"
                label="Address"
                placeholder='Address'
                // defaultValue={dataSearch.salesorderNumber || ''}
                value={dataSearch.salesorderNumber || ''}
                onChange={(e) => {
                  setDataSearch({ ...dataSearch, salesorderNumber: e.target.value })
                  setIsNotRecent(true);
                  setSalesOrders([]);
                }}
              />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <LoadingButton
                type="button"
                variant="contained"
                loading={isSubmiting}
                disabled={allDataEmpty}
                onClick={handleSearch}
              >
                Create
              </LoadingButton>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setDataSearch({
                    companyName: '',
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: '',
                    salesorderNumber: '',
                  })
                  setIsNotRecent(true);
                  setSalesOrders([]);
                }}
                disabled={allDataEmpty || isSubmiting}
              >
                Clear Fields
              </Button>
            </Stack>
          </Card>
        </Grid>
        {/* {salesOrders.length > 0 && (
          <Grid xs={12} md={12}>
            <Card>
              <Stack
                spacing={2}
                alignItems={{ xs: 'flex-end', md: 'center' }}
                direction={{ xs: 'column', md: 'column' }}
                sx={{ p: 1, pr: { xs: 2.5, md: 1 } }}
              >
                <TextField
                  fullWidth
                  value={filters.state.name}
                  onChange={handleFilterName}
                  placeholder="Search by salesorder (NUMBER, CUSTOMER, DATE or STATUS)"
                  // disabled={dataFiltered?.length === 0}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <ServiceListSalesordersView
                  findedSalesOrders={dataFiltered}
                  table={table}
                  openSalesOrderModal={openSalesOrderModal}
                  setSelectedSalesOrder={setSelectedSalesOrder}
                />
              </Stack>
            </Card>
          </Grid>
        )} */}
      </Grid>
      {/* <Dialog open={openSalesOrderModal.value} onClose={openSalesOrderModal.onFalse} fullWidth maxWidth="lg">
        <Scrollbar style={{ height: '70%' }}>
          <ServiceDetailsContentOverview
            salesOrder={selectedSalesOrder}
            setSomeItemsSelected={setSomeItemsSelected}
            setAllIssuesCompleted={setAllIssuesCompleted}
            selectedListItems={selectedListItems}
            setSelectedListItems={setSelectedListItems}
            setServiceType={setServiceType}
            serviceFiles={serviceFiles}
            setServiceFiles={setServiceFiles}
            serviceNotes={serviceNotes}
            setServiceNotes={setServiceNotes}
            handleDownloadFile={handleDownloadFile}
            handleClickRemoveFile={handleClickRemoveFile}
          />
        </Scrollbar>
        <DialogActions>
          <Button
            variant="contained"
            disabled={!someItemsSelected || !allIssuesCompleted}
            onClick={handleCreateService}
          >
            Create Service
          </Button>
          <Button variant="outlined" onClick={openSalesOrderModal.onFalse}>
            Close
          </Button>
        </DialogActions>
      </Dialog> */}
      <ConfirmDialog
        open={confirm.value}
        onClose={() => {
          confirm.onFalse();
          setFileToRemove(null);
        }}
        title="Remove File"
        content={
          <>
            {fileToRemove && (
              <>
                Are you sure you want to delete the file{' '}
                <strong>{fileToRemove.name}</strong> from the service{' '}?
              </>
            )}
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmRemove}>
            Remove
          </Button>
        }
      />
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
      (item) => item.salesorder_number.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item.customer_name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  return inputData;
}
