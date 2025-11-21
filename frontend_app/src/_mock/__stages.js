import { gql, useQuery } from '@apollo/client';



const GET_ALL_STAGES = gql`
  {
    allProjectStages {
      description
      id
      isActive
      name
      order
      otherName
    }
  }
`;

export const useStagesQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_STAGES, {
    context: {
      clientName: 'Projects',
    },
  });

  const projectStages = data?.allProjectStages || [];

  return { loading, error, data: projectStages, refetch };

};