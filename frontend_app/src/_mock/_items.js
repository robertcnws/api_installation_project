import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

import { CONFIG } from 'src/config-global';

const GET_ZOHO_INVENTORY_ITEMS = gql`
  {
    allZohoInventoryItems {
        id
        groupId
        groupName
        itemId
        name
        status
        source
        itemType
        isLinkedWithZohocrm
        description
        rate
        isTaxable
        taxId
        taxName
        taxPercentage
        purchaseDescription
        purchaseRate
        isComboProduct
        syncedWithSenitron
        productType
        attributeId1
        attributeName1
        reorderLevel
        stockOnHand
        availableStock
        actualAvailableStock
        sku
        upc
        ean
        isbn
        partNumber
        attributeOptionId1
        attributeOptionName1
        createdTime
        lastModifiedTime
        hsnOrSac
        satItemKeyCode
        unitkeyCode
        ignoreErrors
    }
  }
`;

const GET_SENITRON_INVENTORY_ITEM = gql`
  {
    allSenitronInventoryItemsAssets {
      itemNumber
      count
      senitronItem {
        itemNumber
        tagsCount
        qty
      }
      assets {
        id
        serialNumber
        altSerial
        firstSeen
        lastSeen
        lastSeenAntenna
        lastZone
        handheldReader
        handheldLastSeen
        staticZone
        staticZoneLastUpdate
        receivingDate
        currentUnits
        storageUnit
        adjustQty
        createdAt
        updatedAt
        epc
        text3
        status {
          id
          name
        }
      }
    }
  }
`;

export const useItemsQuery = () => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ZOHO_INVENTORY_ITEMS);

  useEffect(() => {
    startPolling(CONFIG.pollingInterval); 
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return { loading, error, data: data?.allZohoInventoryItems };
};

export const useSenitronItemsQuery = () => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_SENITRON_INVENTORY_ITEM, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const checkAndTogglePolling = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= 7 && currentHour < 17) {
        startPolling(CONFIG.pollingInterval * 3); // 15 minutos
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

  return { loading, error, data: data?.allSenitronInventoryItemsAssets };
};

export const ITEM_STATUS_OPTIONS = [
  // { value: 'active', label: 'Active' },
  // { value: 'confirmation_pending', label: 'Confirmation Pending' },
  // { value: 'inactive', label: 'Inactive' },
];

export const ITEM_TYPE_OPTIONS = [
  { value: 'not_synced', label: 'SKUs Untracked' },
  { value: 'active', label: 'SKUs Active' },
  { value: 'inactive', label: 'SKUs Inactive' },
  { value: 'confirmation_pending', label: 'SKUs in Confirmation Pending' },
  { value: 'not_assets', label: 'SKUs without Assets' },
];

export const ITEM_STATUS_SHORT_OPTIONS = [
  // { value: 'all', label: 'All Items' }, 
  // { value: 'active', label: 'Items Active' },
  // { value: 'confirmation_pending', label: 'Items in Confirmation Pending' },
  // { value: 'inactive', label: 'Items Inactive' },
];

export const ITEM_SYNC_OPTIONS = [
  { value: 'yes', label: 'Synced' },
  { value: 'no', label: 'Not Synced' },
];
