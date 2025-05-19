import { gql, useQuery } from '@apollo/client';



const GET_ALL_MEASUREMENTS = gql`
  {
    allMeasurements {
      address
      color
      createdTime
      customer
      id
      isActive
      lastModifiedTime
      marks
      number
      phone
      project
      salesOrder
      service
      userManager
      userReporter
      firstDate
      checkDate
      firstAssignee
      checkAssignee
      measurementAttachments
      measurementComments
      generalNotes
    }
  }
`;

const GET_MEASUREMENT_BY_ID = gql`
  query GetMeasurementById($id: String!) {
    measurementById(id: $id) {
      address
      color
      createdTime
      customer
      id
      isActive
      lastModifiedTime
      marks
      number
      phone
      project
      salesOrder
      service
      userManager
      userReporter
      firstDate
      checkDate
      firstAssignee
      checkAssignee
      measurementAttachments
      measurementComments
      generalNotes
    }
  }
`;

export const useMeasurementsQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_MEASUREMENTS, {
    context: {
      clientName: 'Measurements',
    },
  });

  const items = data?.allMeasurements || [];

  return { loading, error, data: items, refetch };

};

export const useMeasurementByIdQuery = (id) => {

  const { loading, error, data, refetch } = useQuery(GET_MEASUREMENT_BY_ID, {
    context: {
      clientName: 'Measurements',
    },
    variables: { id },
    skip: !id,
  });

  const item = data?.measurementById || {};

  return { loading, error, data: item, refetch };

}