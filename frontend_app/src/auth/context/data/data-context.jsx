import React, { useMemo, useContext, createContext } from 'react';

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
export function DataProvider({ children }) {
  return (
    <UserProvider>
      <UserRolesProvider>
          <ProjectsProvider>
            <ServicesProvider>
              <MeasurementsProvider>
                <NotificationsProvider>
                  <StagesProvider>
                    <StageTasksProvider>
                      <ProjectPermissionsProvider>
                        <ProjectRemindersProvider>
                          <DefaultTasksProvider>
                            <DefaultGuideProductsProvider>
                              <DefaultMaterialsProvider>
                                <ServiceStagesProvider>
                                  <ServiceDefaultTasksProvider>
                                    <ServiceIssuesProvider>
                                      <TracksProvider>
                                        <IntegrationProvider>
                                          <CombineProviders>{children}</CombineProviders>
                                        </IntegrationProvider>
                                      </TracksProvider>
                                    </ServiceIssuesProvider>
                                  </ServiceDefaultTasksProvider>
                                </ServiceStagesProvider>
                              </DefaultMaterialsProvider>
                            </DefaultGuideProductsProvider>
                          </DefaultTasksProvider>
                        </ProjectRemindersProvider>
                      </ProjectPermissionsProvider>
                    </StageTasksProvider>
                  </StagesProvider> 
                </NotificationsProvider>
              </MeasurementsProvider>
            </ServicesProvider>
          </ProjectsProvider>
      </UserRolesProvider>
    </UserProvider>
  );
}

function CombineProviders({ children }) {
  const { userLogged, loadedUsers, refetchUsers, loadingUsers, errorUsers, loadedSuperadminUsers } = useAuth();
  const { loadedUserRoles, refetchUserRoles, loadingUserRoles, errorUserRoles } = useUserRoles();
  const { loadedNotifications, refetchNotifications, loadingNotifications, errorNotifications } = useNotifications();
  const { loadedProjects, refetchProjects, loadingProjects, errorProjects, hasMoreProjects, loadMoreProjects } = useProjects();
  const { loadedServices, refetchServices, loadingServices, errorServices } = useServices();
  const { loadedPermissions, listPermissions, refetchPermissions, loadedSalesOrders, setLoadedSalesOrders, isLoadingSalesOrders } = useIntegration();
  const { loadedMeasurements, refetchMeasurements, loadingMeasurements, errorMeasurements } = useMeasurements();
  const { loadedProjectPermissions, loadingProjectPermissions, errorProjectPermissions } = useProjectPermissions();
  const { loadedTracks, refetchTracks, loadingTracks, errorTracks } = useTracks();
  const { loadedStages, refetchStages, loadingStages, errorStages } = useStages();
  const { loadedStagesTask, refetchStagesTask, loadingStagesTask, errorStagesTask } = useStageTasks();
  const { loadedProjectReminders, refetchProjectReminders } = useProjectReminders();
  const { loadedDefaultTasks, refetchDefaultTasks, loadingDefaultTasks, errorDefaultTasks } = useDefaultTasks();
  const { loadedDefaultGuideProducts, refetchDefaultGuideProducts, loadingDefaultGuideProducts, errorDefaultGuideProducts } = useDefaultGuideProducts();
  const { loadedServiceStages, refetchServiceStages } = useServiceStages();
  const { loadedServiceDefaultTasks, refetchServiceDefaultTasks } = useServiceDefaultTasks();
  const { loadedServiceIssues, refetchServiceIssues } = useServiceIssues();
  const { loadedDefaultMaterials, refetchDefaultMaterials, loadingDefaultMaterials, errorDefaultMaterials } = useDefaultMaterials();

  // console.log('loadedPermissions', loadedPermissions);
  
  const value = useMemo(() => ({
    userLogged,
    loadedUsers,
    refetchUsers,
    loadingUsers,
    errorUsers,
    loadedSuperadminUsers,
    loadedProjects,
    refetchProjects,
    loadingProjects,
    errorProjects,
    hasMoreProjects,
    loadMoreProjects,
    loadedServices,
    refetchServices,
    loadingServices,
    errorServices,
    loadedPermissions,
    refetchPermissions,
    loadedSalesOrders,
    setLoadedSalesOrders,
    loadedStages,
    refetchStages,
    loadingStages,
    errorStages,
    loadedProjectReminders,
    refetchProjectReminders,
    loadedServiceIssues,
    refetchServiceIssues,
    loadedNotifications,
    refetchNotifications,
    loadingNotifications,
    errorNotifications,
    loadedProjectPermissions,
    loadingProjectPermissions,
    errorProjectPermissions,
    loadedServiceStages,
    refetchServiceStages,
    loadedServiceDefaultTasks,
    refetchServiceDefaultTasks,
    loadedDefaultGuideProducts,
    refetchDefaultGuideProducts,
    loadingDefaultGuideProducts,
    errorDefaultGuideProducts,
    loadedStagesTask,
    refetchStagesTask,
    loadingStagesTask,
    errorStagesTask,
    loadedDefaultTasks,
    refetchDefaultTasks,
    loadingDefaultTasks,
    errorDefaultTasks,
    loadedUserRoles,
    refetchUserRoles,
    loadingUserRoles,
    errorUserRoles,
    loadedTracks,
    refetchTracks,
    loadingTracks,
    errorTracks,
    loadedMeasurements,
    refetchMeasurements,
    loadingMeasurements,
    errorMeasurements,
    listPermissions,
    isLoadingSalesOrders,
    loadedDefaultMaterials,
    refetchDefaultMaterials,
    loadingDefaultMaterials,
    errorDefaultMaterials,
  }), [
    userLogged,
    loadedUsers,
    refetchUsers,
    loadingUsers,
    errorUsers,
    loadedSuperadminUsers,
    loadedProjects,
    refetchProjects,
    loadingProjects,
    errorProjects,
    hasMoreProjects,
    loadMoreProjects,
    loadedServices,
    refetchServices,
    loadingServices,
    errorServices,
    loadedPermissions,
    refetchPermissions,
    loadedSalesOrders,
    setLoadedSalesOrders,
    loadedStages,
    refetchStages,
    loadingStages,
    errorStages,
    loadedProjectReminders,
    refetchProjectReminders,
    loadedServiceIssues,
    refetchServiceIssues,
    loadedNotifications,
    refetchNotifications,
    loadingNotifications,
    errorNotifications,
    loadedProjectPermissions,
    loadingProjectPermissions,
    errorProjectPermissions,
    loadedServiceStages,
    refetchServiceStages,
    loadedServiceDefaultTasks,
    refetchServiceDefaultTasks,
    loadedDefaultGuideProducts,
    refetchDefaultGuideProducts,
    loadingDefaultGuideProducts,
    errorDefaultGuideProducts,
    loadedStagesTask,
    refetchStagesTask,
    loadingStagesTask,
    errorStagesTask,
    loadedDefaultTasks,
    refetchDefaultTasks,
    loadingDefaultTasks,
    errorDefaultTasks,
    loadedUserRoles,
    refetchUserRoles,
    loadingUserRoles,
    errorUserRoles,
    loadedTracks,
    refetchTracks,
    loadingTracks,
    errorTracks,
    loadedMeasurements,
    refetchMeasurements,
    loadingMeasurements,
    errorMeasurements,
    listPermissions,
    isLoadingSalesOrders,
    loadedDefaultMaterials,
    refetchDefaultMaterials,
    loadingDefaultMaterials,
    errorDefaultMaterials,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;

}



// // src/contexts/DataContext.jsx
// import axios from 'axios';
// import dayjs from 'dayjs';
// import { useQuery } from '@tanstack/react-query';
// import React, { useMemo, useState, useEffect, useContext, createContext } from 'react';

// import { totalPercentageProjectStage } from 'src/utils/project-tasks-utils';
// import { isInstaller, isSuperAdmin, isOfficeStaff, isAdministrator, isProjectManager, listRolesAndSubroles } from 'src/utils/check-permissions';

// import { _mock } from 'src/_mock/_mock';
// import { CONFIG } from 'src/config-global';
// import { useUsersQuery } from 'src/_mock/__users';
// import { useStagesQuery } from 'src/_mock/__stages';
// import { useProjectsQuery } from 'src/_mock/__projects';
// import { useTrackingQuery } from 'src/_mock/__tracking';
// import { useServicesQuery } from 'src/_mock/__services';
// import { useUserRolesQuery } from 'src/_mock/__user_roles';
// import { useStagesTaskQuery } from 'src/_mock/__stages_task';
// import { useMeasurementsQuery } from 'src/_mock/__measurements';
// import { useDefaultTasksQuery } from 'src/_mock/__default_tasks';
// import { useServiceIssuesQuery } from 'src/_mock/__service_issues';
// import { useServiceStagesQuery } from 'src/_mock/__service_stages';
// import { useProjectRemindersQuery } from 'src/_mock/__project_reminders';
// import { useProjectPermissionsQuery } from 'src/_mock/__project_permissions';
// import { useServiceDefaultTasksQuery } from 'src/_mock/__service_default_tasks';
// import { useNotificationsQuery } from 'src/_mock/__projects_notifications_users';
// import { useDefaultGuideProductsQuery } from 'src/_mock/__default_guide_products';

// const DataContext = createContext();
// export const useDataContext = () => useContext(DataContext);

// export const DataProvider = ({ children }) => {
//   const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

//   const {
//     data: projectReminders,
//     refetch: refetchProjectReminders
//   } = useProjectRemindersQuery(userLogged?.data.username);
//   const {
//     data: measurements,
//     loading: loadingMeasurements,
//     error: errorMeasurements,
//     refetch: refetchMeasurements
//   } = useMeasurementsQuery();
//   const {
//     data: projects,
//     loading: loadingProjects,
//     error: errorProjects,
//     refetch: refetchProjects
//   } = useProjectsQuery();
//   const {
//     data: services,
//     loading: loadingServices,
//     error: errorServices,
//     refetch: refetchServices
//   } = useServicesQuery();
//   const {
//     data: serviceIssues,
//     refetch: refetchServiceIssues
//   } = useServiceIssuesQuery();
//   const {
//     data: users,
//     loading: loadingUsers,
//     error: errorUsers,
//     refetch: refetchUsers
//   } = useUsersQuery();
//   const {
//     data: notifications,
//     loading: loadingNotifications,
//     error: errorNotifications,
//     refetch: refetchNotifications
//   } = useNotificationsQuery(null, userLogged?.data.username, 1, 100);
//   const {
//     data: projectPermissions,
//     loading: loadingProjectPermissions,
//     error: errorProjectPermission
//   } = useProjectPermissionsQuery();
//   const {
//     data: stages,
//     loading: loadingStages,
//     error: errorStages,
//     refetch: refetchStages
//   } = useStagesQuery();
//   const {
//     data: serviceStages,
//     refetch: refetchServiceStages
//   } = useServiceStagesQuery();
//   const {
//     data: serviceDefaultTasks,
//     refetch: refetchServiceDefaultTasks
//   } = useServiceDefaultTasksQuery();
//   const {
//     data: defaultGuideProducts,
//     loading: loadingDefaultGuideProducts,
//     error: errorDefaultGuideProducts,
//     refetch: refetchDefaultGuideProducts
//   } = useDefaultGuideProductsQuery();
//   const {
//     data: stagesTask,
//     loading: loadingStagesTask,
//     error: errorStagesTask,
//     refetch: refetchStagesTask
//   } = useStagesTaskQuery();
//   const {
//     data: defaultTasks,
//     loading: loadingDefaultTasks,
//     error: errorDefaultTasks,
//     refetch: refetchDefaultTasks
//   } = useDefaultTasksQuery();
//   const {
//     data: userRoles,
//     loading: loadingUserRoles,
//     error: errorUserRoles,
//     refetch: refetchUserRoles
//   } = useUserRolesQuery(['Superadmin']);
//   const {
//     data: tracks,
//     loading: loadingTracks,
//     error: errorTracks,
//     refetch: refetchTracks
//   } = useTrackingQuery();

//   const loading = loadingProjects || loadingNotifications || loadingUsers || loadingProjectPermissions || loadingServices || loadingMeasurements;
//   const error = errorProjects || errorNotifications || errorUsers || errorProjectPermission || errorServices || errorMeasurements;

//   const _avatarUsers = useMemo(() => users.map((user, index) => ({
//     ...user,
//     name: `${user.firstName} ${user.lastName}`,
//     avatarUrl: user.avatarUrl ? user.avatarUrl : _mock.image.avatar(index),
//   })), [users]);

//   if (userLogged) {
//     userLogged.data.avatarUrl = _avatarUsers.find((user) => user.username === userLogged.data.username)?.avatarUrl;
//     userLogged.data.name = _avatarUsers.find((user) => user.username === userLogged.data.username)?.name;
//   }

//   localStorage.setItem('userLogged', JSON.stringify(userLogged));

//   const typedProjects = useMemo(() => projects.map((project) => ({
//     ...project,
//     type: 'folder',
//     userReporter: _avatarUsers.find((user) => user.username === project.userReporter.username),
//     usersAssignees: project.usersAssignees.map((user) => ({
//       ...user,
//       avatarUrl: _avatarUsers.find((u) => u.username === user.username)?.avatarUrl,
//     })),
//   })), [projects, _avatarUsers]);

//   const sortedProjects = useMemo(() => typedProjects.sort((a, b) => {
//     if (a.startDate && b.startDate) {
//       return dayjs(a.startDate).diff(dayjs(b.startDate));
//     }
//     if (!a.startDate && b.startDate) {
//       return 1;
//     }
//     if (a.startDate && !b.startDate) {
//       return -1;
//     }
//     return 0;
//   }), [typedProjects]);

//   let finalProjects = useMemo(() => sortedProjects, [sortedProjects]);
//   if (!listRolesAndSubroles(userLogged?.data?.user_role?.name)
//     .some(elem => [CONFIG.roles.financialStaff, CONFIG.roles.warehouseStaff].includes(elem))) {
//     finalProjects = sortedProjects.filter((project) =>
//       project.usersAssignees.some((user) => user.username === userLogged?.data.username) ||
//       project.userManager.username === userLogged?.data.username
//     );
//     if (userLogged?.data.user_role.name.toLowerCase().indexOf(CONFIG.roles.installer.toLowerCase()) !== -1) {
//       finalProjects = sortedProjects.filter((project) =>
//       (
//         (
//           project.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1 &&
//           project.usersAssignees.some((user) => user.username === userLogged?.data.username)
//         ) ||
//         (
//           project.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 &&
//           totalPercentageProjectStage(project, CONFIG.stages.coordination, CONFIG) >= 50 && 
//           project.usersAssignees.some((user) => user.username === userLogged?.data.username)
//         )
//       )
//       );
//     }
//   }

//   const finalUsers = useMemo(() => {
//     if (!listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) {
//       if (isProjectManager(userLogged?.data?.user_role?.name)) {
//         return _avatarUsers.filter(
//           (user) =>
//             isInstaller(user.userRole.name) || isOfficeStaff(user.userRole.name) || isProjectManager(user.userRole.name)
//         );
//       }
//       return _avatarUsers.filter(
//         (user) => !isSuperAdmin(user.userRole.name)
//       );
//     }
//     if (isAdministrator(userLogged?.data?.user_role?.name)) {
//       return _avatarUsers.filter(
//         (user) => !isSuperAdmin(user.userRole.name)
//       );
//     }
//     return _avatarUsers.filter(
//       (user) => !isSuperAdmin(user.userRole.name)
//     );
//   }, [_avatarUsers, userLogged]);


//   const finalUserRoles = useMemo(() => {
//     if (!isSuperAdmin(userLogged?.data?.user_role?.name)) {
//       const possibleRoles = listRolesAndSubroles(userLogged?.data?.user_role?.name).filter(
//         (role) => role !== userLogged?.data?.user_role?.name
//       );
//       return userRoles.filter((role) => possibleRoles.includes(role.name));
//     }
//     return userRoles;
//   }, [userRoles, userLogged]);


//   const typedServices = useMemo(() => services.map((service) => ({
//     ...service,
//     userReporter: _avatarUsers.find((user) => user.username === service.userReporter.username),
//     usersAssignees: service.usersAssignees.map((user) => ({
//       ...user,
//       avatarUrl: user.avatarUrl || user.avatar_url || _avatarUsers.find((u) => u.username === user.username)?.avatarUrl,
//     })),
//   })), [services, _avatarUsers]);


//   const sortedServices = useMemo(() => typedServices?.sort((a, b) => {
//     if (a.startDate && b.startDate) {
//       return dayjs(a.startDate).diff(dayjs(b.startDate));
//     }
//     if (!a.startDate && b.startDate) {
//       return 1;
//     }
//     if (a.startDate && !b.startDate) {
//       return -1;
//     }
//     return 0;
//   }), [typedServices]);
  

//   const loadedNotifications = useMemo(() => notifications || null, [notifications]);
//   const loadedProjects = useMemo(() => finalProjects || [], [finalProjects]);
//   const loadedUsers = useMemo(() => finalUsers || [], [finalUsers]);
//   const loadedProjectPermissions = useMemo(() => projectPermissions || [], [projectPermissions]);
//   const loadedUserRoles = useMemo(() => finalUserRoles || [], [finalUserRoles]);
//   const loadedServices = useMemo(() => sortedServices || [], [sortedServices]);
//   const loadedServiceIssues = useMemo(() => serviceIssues || [], [serviceIssues]);
//   const loadedServiceStages = useMemo(() => serviceStages || [], [serviceStages]);
//   const loadedServiceDefaultTasks = useMemo(() => serviceDefaultTasks || [], [serviceDefaultTasks]);
//   const loadedProjectReminders = useMemo(() => projectReminders || [], [projectReminders]);
//   const loadedMeasurements = useMemo(() => measurements || [], [measurements]);


//   const orderedDefaultGuideProducts = useMemo(() => {
//     const sortedDefaultGuideProducts = [...defaultGuideProducts].sort((a, b) => a.order - b.order);
//     return sortedDefaultGuideProducts;
//   }, [defaultGuideProducts]);

//   const loadedDefaultGuideProducts = useMemo(() => orderedDefaultGuideProducts || [], [orderedDefaultGuideProducts]);

//   const orderedStages = useMemo(() => {
//     const sortedStages = [...stages].sort((a, b) => a.order - b.order);
//     return sortedStages;
//   }, [stages]);

//   const loadedStages = useMemo(() => orderedStages || [], [orderedStages]);

//   const orderedStagesTask = useMemo(() => {
//     const sortedStagesTask = [...stagesTask].sort((a, b) => a.order - b.order);
//     return sortedStagesTask;
//   }, [stagesTask]);

//   const loadedStagesTask = useMemo(() => orderedStagesTask || [], [orderedStagesTask]);

//   const orderedDefaultTasks = useMemo(() => {
//     const sortedDefaultTasks = [...defaultTasks].sort((a, b) => a.order - b.order);
//     const newDefaultTasks = sortedDefaultTasks.map((task) => ({
//       ...task,
//       number: `T-${String(task.order).padStart(3, "0")}`,
//     }));
//     return newDefaultTasks;
//   }, [defaultTasks]);

//   const loadedDefaultTasks = useMemo(() => orderedDefaultTasks || [], [orderedDefaultTasks]);

//   const not_sales_order_ids = useMemo(
//     () => loadedProjects?.map((project) => project.salesOrder.salesorder_id).join(','),
//     [loadedProjects]
//   );

//   const loadedTracks = useMemo(() => tracks.filter((track) => track.action.toLowerCase().indexOf('login') === -1) || [], [tracks]);

//   const { data: permissions, error: errorPermissions, isLoading: isLoadingPermissions, refetch: refetchPermissions } = useQuery({
//     queryKey: ['permissions'],
//     queryFn: () =>
//       axios
//         .get(`${CONFIG.apiUrl}/integration/list_users_permissions/`, {
//           params: { username: userLogged?.data.username },
//         })
//         .then((res) => res.data),
//     refetchOnWindowFocus: false,
//   });

//   const salesOrdersQueryKey = !not_sales_order_ids ? ['salesOrders'] : ['salesOrders', not_sales_order_ids];
//   const salesOrdersParams = !not_sales_order_ids ? {} : { not_sales_order_ids };
//   const salesOrdersEnabled = !not_sales_order_ids ? true : !!not_sales_order_ids;

//   const { data: salesOrders, error: errorSalesOrders, isLoading: isLoadingSalesOrders, refetch: refetchSalesOrders } = useQuery({
//     queryKey: salesOrdersQueryKey,
//     queryFn: async () => {
//       try {
//         const res = await axios.get(`${CONFIG.apiUrl}/integration/list_sales_orders/`, {
//           params: salesOrdersParams,
//           headers: {
//             'Content-Type': 'application/json',
//             'Accept': 'application/json',
//           }
//         });
//         return res.data;
//       } catch (err) {
//         return console.error(err);
//       }
//     },
//     refetchOnWindowFocus: false,
//     enabled: salesOrdersEnabled,
//   });

//   const [loadedPermissions, setLoadedPermissions] = useState(permissions);
//   const [loadedSalesOrders, setLoadedSalesOrders] = useState(salesOrders);

//   useEffect(() => {
//     setLoadedPermissions(permissions);
//   }, [permissions]);

//   useEffect(() => {
//     if (salesOrders) {
//       const sortedSalesOrdersResults = [...salesOrders.results].sort(
//         (a, b) => new Date(b.date) - new Date(a.date)
//       );
//       const uniqueMap = new Map();
//       sortedSalesOrdersResults.forEach(order => {
//         uniqueMap.set(order.salesorder_id, order);
//       });
//       const uniqueSalesOrdersArray = Array.from(uniqueMap.values());
//       const sortedSalesOrders = { ...salesOrders, results: uniqueSalesOrdersArray };
//       setLoadedSalesOrders(sortedSalesOrders);
//     }
//   }, [salesOrders]);


//   const listPermissions = useMemo(() => {
//     if (loadedPermissions && userLogged) {
//       const results = loadedPermissions?.results;
//       const permits = results?.filter((item) => item.username === userLogged?.data.username);
//       return permits[0].permissions;
//     }
//     return [];
//   }, [loadedPermissions, userLogged]);



//   const value = useMemo(
//     () => ({
//       loadedPermissions,
//       refetchPermissions,
//       loadedSalesOrders,
//       refetchSalesOrders,
//       loadedProjects,
//       refetchProjects,
//       loadingProjects,
//       loadedNotifications,
//       refetchNotifications,
//       loadedUsers,
//       refetchUsers,
//       loadedServices,
//       refetchServices,
//       loadedServiceIssues,
//       refetchServiceIssues,
//       loadedServiceStages,
//       refetchServiceStages,
//       loadedServiceDefaultTasks,
//       refetchServiceDefaultTasks,
//       loadedProjectPermissions,
//       loadedStages,
//       loadedStagesTask,
//       loadedDefaultTasks,
//       loadedDefaultGuideProducts,
//       loadedUserRoles,
//       loadedTracks,
//       refetchTracks,
//       loading,
//       error,
//       errorStages,
//       loadingStages,
//       refetchStages,
//       errorStagesTask,
//       loadingStagesTask,
//       refetchStagesTask,
//       errorDefaultGuideProducts,
//       loadingDefaultGuideProducts,
//       refetchDefaultGuideProducts,
//       loadingUserRoles,
//       loadingTracks,
//       errorTracks,
//       errorUserRoles,
//       refetchUserRoles,
//       errorDefaultTasks,
//       loadingDefaultTasks,
//       refetchDefaultTasks,
//       setLoadedPermissions,
//       setLoadedSalesOrders,
//       listPermissions,
//       loadedProjectReminders,
//       refetchProjectReminders,
//       loadedMeasurements,
//       refetchMeasurements,
//     }),
//     [
//       loadedPermissions,
//       refetchPermissions,
//       loadedSalesOrders,
//       refetchSalesOrders,
//       loadedProjects,
//       refetchProjects,
//       loadingProjects,
//       loadedNotifications,
//       refetchNotifications,
//       loadedUsers,
//       refetchUsers,
//       loadedServices,
//       refetchServices,
//       loadedServiceIssues,
//       refetchServiceIssues,
//       loadedServiceStages,
//       refetchServiceStages,
//       loadedServiceDefaultTasks,
//       refetchServiceDefaultTasks,
//       loadedProjectPermissions,
//       loadedStages,
//       loadedStagesTask,
//       loadedDefaultTasks,
//       loadedDefaultGuideProducts,
//       loadedUserRoles,
//       loadedTracks,
//       refetchTracks,
//       loading,
//       error,
//       errorStages,
//       loadingStages,
//       refetchStages,
//       errorStagesTask,
//       loadingStagesTask,
//       refetchStagesTask,
//       errorDefaultGuideProducts,
//       loadingDefaultGuideProducts,
//       refetchDefaultGuideProducts,
//       loadingUserRoles,
//       errorUserRoles,
//       loadingTracks,
//       errorTracks,
//       refetchUserRoles,
//       errorDefaultTasks,
//       loadingDefaultTasks,
//       refetchDefaultTasks,
//       listPermissions,
//       loadedProjectReminders,
//       refetchProjectReminders,
//       loadedMeasurements,
//       refetchMeasurements,
//     ]
//   );

//   return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
// };
