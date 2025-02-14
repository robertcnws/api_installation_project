import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';
import { _mock } from './_mock';


const GET_ALL_DEFAULT_TASKS = gql`
  {
    allProjectDefaultTasks {
      createdTime
      description
      id
      isActive
      lastModifiedTime
      name
      number
      order
      projectStage
      projectStageStatus
    }
  }
`;

export const useDefaultTasksQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_DEFAULT_TASKS);

  const tasks = data?.allProjectDefaultTasks || [];

  return { loading, error, data: tasks, refetch };

};