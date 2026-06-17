import { gql, useQuery } from '@apollo/client';



const GET_ALL_USERS = gql`
  {
    allLoginUsers {
      address
      city
      country
      createdTime
      dateJoined
      dateUpdated
      email
      firstName
      gender
      id
      isActive
      isStaff
      lastLogin
      lastModifiedTime
      lastName
      phoneNumber
      state
      userRole
      username
      zipCode
      password
      installerInfo
    }
  }
`;

export const useUsersQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_USERS, {
    context: {
      clientName: 'Users',
    },
  });

  // useEffect(() => {
  //   startPolling(CONFIG.pollingInterval * 3);
  //   return () => {
  //     stopPolling();
  //   };
  // }, [startPolling, stopPolling]);

  const users = data?.allLoginUsers || [];

  return { loading, error, data: users, refetch };

};