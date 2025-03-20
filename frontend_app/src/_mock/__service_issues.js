import { gql, useQuery } from '@apollo/client';



const GET_ALL_SERVICE_ISSUES = gql`
  {
    allServiceIssues {
      id
      name
      description
      isActive
      createdTime
      lastModifiedTime
    }
  }
`;

export const useServiceIssuesQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_SERVICE_ISSUES, {
    context: {
      clientName: 'Services',
    },
  });

  const items = data?.allServiceIssues || [];

  return { loading, error, data: items, refetch };

};