import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';

const GET_ZOHO_SKU_TRACK_INFO = gql`
  {
    allZohoSkuTrackInfo {
      id
      skuTracked
      skuMatched
      skuMissing
      skuExcess
      date
    }
  }
`;

export const useSkuTrackInfoQuery = () => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ZOHO_SKU_TRACK_INFO);

  useEffect(() => {
    startPolling(CONFIG.pollingInterval * 3); 
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return { loading, error, data: data?.allZohoSkuTrackInfo };
};