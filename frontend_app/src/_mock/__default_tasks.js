import { gql, useQuery } from '@apollo/client';



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

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_DEFAULT_TASKS, {
    context: {
      clientName: 'Projects',
    },
  });

  const tasks = data?.allProjectDefaultTasks || [];

  return { loading, error, data: tasks, refetch };

};