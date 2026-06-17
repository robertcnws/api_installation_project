import { gql, useQuery } from '@apollo/client';

const GET_ALL_TASK_TIMERS = gql`
  query GetAllTaskTimers {
    allTaskTimers {
      createdTime
      elapsedMs
      entityId
      entityType
      entityInfo
      id
      isRunning
      lastModifiedTime
      startTime
      username
    }
  }
`;

const GET_TASK_TIMER_BY_ID = gql`
  query GetTaskTimerById($id: String!) {
    timerById(id: $id) {
      createdTime
      elapsedMs
      entityId
      entityType
      entityInfo
      id
      isRunning
      lastModifiedTime
      startTime
      username
    }
  }
`;

const GET_TASK_TIMER_BY_ENTITY_USERNAME = gql`
  query GetTaskTimerByEntityUsername($username: String!, $entityType: String!, $entityId: String!) {
    timerGetByUsernameEntity(username: $username, entityType: $entityType, entityId: $entityId) {
      createdTime
      elapsedMs
      entityId
      entityType
      entityInfo
      id
      isRunning
      lastModifiedTime
      startTime
      username
    }
  }
`;

export const useTaskTimersQuery = (id=null, username=null, entityType=null, entityId=null) => {

  let field = 'allTaskTimers';

  let queryOptions = {
    context: {
      clientName: 'Projects',
    },
  };

  if (id) {
    queryOptions = {
      ...queryOptions,
      variables: { id },
      skip: !id,
    };
    field = 'timerById';
  } else if (username || entityType || entityId) {
    queryOptions = {
      ...queryOptions,
      variables: { username, entityType, entityId },
      skip: !(username && entityType && entityId),
    };
    field = 'timerGetByUsernameEntity';
  }

  const { loading, error, data, refetch } = useQuery(
    field === 'allTaskTimers' ? GET_ALL_TASK_TIMERS :
    field === 'timerById' ? GET_TASK_TIMER_BY_ID :
    GET_TASK_TIMER_BY_ENTITY_USERNAME,
    queryOptions
  );

  const timers = data?.[field] || [];

  return { loading, error, data: timers, refetch };

};