import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { CONFIG } from 'src/config-global';
import { _mock } from './_mock';


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

  const { loading, error, data, startPolling, stopPolling } = useQuery(GET_ALL_PROJECT_PERMISSIONS);

  const projectPermissions = data?.allProjectPermissions || [];

  return { loading, error, data: projectPermissions };

};