import { gql, useQuery } from '@apollo/client';



const GET_ALL_SERVICE_STAGES = gql`
  {
    allServiceStages {
      description
      id
      isActive
      name
      order
    }
  }
`;

export const useServiceStagesQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_SERVICE_STAGES, {
    context: {
      clientName: 'Services',
    },
  });

  const stages = data?.allServiceStages || [];

  return { loading, error, data: stages, refetch };

};