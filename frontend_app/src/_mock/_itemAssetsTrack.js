import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

import { CONFIG } from 'src/config-global';

const GET_ZOHO_ITEM_ASSETS_TRACK = gql`
  query GetZohoItemAssetsTrack($listIds: [String!]) {
    allZohoItemAssetsTrack(listIds: $listIds) {
      itemId
      sku
    	createdTime
      differences {
        news
        losts
      }
      historialDifferences {
        date
        differences {
          news
          losts
        }
      }  
    }
  }
`;

export const useItemAssetsTrackQuery = (listIds) => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ZOHO_ITEM_ASSETS_TRACK, {
    variables: { listIds },
  });

  useEffect(() => {
    startPolling(CONFIG.pollingInterval); 
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);
  
  return { loading, error, data: data?.allZohoItemAssetsTrack };
};
