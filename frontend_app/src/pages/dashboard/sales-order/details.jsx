import { Helmet } from 'react-helmet-async';
import React, { useState, useEffect } from 'react';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { SalesOrderDetailsView } from 'src/sections/sales-order/view';

import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

const metadata = { title: `Sales Order details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const {
    loadedSalesOrders,
  } = useDataContext();

  const [listSalesOrders, setListSalesOrders] = useState(null);

  const [currentSalesOrder, setCurrentSalesOrder] = useState(null);

  useEffect(() => {
    if (loadedSalesOrders) {
      setListSalesOrders(loadedSalesOrders.results);
    }
  }, [loadedSalesOrders]);

  useEffect(() => {
    if (listSalesOrders) {
      setCurrentSalesOrder(listSalesOrders.find((item) => item.salesorder_id === id));
    }
  }, [id, listSalesOrders]);

  if (!currentSalesOrder ) {
    return null;
  }
  
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SalesOrderDetailsView salesOrder={currentSalesOrder} setSalesOrder={setCurrentSalesOrder} />
    </>
  );
}
