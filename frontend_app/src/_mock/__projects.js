import { useState, useEffect, useCallback } from 'react';
import { gql, useQuery, useApolloClient } from '@apollo/client';


// const GET_ALL_PROJECTS = gql`
//   {
//     allProjects {
//       address
//       createdTime
//       currentStage
//       description
//       endDate
//       hasPermission
//       id
//       isActive
//       lastModifiedTime
//       name
//       number
//       projectAttachments
//       projectComments
//       projectDefaultTasks
//       projectHistory
//       projectTasks
//       referenceNumber
//       salesOrder
//       stageHistory
//       startDate
//       userManager
//       userReporter
//       usersAssignees
//       allProductsMarked
//       allWindowsMarked
//       allScrewMarked
//       allTrashMarked
//       feedback
//       workScope
//       projectMaterials
//       projectGuideProducts
//       projectMaterialsOtherNotes
//       inspectionDate
//       finishPermissionDate
//       isPartDays
//     }
//   }
// `;

// const GET_ALL_PROJECTS = gql`
//   query AllProjects($page:Int!,$pageSize:Int!) {
//     allProjects(page:$page,pageSize:$pageSize) {
//       address
//       createdTime
//       currentStage
//       description
//       endDate
//       hasPermission
//       id
//       isActive
//       lastModifiedTime
//       name
//       number
//       projectAttachments
//       projectComments
//       projectDefaultTasks
//       projectHistory
//       projectTasks
//       referenceNumber
//       salesOrder
//       stageHistory
//       startDate
//       userManager
//       userReporter
//       usersAssignees
//       userInstaller
//       allProductsMarked
//       allWindowsMarked
//       allScrewMarked
//       allTrashMarked
//       feedback
//       workScope
//       projectMaterials
//       projectGuideProducts
//       projectMaterialsOtherNotes
//       inspectionDate
//       finishPermissionDate
//       isPartDays
//     }
//   }
// `;


const GET_ALL_PROJECTS = gql`
  query AllProjects($after: String, $first: Int!) {
    allProjects(after: $after, first: $first) {
      edges {
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
      nextCursor
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

// export const useProjectsQuery = () => {

//   const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_ALL_PROJECTS, {
//     context: {
//       clientName: 'Projects',
//     },
//   });

//   const projects = data?.allProjects || [];

//   return { loading, error, data: projects, refetch };

// };

// const PAGE_SIZE = 50;

// export function useProjectsQuery() {

//   const client = useApolloClient();
//   const [allProjects, setAllProjects] = useState([]);
//   const [error, setError] = useState();
//   const [loading, setLoading] = useState(true);
//   const [reloadFlag, setReloadFlag] = useState(0);

//   const fetchAll = useCallback(() => {
//     let cancelled = false;
//     const accumulator = [];
    
//     function fetchPage(page) {
//       client
//         .query({
//           query: GET_ALL_PROJECTS,
//           variables: { page, pageSize: PAGE_SIZE },
//           context: { clientName: 'Projects' },
//           fetchPolicy: 'network-only',
//         })
//         .then((result) => {
//           if (cancelled) return;
//           const pageData = result.data.allProjects || [];
//           accumulator.push(...pageData);

//           if (pageData.length === PAGE_SIZE) {
//             fetchPage(page + 1);
//           } else {
//             setAllProjects(accumulator);
//             setLoading(false);
//           }
//         })
//         .catch((err) => {
//           if (cancelled) return;
//           setError(err);
//           setLoading(false);
//         });
//     }

//     setLoading(true);
//     setAllProjects([]);
//     fetchPage(1);

//     return () => {
//       cancelled = true;
//     };
//   }, [client]);
  
//   useEffect(() => {
//     const cleanup = fetchAll();
//     return cleanup;
//   }, [fetchAll, reloadFlag]);
  
//   const refetch = useCallback(() => {
//     setReloadFlag((f) => f + 1);
//   }, []);

//   return {
//     loading,
//     error,
//     data: allProjects,
//     refetch,
//   };
// }

export const useProjectByIdQuery = (id) => {

  const { loading, error, data, startPolling, stopPolling, refetch } = useQuery(GET_PROJECT_BY_ID, {
    context: {
      clientName: 'Projects',
    },
    variables: { id },
    skip: !id,
  });

  const project = data?.projectById || {};

  return { loading, error, data: project, refetch };

}


export function useProjectsQuery(pageSize = 50) {
  const { loading, error, data, fetchMore, refetch } = useQuery(
    GET_ALL_PROJECTS,
    {
      context: {
        clientName: 'Projects',
      },
      variables: { 
        first: pageSize 
      },
      fetchPolicy: 'network-only',
    }
  );

  const projects = data?.allProjects?.edges || [];
  const hasMore = Boolean(data?.allProjects?.nextCursor);

  const loadMore = () => {
    if (!hasMore) return;
    fetchMore({
      variables: { after: data.allProjects.nextCursor },
      updateQuery: (prev, { fetchMoreResult }) => ({
        allProjects: {
          edges: [...prev.allProjects.edges, ...fetchMoreResult.allProjects.edges],
          nextCursor: fetchMoreResult.allProjects.nextCursor
        }
      })
    });
  };

  return {
    loading,
    error,
    data: projects,
    refetch,
    loadMore,
    hasMore
  };
}