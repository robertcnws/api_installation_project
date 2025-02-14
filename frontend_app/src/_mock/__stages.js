import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';
import { _mock } from './_mock';


const GET_ALL_STAGES = gql`
  {
    allProjectStages {
      description
      id
      isActive
      name
      order
    }
  }
`;

export const useStagesQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_STAGES);

  const projectStages = data?.allProjectStages || [];

  return { loading, error, data: projectStages, refetch };

};