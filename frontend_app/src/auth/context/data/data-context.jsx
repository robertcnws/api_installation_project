// src/contexts/data-context.js
import React, { createContext, useContext, useMemo } from 'react';
import { useAuth, UserProvider } from './contexts/user-context';
import { useStages, StagesProvider } from './contexts/stage-context';
import { useTracks, TracksProvider } from './contexts/track-context';
import { useProjects, ProjectsProvider } from './contexts/project-context';
import { useServices, ServicesProvider } from './contexts/service-context';
import { useUserRoles, UserRolesProvider } from './contexts/user-role-context';
import { useStageTasks, StageTasksProvider } from './contexts/stage-task-context';
import { useIntegration, IntegrationProvider } from './contexts/integration-context';
import { useMeasurements, MeasurementsProvider } from './contexts/measurement-context';
import { useDefaultTasks, DefaultTasksProvider } from './contexts/default-task-context';
import { useNotifications, NotificationsProvider } from './contexts/notification-context';
import { useServiceIssues, ServiceIssuesProvider } from './contexts/service-issue-context';
import { useServiceStages, ServiceStagesProvider } from './contexts/service-stage-context';
import { useProjectReminders, ProjectRemindersProvider } from './contexts/project-reminder-context';
import { useProjectPermissions, ProjectPermissionsProvider } from './contexts/project-permission-context';
import { useServiceDefaultTasks, ServiceDefaultTasksProvider } from './contexts/service-default-task-context';
import { useDefaultGuideProducts, DefaultGuideProductsProvider } from './contexts/default-guide-product-context';
import { useDefaultMaterials, DefaultMaterialsProvider } from './contexts/default-material-context';

const DataContext = createContext();
export const useDataContext = () => useContext(DataContext);

const providers = [
  UserProvider,
  UserRolesProvider,
  NotificationsProvider,
  ProjectsProvider,
  ServicesProvider,
  MeasurementsProvider,
  StagesProvider,
  StageTasksProvider,
  ProjectPermissionsProvider,
  ProjectRemindersProvider,
  DefaultTasksProvider,
  DefaultGuideProductsProvider,
  DefaultMaterialsProvider,
  ServiceStagesProvider,
  ServiceDefaultTasksProvider,
  ServiceIssuesProvider,
  TracksProvider,
  IntegrationProvider,
];

function InnerDataProvider({ children }) {
  const { userLogged, loadedUsers, refetchUsers, loadingUsers, errorUsers } = useAuth();
  const { loadedUserRoles, refetchUserRoles, loadingUserRoles, errorUserRoles } = useUserRoles();
  const { loadedNotifications, refetchNotifications, loadingNotifications, errorNotifications } = useNotifications();
  const { loadedProjects, refetchProjects, loadingProjects, errorProjects } = useProjects();
  const { loadedServices, refetchServices, loadingServices, errorServices } = useServices();
  const { loadedMeasurements, refetchMeasurements, loadingMeasurements, errorMeasurements } = useMeasurements();
  const { loadedStages, refetchStages, loadingStages, errorStages } = useStages();
  const { loadedStagesTask, refetchStagesTask, loadingStagesTask, errorStagesTask } = useStageTasks();
  const { loadedProjectPermissions, refetchProjectPermissions, loadingProjectPermissions, errorProjectPermissions } = useProjectPermissions();
  const { loadedProjectReminders, refetchProjectReminders, loadingProjectReminders, errorProjectReminders } = useProjectReminders();
  const { loadedDefaultTasks, refetchDefaultTasks, loadingDefaultTasks, errorDefaultTasks } = useDefaultTasks();
  const { loadedDefaultGuideProducts, refetchDefaultGuideProducts, loadingDefaultGuideProducts, errorDefaultGuideProducts } = useDefaultGuideProducts();
  const { loadedDefaultMaterials, refetchDefaultMaterials, loadingDefaultMaterials, errorDefaultMaterials } = useDefaultMaterials();
  const { loadedServiceStages, refetchServiceStages, loadingServiceStages, errorServiceStages } = useServiceStages();
  const { loadedServiceDefaultTasks, refetchServiceDefaultTasks, loadingServiceDefaultTasks, errorServiceDefaultTasks } = useServiceDefaultTasks();
  const { loadedServiceIssues, refetchServiceIssues, loadingServiceIssues, errorServiceIssues } = useServiceIssues();
  const { loadedTracks, refetchTracks, loadingTracks, errorTracks } = useTracks();
  const { loadedPermissions, listPermissions, refetchPermissions, loadedSalesOrders, setLoadedSalesOrders, isLoadingSalesOrders } = useIntegration();

  const value = useMemo(() => ({
    userLogged, loadedUsers, refetchUsers, loadingUsers, errorUsers,
    loadedUserRoles, refetchUserRoles, loadingUserRoles, errorUserRoles,
    loadedNotifications, refetchNotifications, loadingNotifications, errorNotifications,
    loadedProjects, refetchProjects, loadingProjects, errorProjects,
    loadedServices, refetchServices, loadingServices, errorServices,
    loadedMeasurements, refetchMeasurements, loadingMeasurements, errorMeasurements,
    loadedStages, refetchStages, loadingStages, errorStages,
    loadedStagesTask, refetchStagesTask, loadingStagesTask, errorStagesTask,
    loadedProjectPermissions, refetchProjectPermissions, loadingProjectPermissions, errorProjectPermissions,
    loadedProjectReminders, refetchProjectReminders, loadingProjectReminders, errorProjectReminders,
    loadedDefaultTasks, refetchDefaultTasks, loadingDefaultTasks, errorDefaultTasks,
    loadedDefaultGuideProducts, refetchDefaultGuideProducts, loadingDefaultGuideProducts, errorDefaultGuideProducts,
    loadedDefaultMaterials, refetchDefaultMaterials, loadingDefaultMaterials, errorDefaultMaterials,
    loadedServiceStages, refetchServiceStages, loadingServiceStages, errorServiceStages,
    loadedServiceDefaultTasks, refetchServiceDefaultTasks, loadingServiceDefaultTasks, errorServiceDefaultTasks,
    loadedServiceIssues, refetchServiceIssues, loadingServiceIssues, errorServiceIssues,
    loadedTracks, refetchTracks, loadingTracks, errorTracks,
    loadedPermissions, listPermissions, refetchPermissions, loadedSalesOrders, setLoadedSalesOrders, isLoadingSalesOrders
  }), [
    userLogged, loadedUsers, loadingUsers, errorUsers,
    loadedUserRoles, loadingUserRoles, errorUserRoles,
    loadedNotifications, loadingNotifications, errorNotifications,
    loadedProjects, loadingProjects, errorProjects,
    loadedServices, loadingServices, errorServices,
    loadedMeasurements, loadingMeasurements, errorMeasurements,
    loadedStages, loadingStages, errorStages,
    loadedStagesTask, loadingStagesTask, errorStagesTask,
    loadedProjectPermissions, loadingProjectPermissions, errorProjectPermissions,
    loadedProjectReminders, loadingProjectReminders, errorProjectReminders,
    loadedDefaultTasks, loadingDefaultTasks, errorDefaultTasks,
    loadedDefaultGuideProducts, loadingDefaultGuideProducts, errorDefaultGuideProducts,
    loadedDefaultMaterials, loadingDefaultMaterials, errorDefaultMaterials,
    loadedServiceStages, loadingServiceStages, errorServiceStages,
    loadedServiceDefaultTasks, loadingServiceDefaultTasks, errorServiceDefaultTasks,
    loadedServiceIssues, loadingServiceIssues, errorServiceIssues,
    loadedTracks, loadingTracks, errorTracks,
    loadedPermissions, listPermissions, refetchPermissions, loadedSalesOrders, isLoadingSalesOrders,
    refetchDefaultGuideProducts, refetchDefaultMaterials, refetchDefaultTasks, refetchMeasurements, 
    refetchNotifications, refetchProjectPermissions, refetchProjectReminders, refetchProjects, 
    refetchServiceDefaultTasks, refetchServiceIssues, refetchServiceStages, refetchServices,
    refetchStages, refetchStagesTask, refetchTracks, refetchUserRoles, 
    refetchUsers, setLoadedSalesOrders
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function DataProvider({ children }) {
  return providers
    .reduceRight(
      (kids, Provider) => <Provider>{kids}</Provider>,
      <InnerDataProvider>{children}</InnerDataProvider>
    );
}

// import React, { useMemo, useContext, createContext } from 'react';

// import { useAuth, UserProvider } from './contexts/user-context';
// import { useStages, StagesProvider } from './contexts/stage-context';
// import { useTracks, TracksProvider } from './contexts/track-context';
// import { useProjects, ProjectsProvider } from './contexts/project-context';
// import { useServices, ServicesProvider } from './contexts/service-context';
// import { useUserRoles, UserRolesProvider } from './contexts/user-role-context';
// import { useStageTasks, StageTasksProvider } from './contexts/stage-task-context';
// import { useIntegration, IntegrationProvider } from './contexts/integration-context';
// import { useMeasurements, MeasurementsProvider } from './contexts/measurement-context';
// import { useDefaultTasks, DefaultTasksProvider } from './contexts/default-task-context';
// import { useNotifications, NotificationsProvider } from './contexts/notification-context';
// import { useServiceIssues, ServiceIssuesProvider } from './contexts/service-issue-context';
// import { useServiceStages, ServiceStagesProvider } from './contexts/service-stage-context';
// import { useProjectReminders, ProjectRemindersProvider } from './contexts/project-reminder-context';
// import { useProjectPermissions, ProjectPermissionsProvider } from './contexts/project-permission-context';
// import { useServiceDefaultTasks, ServiceDefaultTasksProvider } from './contexts/service-default-task-context';
// import { useDefaultGuideProducts, DefaultGuideProductsProvider } from './contexts/default-guide-product-context';
// import { useDefaultMaterials, DefaultMaterialsProvider } from './contexts/default-material-context';

// const DataContext = createContext();
// export const useDataContext = () => useContext(DataContext);
// export function DataProvider({ children }) {
//   return (
//     <UserProvider>
//       <UserRolesProvider>
//         <NotificationsProvider>
//           <ProjectsProvider>
//             <ServicesProvider>
//               <MeasurementsProvider>
//                 <StagesProvider>
//                   <StageTasksProvider>
//                     <ProjectPermissionsProvider>
//                       <ProjectRemindersProvider>
//                         <DefaultTasksProvider>
//                           <DefaultGuideProductsProvider>
//                             <DefaultMaterialsProvider>
//                               <ServiceStagesProvider>
//                                 <ServiceDefaultTasksProvider>
//                                   <ServiceIssuesProvider>
//                                     <TracksProvider>
//                                       <IntegrationProvider>
//                                         <CombineProviders>{children}</CombineProviders>
//                                       </IntegrationProvider>
//                                     </TracksProvider>
//                                   </ServiceIssuesProvider>
//                                 </ServiceDefaultTasksProvider>
//                               </ServiceStagesProvider>
//                             </DefaultMaterialsProvider>
//                           </DefaultGuideProductsProvider>
//                         </DefaultTasksProvider>
//                       </ProjectRemindersProvider>
//                     </ProjectPermissionsProvider>
//                   </StageTasksProvider>
//                 </StagesProvider> 
//               </MeasurementsProvider>
//             </ServicesProvider>
//           </ProjectsProvider>
//         </NotificationsProvider>
//       </UserRolesProvider>
//     </UserProvider>
//   );
// }

// function CombineProviders({ children }) {
//   const { userLogged, loadedUsers, refetchUsers, loadingUsers, errorUsers } = useAuth();
//   const { loadedUserRoles, refetchUserRoles, loadingUserRoles, errorUserRoles } = useUserRoles();
//   const { loadedNotifications, refetchNotifications, loadingNotifications, errorNotifications } = useNotifications();
//   const { loadedProjects, refetchProjects, loadingProjects, errorProjects } = useProjects();
//   const { loadedServices, refetchServices, loadingServices, errorServices } = useServices();
//   const { loadedPermissions, listPermissions, refetchPermissions, loadedSalesOrders, setLoadedSalesOrders, isLoadingSalesOrders } = useIntegration();
//   const { loadedMeasurements, refetchMeasurements, loadingMeasurements, errorMeasurements } = useMeasurements();
//   const { loadedProjectPermissions, loadingProjectPermissions, errorProjectPermissions } = useProjectPermissions();
//   const { loadedTracks, refetchTracks, loadingTracks, errorTracks } = useTracks();
//   const { loadedStages, refetchStages, loadingStages, errorStages } = useStages();
//   const { loadedStagesTask, refetchStagesTask, loadingStagesTask, errorStagesTask } = useStageTasks();
//   const { loadedProjectReminders, refetchProjectReminders } = useProjectReminders();
//   const { loadedDefaultTasks, refetchDefaultTasks, loadingDefaultTasks, errorDefaultTasks } = useDefaultTasks();
//   const { loadedDefaultGuideProducts, refetchDefaultGuideProducts, loadingDefaultGuideProducts, errorDefaultGuideProducts } = useDefaultGuideProducts();
//   const { loadedServiceStages, refetchServiceStages } = useServiceStages();
//   const { loadedServiceDefaultTasks, refetchServiceDefaultTasks } = useServiceDefaultTasks();
//   const { loadedServiceIssues, refetchServiceIssues } = useServiceIssues();
//   const { loadedDefaultMaterials, refetchDefaultMaterials, loadingDefaultMaterials, errorDefaultMaterials } = useDefaultMaterials();

//   // console.log('loadedPermissions', loadedPermissions);
  
//   const value = useMemo(() => ({
//     userLogged,
//     loadedUsers,
//     refetchUsers,
//     loadingUsers,
//     errorUsers,
//     loadedProjects,
//     refetchProjects,
//     loadingProjects,
//     errorProjects,
//     loadedServices,
//     refetchServices,
//     loadingServices,
//     errorServices,
//     loadedPermissions,
//     refetchPermissions,
//     loadedSalesOrders,
//     setLoadedSalesOrders,
//     loadedStages,
//     refetchStages,
//     loadingStages,
//     errorStages,
//     loadedProjectReminders,
//     refetchProjectReminders,
//     loadedServiceIssues,
//     refetchServiceIssues,
//     loadedNotifications,
//     refetchNotifications,
//     loadingNotifications,
//     errorNotifications,
//     loadedProjectPermissions,
//     loadingProjectPermissions,
//     errorProjectPermissions,
//     loadedServiceStages,
//     refetchServiceStages,
//     loadedServiceDefaultTasks,
//     refetchServiceDefaultTasks,
//     loadedDefaultGuideProducts,
//     refetchDefaultGuideProducts,
//     loadingDefaultGuideProducts,
//     errorDefaultGuideProducts,
//     loadedStagesTask,
//     refetchStagesTask,
//     loadingStagesTask,
//     errorStagesTask,
//     loadedDefaultTasks,
//     refetchDefaultTasks,
//     loadingDefaultTasks,
//     errorDefaultTasks,
//     loadedUserRoles,
//     refetchUserRoles,
//     loadingUserRoles,
//     errorUserRoles,
//     loadedTracks,
//     refetchTracks,
//     loadingTracks,
//     errorTracks,
//     loadedMeasurements,
//     refetchMeasurements,
//     loadingMeasurements,
//     errorMeasurements,
//     listPermissions,
//     isLoadingSalesOrders,
//     loadedDefaultMaterials,
//     refetchDefaultMaterials,
//     loadingDefaultMaterials,
//     errorDefaultMaterials,
//   }), [
//     userLogged,
//     loadedUsers,
//     refetchUsers,
//     loadingUsers,
//     errorUsers,
//     loadedProjects,
//     refetchProjects,
//     loadingProjects,
//     errorProjects,
//     loadedServices,
//     refetchServices,
//     loadingServices,
//     errorServices,
//     loadedPermissions,
//     refetchPermissions,
//     loadedSalesOrders,
//     setLoadedSalesOrders,
//     loadedStages,
//     refetchStages,
//     loadingStages,
//     errorStages,
//     loadedProjectReminders,
//     refetchProjectReminders,
//     loadedServiceIssues,
//     refetchServiceIssues,
//     loadedNotifications,
//     refetchNotifications,
//     loadingNotifications,
//     errorNotifications,
//     loadedProjectPermissions,
//     loadingProjectPermissions,
//     errorProjectPermissions,
//     loadedServiceStages,
//     refetchServiceStages,
//     loadedServiceDefaultTasks,
//     refetchServiceDefaultTasks,
//     loadedDefaultGuideProducts,
//     refetchDefaultGuideProducts,
//     loadingDefaultGuideProducts,
//     errorDefaultGuideProducts,
//     loadedStagesTask,
//     refetchStagesTask,
//     loadingStagesTask,
//     errorStagesTask,
//     loadedDefaultTasks,
//     refetchDefaultTasks,
//     loadingDefaultTasks,
//     errorDefaultTasks,
//     loadedUserRoles,
//     refetchUserRoles,
//     loadingUserRoles,
//     errorUserRoles,
//     loadedTracks,
//     refetchTracks,
//     loadingTracks,
//     errorTracks,
//     loadedMeasurements,
//     refetchMeasurements,
//     loadingMeasurements,
//     errorMeasurements,
//     listPermissions,
//     isLoadingSalesOrders,
//     loadedDefaultMaterials,
//     refetchDefaultMaterials,
//     loadingDefaultMaterials,
//     errorDefaultMaterials,
//   ]);

//   return <DataContext.Provider value={value}>{children}</DataContext.Provider>;

// }