import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';
import { _mock } from './_mock';


const GET_ALL_STAGES_TASK = gql`
  {
    allProjectTaskStages {
      description
      id
      isActive
      name
      order
    }
  }
`;

export const useStagesTaskQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_STAGES_TASK);

  const projectTaskStages = data?.allProjectTaskStages || [];

  return { loading, error, data: projectTaskStages, refetch };

};