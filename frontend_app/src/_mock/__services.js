import { gql, useQuery } from '@apollo/client';



const GET_ALL_SERVICES = gql`
  {
    allServices {
      address
      number
      version
      name
      client
      createdTime
      currentStage
      endDate
      id
      isActive
      lastModifiedTime
      phone
      referenceNumber
      salesOrder
      serviceAttachments
      serviceComments
      serviceDefaultTasks
      serviceHistory
      stageHistory
      startDate
      issuedProducts
      userManager
      userReporter
      usersAssignees
      usersServiceTeam
      serviceType
      servicePlace
      serviceNotes
      hasToPay
      paid
      byFactory
      repaired
      createdBy
      isPartDays
    }
  }
`;

const GET_SERVICE_BY_ID = gql`
  query GetServiceById($id: String!) {
    serviceById(id: $id) {
      address
      number
      version
      name
      client
      createdTime
      currentStage
      endDate
      id
      isActive
      lastModifiedTime
      phone
      referenceNumber
      salesOrder
      serviceAttachments
      serviceComments
      serviceDefaultTasks
      serviceHistory
      stageHistory
      startDate
      issuedProducts
      userManager
      userReporter
      usersAssignees
      usersServiceTeam
      serviceType
      servicePlace
      serviceNotes
      hasToPay
      paid
      byFactory
      repaired
      createdBy
      isPartDays
    }
  }
`;

export const useServicesQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_SERVICES, {
    context: {
      clientName: 'Services',
    },
  });

  const items = data?.allServices || [];

  return { loading, error, data: items, refetch };

};

export const useServiceByIdQuery = (id) => {

  const { loading, error, data, refetch } = useQuery(GET_SERVICE_BY_ID, {
    context: {
      clientName: 'Services',
    },
    variables: { id },
    skip: !id,
  });

  const item = data?.serviceById || {};

  return { loading, error, data: item, refetch };

}