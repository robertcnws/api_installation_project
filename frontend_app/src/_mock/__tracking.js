import { gql, useQuery } from '@apollo/client';



const GET_ALL_TRACKS = gql`
  {
    allProjectTracking {
      action
      createdTime
      id
      managedData
      userReporter
    }
  }
`;

export const useTrackingQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_TRACKS, {
    context: {
      clientName: 'Projects',
    },
  });

  const tracks = data?.allProjectTracking || [];

  return { loading, error, data: tracks, refetch };

};