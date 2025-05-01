import { gql, useQuery } from '@apollo/client';

const GET_PROJECT_REMINDERS = gql`
  query GetProjectReminders($username: String!) {
    allProjectReminders(username: $username) {
      createdTime
      date
      id
      isActive
      lastModifiedTime
      notes
      project
      projectDefaultTask
      userReporter
    }
  }
`;

export const useProjectRemindersQuery = (username) => {

  const { loading, error, data, refetch } = useQuery(GET_PROJECT_REMINDERS, {
    context: {
      clientName: 'Projects',
    },
    variables: { username },
    skip: !username,
  });

  const reminders = data?.allProjectReminders || [];

  return { loading, error, data: reminders, refetch };

}