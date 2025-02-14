import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';

import { ORDER_STATUS_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { OrderDetailsInfo } from '../order-details-info';
import { OrderDetailsItems } from '../order-details-item';
import { OrderDetailsToolbar } from '../order-details-toolbar';
import { OrderDetailsHistory } from '../order-details-history';

// ----------------------------------------------------------------------

export function OrderDetailsView({ order }) {
  const [status, setStatus] = useState(order?.status);

  const handleChangeStatus = useCallback((newValue) => {
    setStatus(newValue);
  }, []);

  return (
    <DashboardContent>
      <OrderDetailsToolbar
        backLink={paths.dashboard.order.root}
        orderNumber={order?.salesorderNumber}
        createdAt={order?.createdTime}
        status={status}
        onChangeStatus={handleChangeStatus}
        statusOptions={ORDER_STATUS_OPTIONS}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <OrderDetailsItems order={order}
            />

            {/* <OrderDetailsHistory history={order?.history} /> */}
          </Stack>
        </Grid>

        {/* <Grid xs={12} md={4}>
          <OrderDetailsInfo
            customer={order?.customerName}
            delivery={order?.delivery}
            payment={order?.payment}
            shippingAddress={order?.shippingAddress}
          />
        </Grid> */}
      </Grid>
    </DashboardContent>
  );
}
