import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';

const GET_MANUAL_UPDATING_JOBS = gql`
  {
      allManualUpdatingJobs {
        id
        isRunning
      }
  }
`;

export const useManualUpdatingJobsQuery = () => {
  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_MANUAL_UPDATING_JOBS);

  useEffect(() => {
    startPolling(CONFIG.pollingInterval); 
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return { loading, error, data: data?.allManualUpdatingJobs };
};
