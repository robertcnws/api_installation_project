import { gql, useQuery } from '@apollo/client';

const GET_NOTIFICATIONS = gql`
  query GetProjectNotificationUsers($username: String, $user: String, $page: Int, $pageSize: Int) {
    allProjectNotificationUsers(username: $username, user: $user, page: $page, pageSize: $pageSize) {
      count
      page
      pageSize
      results {
        createdTime
        id
        notification
        read
        lastModifiedTime
        user
        username
      }
    }
  }
`;

export const useNotificationsQuery = (username, user, page, pageSize) => {
  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_NOTIFICATIONS, {
    context: {
      clientName: 'Projects',
    },
    variables: { username, user, page, pageSize },
    fetchPolicy: 'network-only',
  });

  // useEffect(() => {
  //   startPolling(CONFIG.pollingInterval); 
  //   return () => {
  //     stopPolling();
  //   };
  // }, [startPolling, stopPolling]);

  return { loading, error, data: data?.allProjectNotificationUsers?.results || [], refetch };
}; 
