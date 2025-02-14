import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';

const GET_JOBS_UPDTING_TIMES = gql`
  {
    allJobsUpdatingTimes {
        id
        lastUpdated
    }
  }
`;

export const useJobsUpdatingTimesQuery = () => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_JOBS_UPDTING_TIMES);

  useEffect(() => {
    startPolling(CONFIG.pollingInterval); 
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return { loading, error, data: data?.allJobsUpdatingTimes };
};
