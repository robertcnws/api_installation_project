import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';

const GET_ZOHO_INVENTORY_SALES_ORDERS = gql`
  query GetZohoInventorySalesOrders($startDate: String, $endDate: String) {
    allZohoInventorySalesOrders(startDate: $startDate, endDate: $endDate) {
      salesorderId
      salesorderNumber
      date
      status
      lineItems
      customerId
      customerName
      isTaxable
      taxId
      taxName
      taxPercentage
      currencyId
      currencyCode
      currencySymbol
      exchangeRate
      deliveryMethod
      totalQuantity
      subTotal
      taxTotal
      total
      createdByEmail
      createdByName
      salespersonId
      isTestOrder
      notes
      paymentTerms
      paymentTermsLabel
      shippingAddress
      billingAddress
      warehouses
      customFields
      orderSubStatuses
      shipmentSubStatuses
      createdTime
      lastModifiedTime
    }
  }
`;

export const useSalesOrdersQuery = (startDate, endDate) => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ZOHO_INVENTORY_SALES_ORDERS, {
    variables: { startDate, endDate },
  });

  useEffect(() => {
    const checkAndTogglePolling = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= 7 && currentHour < 17) {
        startPolling(CONFIG.pollingInterval); // 15 minutos
      } else {
        stopPolling();
      }
    };

    checkAndTogglePolling();

    const intervalId = setInterval(checkAndTogglePolling, 60000); // Cada minuto

    return () => {
      clearInterval(intervalId);
      stopPolling();
    };
  }, [startPolling, stopPolling]);
  
  return { loading, error, data: data?.allZohoInventorySalesOrders };
};


export const SALES_ORDERS_STATUS_OPTIONS = [
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'partially_shipped', label: 'Partially Shipped' },
  { value: 'draft', label: 'Draft' },
];
