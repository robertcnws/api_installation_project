import { gql, useQuery } from '@apollo/client';



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

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_STAGES_TASK, {
    context: {
      clientName: 'Projects',
    },
  });

  const projectTaskStages = data?.allProjectTaskStages || [];

  return { loading, error, data: projectTaskStages, refetch };

};