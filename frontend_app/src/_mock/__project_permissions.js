import { gql, useQuery } from '@apollo/client';



const GET_ALL_PROJECT_PERMISSIONS = gql`
  {
    allProjectPermissions {
      description
      id
      isActive
      name
    }
  }
`;

export const useProjectPermissionsQuery = () => {

  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ALL_PROJECT_PERMISSIONS, {
    context: {
      clientName: 'Projects',
    },
  });

  const projectPermissions = data?.allProjectPermissions || [];

  return { loading, error, data: projectPermissions };

};