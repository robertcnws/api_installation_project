import axios from 'axios';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import { Button, TextField, IconButton, Typography, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar'
import { Iconify } from 'src/components/iconify';
import { PhoneInput } from 'src/components/phone-input';


// import { ServiceListSalesordersView } from './service-table-salesorders';
// import { ServiceDetailsContentOverview } from './service-details-content-overview';


// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function MeasurementNewForm() {

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [dataCreate, setDataCreate] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
  });

  const [isSubmiting, setIsSubmiting] = useState(false);

  const someDataEmpty = useMemo(() => Object.values(dataCreate)
    .some(value => value == null || value.toString().trim() === ''),
    [dataCreate]
  );

  const handleCreateService = useCallback(async () => {

    setIsSubmiting(true);

    const formData = new FormData();

    formData.append('userReporter', JSON.stringify(userLogged?.data) || '');

    const customer = {
      ...dataCreate,
      name: `${dataCreate.firstName} ${dataCreate.lastName}`,
    }

    formData.append('customer', JSON.stringify(customer) || '');

    try {
      const promise = axios.post(`${CONFIG.apiUrl}/measurements/create/measurement/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.promise(promise, {
        loading: 'Creating measurement...',
        success: 'Measurement created!',
        error: 'Error to create measurement!',
      });

      await promise;

      setIsSubmiting(false);

      router.push(paths.dashboard.measurement.list);

    } catch (error) {
      setIsSubmiting(false);
      console.error(error);
    }

  }, [userLogged, router, dataCreate, setIsSubmiting]);

  return (
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
                value={dataCreate.firstName || ''}
                onChange={(e) => {
                  setDataCreate({ ...dataCreate, firstName: e.target.value });
                }}
                InputProps={{
                  endAdornment: dataCreate.firstName.toString().trim().length > 0 && (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={() => {
                        setDataCreate({ ...dataCreate, firstName: '' });
                      }}>
                        <Iconify width={16} icon="mingcute:close-line" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                name="lastName"
                label="Customer Last Name"
                placeholder='Customer Last Name'
                value={dataCreate.lastName || ''}
                onChange={(e) => {
                  setDataCreate({ ...dataCreate, lastName: e.target.value });
                }}
                InputProps={{
                  endAdornment: dataCreate.lastName.toString().trim().length > 0 && (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={() => {
                        setDataCreate({ ...dataCreate, lastName: '' });
                      }}>
                        <Iconify width={16} icon="mingcute:close-line" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {/* <TextField
                name="phone"
                label="Phone or Mobile"
                placeholder='Phone or Mobile'
                value={dataCreate.phone || ''}
                onChange={(e) => {
                  setDataCreate({ ...dataCreate, phone: e.target.value });
                }}
              /> */}
              <PhoneInput
                fullWidth
                name="phone"
                label="Phone or Mobile"
                placeholder='Phone or Mobile'
                value={dataCreate.phone || ''}
                onChange={(e) => {
                  setDataCreate({ ...dataCreate, phone: e });
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
                value={dataCreate.email || ''}
                onChange={(e) => {
                  setDataCreate({ ...dataCreate, email: e.target.value });
                }}
                InputProps={{
                  endAdornment: dataCreate.email.toString().trim().length > 0 && (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={() => {
                        setDataCreate({ ...dataCreate, email: '' });
                      }}>
                        <Iconify width={16} icon="mingcute:close-line" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                name="address"
                label="Address"
                placeholder='Address'
                // defaultValue={dataCreate.salesorderNumber || ''}
                value={dataCreate.address || ''}
                onChange={(e) => {
                  setDataCreate({ ...dataCreate, address: e.target.value });
                }}
                InputProps={{
                  endAdornment: dataCreate.address.toString().trim().length > 0 && (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={() => {
                        setDataCreate({ ...dataCreate, address: '' });
                      }}>
                        <Iconify width={16} icon="mingcute:close-line" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <LoadingButton
                type="button"
                variant="contained"
                loading={isSubmiting}
                disabled={someDataEmpty}
                onClick={handleCreateService}
              >
                Create
              </LoadingButton>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  setDataCreate({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: '',
                    address: '',
                  })
                }}
                disabled={someDataEmpty || isSubmiting}
              >
                Clear Fields
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
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
