import { gql, useQuery } from '@apollo/client';



const GET_ALL_CALENDAR_NOTES = gql`
  {
    allProjectCalendarNotes {
      associatedEvents
      createdTime
      description
      duration
      endDate
      id
      isActive
      lastModifiedTime
      name
      startDate
      userAssignees
      userInstaller
      userManager
      userReporter
    }
  }
`;

export const useCalendarNotesQuery = () => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_CALENDAR_NOTES, {
    context: {
      clientName: 'Projects',
    },
  });

  const calendarNotes = data?.allProjectCalendarNotes || [];

  return { loading, error, data: calendarNotes, refetch };

};