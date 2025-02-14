import { useState, useCallback, useContext } from 'react';

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { LinearProgress } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import { SalesOrderDetailsInfo } from '../sales-order-details-info';
import { SalesOrderDetailsItems } from '../sales-order-details-item';
import { SalesOrderDetailsToolbar } from '../sales-order-details-toolbar';



// ----------------------------------------------------------------------

export function SalesOrderDetailsView({ salesOrder, setSalesOrder}) {

  const { isMobile } = useContext(LoadingContext);

  const {
    loadedUsers,
  } = useDataContext();

  const [status, setStatus] = useState(salesOrder?.status);

  const [updating, setUpdating] = useState(false);

  const handleChangeStatus = useCallback((newValue) => {
    setStatus(newValue);
  }, []);

  const [openCreateProjectDialog, setOpenCreateProjectDialog] = useState(false);

  if (updating) {
    return (
      <DashboardContent>
        <Box
          sx={{
            width: '350px',
            display: 'flex',
            alignSalesOrders: 'center',
            justifyContent: 'center',
            height: '80vh',
            margin: 'auto'
          }}
        >
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
      <SalesOrderDetailsToolbar
        salesOrder={salesOrder}
        openCreateProjectDialog={openCreateProjectDialog}
        setOpenCreateProjectDialog={setOpenCreateProjectDialog}
        backLink={localStorage.getItem('routeByOrder') ? paths.dashboard.order.root :
          (localStorage.getItem('routeByAnalytics') ? paths.dashboard.general.analytics :
            (localStorage.getItem('routeByShipment') ? paths.dashboard.shipment.root :
              (localStorage.getItem('routeByLiveMonitor') ? paths.dashboard.general.liveMonitor :
                (localStorage.getItem('routeByShipmentBySku') ? paths.dashboard.shipment.listBySku : paths.dashboard.salesOrder.root))))}
        status={status}
        isMobile={isMobile}
        loadedUsers={loadedUsers}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <SalesOrderDetailsItems
              salesOrder={salesOrder}
              setSalesOrder={setSalesOrder}
              setUpdating={setUpdating}
              isMobile={isMobile}
            />
            {/* <SalesOrderDetailsSenitronSalesOrders salesOrder={senitronSalesOrder} /> */}

            {/* <SalesOrderDetailsHistory history={salesOrder?.history} /> */}
          </Stack>
        </Grid>

        {/* <Grid xs={12} md={4}>
          <SalesOrderDetailsInfo
            salesOrder={salesOrder}
            setSalesOrder={setSalesOrder}
            isMobile={isMobile}
          />
        </Grid> */}
      </Grid>
    </DashboardContent>
  );
}
