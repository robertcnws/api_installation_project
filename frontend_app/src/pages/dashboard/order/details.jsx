import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useSalesOrdersQuery } from 'src/_mock/_orders';

import { OrderDetailsView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

const metadata = { title: `Order details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const { data } = useSalesOrdersQuery();

  const [orders, setOrders] = useState(null);

  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    if (data) {
      setOrders(data);
      setCurrentOrder(data.find((order) => order.salesorderId === id));
    }
  }, [id, data]);

  if (!currentOrder) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <OrderDetailsView order={currentOrder} />
    </>
  );
}
