import { useState, useEffect, useCallback } from 'react';
import { gql, useQuery, useApolloClient } from '@apollo/client';


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



// import { useState, useEffect, useCallback } from 'react';
// import { gql, useQuery, useApolloClient } from '@apollo/client';

// const GET_PROJECT_BY_ID = gql`
//   query GetProjectById($id: String!) {
//     projectById(id: $id) {
//       address
//           createdTime
//           description
//           endDate
//           hasPermission
//           id
//           isActive
//           lastModifiedTime
//           name
//           number
//           referenceNumber
//           startDate
//           allProductsMarked
//           allWindowsMarked
//           allScrewMarked
//           allTrashMarked
//           feedback
//           workScope
//           inspectionDate
//           finishPermissionDate
//           isPartDays
//           projectMaterialsOtherNotes
//           salesOrder
//           heavyFields {
//             currentStage
//             projectAttachments
//             projectComments
//             projectDefaultTasks
//             projectHistory
//             projectTasks
//             stageHistory
//             userManager
//             userReporter
//             usersAssignees
//             userInstaller
//             projectMaterials
//             projectGuideProducts
//           }
//     }
//   }
// `;

// export const useProjectByIdQuery = (id) => {

//   const { loading, error, data, refetch } = useQuery(GET_PROJECT_BY_ID, {
//     context: {
//       clientName: 'Projects',
//     },
//     variables: { id },
//     skip: !id,
//   });

//   const project = data?.projectById || {};

//   return { loading, error, data: project, refetch };

// }

// const GET_ALL_PROJECTS = gql`
//   query AllProjects($after: String, $first: Int!) {
//     allProjects(after: $after, first: $first) {
//       results {
//           address
//           createdTime
//           currentStage
//           description
//           endDate
//           hasPermission
//           id
//           isActive
//           lastModifiedTime
//           name
//           number
//           projectAttachments
//           projectComments
//           projectDefaultTasks
//           projectHistory
//           projectTasks
//           referenceNumber
//           salesOrder
//           stageHistory
//           startDate
//           userManager
//           userReporter
//           usersAssignees
//           userInstaller
//           allProductsMarked
//           allWindowsMarked
//           allScrewMarked
//           allTrashMarked
//           feedback
//           workScope
//           projectMaterials
//           projectGuideProducts
//           projectMaterialsOtherNotes
//           inspectionDate
//           finishPermissionDate
//           isPartDays
//       }
//       hasNextPage
//       hasPreviousPage
//       pageSize
//       nextCursor
//     }
//   }
// `;

// const GET_ALL_PROJECTS_OFFSET = gql`
//   query AllProjectsOffset($skip: Int!, $limit: Int!) {
//     allProjectsOffset(skip: $skip, limit: $limit) {
//       totalCount
//       results {
//           address
//           createdTime
//           description
//           endDate
//           hasPermission
//           id
//           isActive
//           lastModifiedTime
//           name
//           number
//           referenceNumber
//           startDate
//           allProductsMarked
//           allWindowsMarked
//           allScrewMarked
//           allTrashMarked
//           feedback
//           workScope
//           inspectionDate
//           finishPermissionDate
//           isPartDays
//           projectMaterialsOtherNotes
//           salesOrder
//           heavyFields {
//             currentStage
//             projectAttachments
//             projectComments
//             projectDefaultTasks
//             projectHistory
//             projectTasks
//             stageHistory
//             userManager
//             userReporter
//             usersAssignees
//             userInstaller
//             projectMaterials
//             projectGuideProducts
//           }
//       }
//     }
//   }
// `;

// export function useProjectsQuery(pageSize = 20) {
//   const client = useApolloClient();
//   const [all, setAll] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       setLoading(true);
//       const { data: head } = await client.query({
//         context: { clientName: 'Projects' },
//         query: GET_ALL_PROJECTS_OFFSET,
//         variables: { skip: 0, limit: 1 },
//         fetchPolicy: 'network-only',
//       });
//       if (cancelled) return;
//       const total = head.allProjectsOffset.totalCount;
//       const pages = Math.ceil(total / pageSize);

//       const promises = Array.from({ length: pages }, (_, i) =>
//         client.query({
//           context: { clientName: 'Projects' },
//           query: GET_ALL_PROJECTS_OFFSET,
//           variables: { skip: i * pageSize, limit: pageSize },
//           fetchPolicy: 'network-only',
//         })
//       );
//       const results = (await Promise.all(promises))
//         .flatMap(r => r.data.allProjectsOffset.results);

//       if (!cancelled) setAll(results);
//       setLoading(false);
//     })();
//     return () => { cancelled = true };
//   }, [client, pageSize]);

//   return { loading, data: all };
// }

