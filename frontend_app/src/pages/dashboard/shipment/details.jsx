import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useShipmentsQuery } from 'src/_mock/_shipment';

import { ShipmentDetailsView } from 'src/sections/shipment/view';

// ----------------------------------------------------------------------

const metadata = { title: `Order details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const { data } = useShipmentsQuery(null, null);

  const [shipments, setShipments] = useState(null);

  const [currentShipment, setCurrentShipment] = useState(null);

  useEffect(() => {
    if (data) {
      setShipments(data);
      setCurrentShipment(data.find((ship) => ship.shipmentId === id));
    }
  }, [id, data]);

  if (!currentShipment) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <ShipmentDetailsView shipment={currentShipment} />
    </>
  );
}
