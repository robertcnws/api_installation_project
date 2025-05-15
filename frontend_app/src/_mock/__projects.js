import { useState, useEffect, useCallback } from 'react';
import { gql, useQuery, useApolloClient } from '@apollo/client';

// PROJECT BY ID

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

// PROJECTS
// This query fetches all projects with pagination support

const GET_ALL_PROJECTS = gql`
  query AllProjects($after: String, $first: Int!) {
    allProjects(after: $after, first: $first) {
      results {
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
      hasNextPage
      hasPreviousPage
      pageSize
      nextCursor
    }
  }
`;

// export function useProjectsQuery(pageSize = 20) {
//   const client = useApolloClient();
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [reload, setReload] = useState(0);

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const all = [];
//         let after = null;

//         /* eslint-disable no-await-in-loop */
//         while (!cancelled) {
//           const { data } = await client.query({
//             context: { clientName: 'Projects' },
//             query: GET_ALL_PROJECTS,
//             variables: { after, first: pageSize },
//             fetchPolicy: 'network-only',
//           });

//           const { results, hasNextPage, nextCursor } = data.allProjects;
//           all.push(...results);

//           if (!hasNextPage) break;
//           after = nextCursor;
//         }
//         /* eslint-enable no-await-in-loop */
//         if (!cancelled) setProjects(all);

//       } catch (err) {
//         if (!cancelled) {
//           setError(err);
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     })();

//     return () => { cancelled = true; };
//   }, [client, pageSize, reload]);

//   const refetch = () => {
//     setReload(r => r + 1);
//   };

//   return {
//     loading,
//     error,
//     data: projects,
//     refetch,
//   };
// }


// projects offset
// This query fetches all projects with pagination support

const GET_ALL_PROJECTS_OFFSET = gql`
  query AllProjectsOffset($skip: Int!, $limit: Int!) {
    allProjectsOffset(skip: $skip, limit: $limit) {
      totalCount
      results {
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
  }
`;

export function useProjectsQuery(pageSize = 20) {
  const client = useApolloClient();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: head } = await client.query({
        context: { clientName: 'Projects' },
        query: GET_ALL_PROJECTS_OFFSET,
        variables: { skip: 0, limit: 1 },
      });
      if (cancelled) return;
      const total = head.allProjectsOffset.totalCount;
      const pages = Math.ceil(total / pageSize);
      
      const promises = Array.from({ length: pages }, (_, i) =>
        client.query({
          context: { clientName: 'Projects' },
          query: GET_ALL_PROJECTS_OFFSET,
          variables: { skip: i * pageSize, limit: pageSize },
        })
      );
      const results = (await Promise.all(promises))
        .flatMap(r => r.data.allProjectsOffset.results);

      if (!cancelled) setAll(results);
      setLoading(false);
    })();
    return () => { cancelled = true };
  }, [client, pageSize]);

  return { loading, data: all };
}