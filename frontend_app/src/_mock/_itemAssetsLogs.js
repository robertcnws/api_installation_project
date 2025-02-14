import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

import { CONFIG } from 'src/config-global';

const GET_SENITRON_ITEMS_ASSETS_LOGS = gql`
  query GetSenitronGroupedLogs($startDate: Date) {
    allSenitronGroupedLogs(startDate: $startDate) {
      itemNumber
      date
      logs {
        senitronId
        serialNumber
        altSerial
        lastSeen
        lastZone
        epc
        lastStatusId
        lastStatusName
        currentStatusId
        currentStatusName
        user
        reason
        createdAt
        updatedAt
        createdTime
      }
    }
  }
`;

export const useSenitronAssetsLogsQuery = (startDate) => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_SENITRON_ITEMS_ASSETS_LOGS, {
    variables: { startDate },
  });

  useEffect(() => {
    startPolling(CONFIG.pollingInterval); 
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);
  
  return { loading, error, data: data?.allSenitronGroupedLogs };
};
