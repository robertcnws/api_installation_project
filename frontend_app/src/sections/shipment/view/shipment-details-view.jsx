import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';

import { ORDER_STATUS_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { ShipmentDetailsInfo } from '../shipment-details-info';
import { ShipmentDetailsItems } from '../shipment-details-item';
import { ShipmentDetailsToolbar } from '../shipment-details-toolbar';
import { ShipmentDetailsHistory } from '../shipment-details-history';

// ----------------------------------------------------------------------

export function ShipmentDetailsView({ shipment }) {
  const [status, setStatus] = useState(shipment?.status);

  const handleChangeStatus = useCallback((newValue) => {
    setStatus(newValue);
  }, []);

  return (
    <DashboardContent>
      <ShipmentDetailsToolbar
        backLink={localStorage.getItem('routeShipmentByLiveMonitor') ?  paths.dashboard.general.liveMonitor : paths.dashboard.shipment.root}
        orderNumber={shipment?.shipmentNumber}
        createdAt={shipment?.createdTime}
        status={status}
        onChangeStatus={handleChangeStatus}
        statusOptions={ORDER_STATUS_OPTIONS}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <ShipmentDetailsItems shipment={shipment}
            />

            {/* <ShipmentDetailsHistory history={order?.history} /> */}
          </Stack>
        </Grid>

        {/* <Grid xs={12} md={4}>
          <ShipmentDetailsInfo
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
