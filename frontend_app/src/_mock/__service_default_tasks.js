import { gql, useQuery } from '@apollo/client';



const GET_ALL_SERVICE_DEFAULT_TASKS = gql`
  {
    allServiceDefaultTasks {
      createdTime
      description
      id
      isActive
      lastModifiedTime
      name
      number
      order
      serviceStage
      serviceStageStatus
      hasAttachments
    }
  }
`;

export const useServiceDefaultTasksQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_SERVICE_DEFAULT_TASKS, {
    context: {
      clientName: 'Services',
    },
  });

  const tasks = data?.allServiceDefaultTasks || [];

  return { loading, error, data: tasks, refetch };

};