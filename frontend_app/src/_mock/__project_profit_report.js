import { gql, useQuery } from '@apollo/client';



const GET_ALL_PROJECT_PROFIT_REPORTS = gql`
  {
    allProjectProfitReports {
      id
      installationAmount
      installationCost
      installationProfit
      notes
      projectAmount
      projectId
      projectInfo
      createdTime
      lastModifiedTime
    }
  }
`;

export const useProjectProfitReportsQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_PROJECT_PROFIT_REPORTS, {
    context: {
      clientName: 'Projects',
    },
  });

  const projectProfitReports = data?.allProjectProfitReports || [];

  return { loading, error, data: projectProfitReports, refetch };

};