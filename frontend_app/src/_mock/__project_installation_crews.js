import { gql, useQuery } from '@apollo/client';



const GET_ALL_PROJECT_INSTALLATION_CREWS = gql`
  {
    allProjectInstallationCrews {
      costByUnit
      createdTime
      description
      id
      isActive
      lastModifiedTime
      name
      typeCrew
      typeWorking
      unit
      userReporter
      usersHelpers
      usersInstallers
    }
  }
`;

export const useProjectInstallationCrewsQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_PROJECT_INSTALLATION_CREWS, {
    context: {
      clientName: 'Projects',
    },
  });

  const projectInstallationCrews = data?.allProjectInstallationCrews || [];

  return { loading, error, data: projectInstallationCrews, refetch };

};