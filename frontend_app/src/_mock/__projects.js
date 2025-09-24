import { gql, useQuery } from '@apollo/client';


const GET_ALL_PROJECTS = gql`
  {
    allProjects {
      address
      createdTime
      currentStage
      description
      endDate
      hasPermission
      id
      isActive
      lastModifiedTime
      name
      number
      phone
      projectAttachments
      projectComments
      projectDefaultTasks
      projectHistory
      projectTasks
      referenceNumber
      salesOrder
      stageHistory
      startDate
      userManager
      userReporter
      usersAssignees
      allProductsMarked
      allWindowsMarked
      allScrewMarked
      allTrashMarked
      feedback
      workScope
      projectMaterials
      projectGuideProducts
      projectMaterialsOtherNotes
      inspectionDate
      finishPermissionDate
      isPartDays
      duration
      workOrders
    }
  }
`;

const GET_PROJECT_BY_ID = gql`
  query GetProjectById($id: String!) {
    projectById(id: $id) {
      address
      createdTime
      currentStage
      description
      endDate
      hasPermission
      id
      isActive
      lastModifiedTime
      name
      number
      phone
      projectAttachments
      projectComments
      projectDefaultTasks
      projectHistory
      projectTasks
      referenceNumber
      salesOrder
      stageHistory
      startDate
      userManager
      userReporter
      usersAssignees
      userInstaller
      allProductsMarked
      allWindowsMarked
      allScrewMarked
      allTrashMarked
      feedback
      workScope
      projectMaterials
      projectGuideProducts
      projectMaterialsOtherNotes
      inspectionDate
      finishPermissionDate
      isPartDays
      duration
      workOrders
    }
  }
`;

export const useProjectsQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_PROJECTS, {
    context: {
      clientName: 'Projects',
    },
  });

  const projects = data?.allProjects || [];

  return { loading, error, data: projects, refetch };

};

export const useProjectByIdQuery = (id) => {

  const { loading, error, data, refetch } = useQuery(GET_PROJECT_BY_ID, {
    context: {
      clientName: 'Projects',
    },
    variables: { id },
    skip: !id,
  });

  const project = data?.projectById || {};

  return { loading, error, data: project, refetch };

}