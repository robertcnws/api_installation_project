import { gql, useQuery } from '@apollo/client';



const GET_ALL_USER_ROLES = gql`
  query GetAllUserRoles($excludingNames: [String!]!) {
    allUserRoles(excludingNames: $excludingNames) {
      description
      id
      isActive
      name
      createdTime
      lastModifiedTime
    }
  }
`;

export const useUserRolesQuery = (excludingNames) => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_USER_ROLES, {
    context: {
      clientName: 'Users',
    },
    variables: { excludingNames },
    skip: !excludingNames,
  });

  const userRoles = data?.allUserRoles || [];

  return { loading, error, data: userRoles, refetch };

};