import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';

const GET_NOTIFICATIONS = gql`
  query GetProjectNotificationUsers($username: String, $page: Int, $pageSize: Int) {
    allProjectNotificationUsers(username: $username, page: $page, pageSize: $pageSize) {
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

export const useNotificationsQuery = (username, page, pageSize) => {
  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { username, page, pageSize },
    fetchPolicy: 'network-only',
  });

  // useEffect(() => {
  //   startPolling(CONFIG.pollingInterval); 
  //   return () => {
  //     stopPolling();
  //   };
  // }, [startPolling, stopPolling]);
  
  return { loading, error, data: data?.allProjectNotificationUsers?.results || [], refetch};
}; 
