import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';
import { _mock } from './_mock';


const GET_ALL_USERS = gql`
  {
    allLoginUsers {
      address
      city
      country
      dateJoined
      dateUpdated
      email
      firstName
      gender
      id
      isActive
      isStaff
      lastLogin
      lastName
      phoneNumber
      state
      username
      zipCode
      createdTime
      lastModifiedTime
    }
  }
`;

export const useUsersQuery = () => {

  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ALL_USERS);

  // useEffect(() => {
  //   startPolling(CONFIG.pollingInterval * 3);
  //   return () => {
  //     stopPolling();
  //   };
  // }, [startPolling, stopPolling]);

  const users = data?.allLoginUsers || [];

  return { loading, error, data: users };

};