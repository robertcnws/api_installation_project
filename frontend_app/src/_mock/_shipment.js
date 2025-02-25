import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

import { CONFIG } from 'src/config-global';

const GET_ZOHO_SHIPMENT_ORDERS = gql`
  query GetZohoShipmentOrders($startDate: String, $endDate: String) {
    allZohoShipmentOrders(startDate: $startDate, endDate: $endDate) {
      shipmentId
      salesorderId
      salesorderNumber
      salesorderDate
      salesorderFulfilmentStatus
      salesChannel
      salesChannelFormatted
      shipmentNumber
      date
      shipmentStatus
      shipmentSubStatus
      status
      detailedStatus
      statusMessage
      carrier
      trackingCarrierCode
      service
      deliveryDays
      sourceId
      labelFormat
      sourceName
      deliveryGuarantee
      referenceNumber
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
      discount
      isDiscountBeforeTax
      discountType
      estimateId
      deliveryMethod
      deliveryMethodId
      trackingNumber
      trackingLink
      expectedDeliveryDate
      shipmentDeliveredDate
      shipmentType
      isCarrierShipment
      isTrackingEnabled
      isFormsAvailable
      isEmailNotificationEnabled
      shippingCharge
      subTotal
      taxTotal
      total
      pricePrecision
      isEmailed
      notes
      templateId
      templateName
      templateType
      createdTime
      lastModifiedTime
      associatedPackagesCount
      createdById
      lastModifiedById
      contactPersons
      invoices
      lineItems
      packages
      billingAddress
      shippingAddress
      customFields
      customFieldHash
      documents
      taxes
      trackingStatuses
      multipieceShipments
    }
  }
`;

export const useShipmentsQuery = (startDate, endDate) => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ZOHO_SHIPMENT_ORDERS, {
    variables: { startDate, endDate },
  });

  useEffect(() => {
    startPolling(CONFIG.pollingInterval); 
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);
  
  return { loading, error, data: data?.allZohoShipmentOrders };
};


export const SHIPMENTS_STATUS_OPTIONS = [
  { value: 'delivered', label: 'Delivered' },
  { value: 'partially_shipped', label: 'Partially Shipped' },
  { value: 'draft', label: 'Draft' },
];
