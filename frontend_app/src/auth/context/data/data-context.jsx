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
import { useDefaultMaterials, DefaultMaterialsProvider } from './contexts/default-material-context';
import { useProjectPermissions, ProjectPermissionsProvider } from './contexts/project-permission-context';
import { useServiceDefaultTasks, ServiceDefaultTasksProvider } from './contexts/service-default-task-context';
import { useDefaultGuideProducts, DefaultGuideProductsProvider } from './contexts/default-guide-product-context';
import { useCalendarNotes, CalendarNotesProvider } from './contexts/project-calendar-notes-context';
import { useProjectInstallationCrews, ProjectInstallationCrewProvider } from './contexts/project-installation-crew-context';

const DataContext = createContext();
export const useDataContext = () => useContext(DataContext);
export function DataProvider({ children }) {
  return (
    <UserProvider>
      <UserRolesProvider>
        <ProjectInstallationCrewProvider>
        <CalendarNotesProvider>
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
          </CalendarNotesProvider>
          </ProjectInstallationCrewProvider>
      </UserRolesProvider>
    </UserProvider>
  );
}

function CombineProviders({ children }) {
  const { 
    userLogged, 
    loadedUsers, 
    refetchUsers, 
    loadingUsers, 
    errorUsers, 
    loadedSuperadminUsers 
  } = useAuth();

  const { 
    loadedUserRoles, 
    refetchUserRoles, 
    loadingUserRoles, 
    errorUserRoles 
  } = useUserRoles();

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
  const { 
    loadedCalendarNotes, 
    refetchCalendarNotes, 
    loadingCalendarNotes, 
    errorCalendarNotes 
  } = useCalendarNotes();
  const { loadedDefaultMaterials, refetchDefaultMaterials, loadingDefaultMaterials, errorDefaultMaterials } = useDefaultMaterials();

  const {
    projectInstallationCrews: loadedInstallationCrews,
    refetchProjectInstallationCrews: refetchInstallationCrews,
    loadingProjectInstallationCrews: loadingInstallationCrews,
    errorProjectInstallationCrews: errorInstallationCrews
  } = useProjectInstallationCrews();

  // console.log('loadedPermissions', loadedPermissions);

  const [timerInstallation, setTimerInstallation] = React.useState(null);
  
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
    loadedCalendarNotes, 
    refetchCalendarNotes, 
    loadingCalendarNotes, 
    errorCalendarNotes,
    loadedInstallationCrews,
    refetchInstallationCrews,
    loadingInstallationCrews,
    errorInstallationCrews,
    timerInstallation,
    setTimerInstallation 
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
    loadedCalendarNotes, 
    refetchCalendarNotes, 
    loadingCalendarNotes, 
    errorCalendarNotes,
    loadedInstallationCrews,
    refetchInstallationCrews,
    loadingInstallationCrews,
    errorInstallationCrews,
    timerInstallation,
    setTimerInstallation 
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;

}