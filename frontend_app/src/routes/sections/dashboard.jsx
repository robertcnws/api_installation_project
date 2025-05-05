import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { verifyPermissions, listRolesAndSubroles, belongsToWorkingStaff } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('src/pages/dashboard'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
// User
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
// Sales Orders
const SalesOrderListPage = lazy(() => import('src/pages/dashboard/sales-order/list'));
const SalesOrderDetailsPage = lazy(() => import('src/pages/dashboard/sales-order/details'));
// Projects
const ProjectPage = lazy(() => import('src/pages/dashboard/project'));
const ProjectEditPage = lazy(() => import('src/pages/dashboard/project/edit'));
const ProjectDetailsPage = lazy(() => import('src/pages/dashboard/project/details'));
const KanbanPage = lazy(() => import('src/pages/dashboard/project/kanban-id'));
// Stages
const StageListPage = lazy(() => import('src/pages/dashboard/stages/list'));
const StageCreatePage = lazy(() => import('src/pages/dashboard/stages/new'));
// Service Stages
const ServiceStageListPage = lazy(() => import('src/pages/dashboard/service-stages/list'));
const ServiceStageCreatePage = lazy(() => import('src/pages/dashboard/service-stages/new'));
// Services Tasks
const ServiceTaskDefaultListPage = lazy(() => import('src/pages/dashboard/service-task-default/list'));
const ServiceTaskDefaultCreatePage = lazy(() => import('src/pages/dashboard/service-task-default/new'));
// Stages Tasks
const StageTaskListPage = lazy(() => import('src/pages/dashboard/stages-task/list'));
const StageTaskCreatePage = lazy(() => import('src/pages/dashboard/stages-task/new'));
// Tasks
const TaskDefaultListPage = lazy(() => import('src/pages/dashboard/task-default/list'));
const TaskDefaultCreatePage = lazy(() => import('src/pages/dashboard/task-default/new'));
// User Roles
const UserRoleDefaultListPage = lazy(() => import('src/pages/dashboard/user-role/list'));
const UserRoleDefaultCreatePage = lazy(() => import('src/pages/dashboard/user-role/new'));
// Default Guide Product
const DefaultGuideProductListPage = lazy(() => import('src/pages/dashboard/default-guide-product/list'));
const DefaultGuideProductCreatePage = lazy(() => import('src/pages/dashboard/default-guide-product/new'));
// Service
const ServicePage = lazy(() => import('src/pages/dashboard/service'));
const ServiceCreatePage = lazy(() => import('src/pages/dashboard/service/new'));
const ServiceDetailsPage = lazy(() => import('src/pages/dashboard/service/details'));
// Measurement
const MeasurementPage = lazy(() => import('src/pages/dashboard/measurement'));
const MeasurementCreatePage = lazy(() => import('src/pages/dashboard/measurement/new'));
const MeasurementDetailsPage = lazy(() => import('src/pages/dashboard/measurement/details'));

// Service Issue
const ServiceIssueListPage = lazy(() => import('src/pages/dashboard/service-issue/list'));
const ServiceIssueCreatePage = lazy(() => import('src/pages/dashboard/service-issue/new'));

// Track
const TrackListPage = lazy(() => import('src/pages/dashboard/track/list'));
// Error
const Page403 = lazy(() => import('src/pages/error/403'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);


export const dashboardRoutes = (listPermissions, user) => [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <OverviewAnalyticsPage /> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      {
        element: <OverviewAnalyticsPage />,
        index: true
      },
      {
        path: 'analytics',
        element: verifyPermissions(
          listPermissions,
          CONFIG.permissions.system,
          CONFIG.permissions.moduleDashboards,
          CONFIG.permissions.operationList
        ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.projectManager) ? <OverviewAnalyticsPage /> : <Page403 />
      },
      {
        path: 'calendar',
        element: verifyPermissions(
          listPermissions,
          CONFIG.permissions.system,
          CONFIG.permissions.moduleDashboards,
          CONFIG.permissions.operationList
        ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.projectManager) ? <CalendarPage /> : <Page403 />
      },
      {
        path: 'sales-order',
        children: [
          {
            element: verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleSalesOrders,
              CONFIG.permissions.operationList
            ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator) ? <SalesOrderListPage /> : <Page403 />,
            index: true
          },
          {
            path: 'list',
            element: verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleSalesOrders,
              CONFIG.permissions.operationList
            ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator) ? <SalesOrderListPage /> : <Page403 />
          },
          {
            path: ':id',
            element: verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleSalesOrders,
              CONFIG.permissions.operationDetails
            ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator) ? <SalesOrderDetailsPage /> : <Page403 />
          },
        ],
      },
      {
        path: 'installation',
        children: [
          {
            element: verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleProjects,
              CONFIG.permissions.operationList
            ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.projectManager) ? <ProjectPage /> : <Page403 />,
            index: true
          },
          {
            path: 'list',
            element: verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleProjects,
              CONFIG.permissions.operationList
            ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.projectManager) ? <ProjectPage /> : <Page403 />
          },
          {
            path: ':id/kanban',
            element: <KanbanPage />,
          },
          {
            path: ':id/edit',
            element: <ProjectEditPage />,
          },
          {
            path: ':id/details',
            element: verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleProjects,
              CONFIG.permissions.operationDetails
            ) || listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.projectManager) ? <ProjectDetailsPage /> : <Page403 />,
          }

        ],
      },
      ...(user && listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.administrator)) ?
        [
          {
            path: 'config/default-task',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <TaskDefaultListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <TaskDefaultListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <TaskDefaultCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <TaskDefaultCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/stage',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/service-default-task',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceTaskDefaultListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceTaskDefaultListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceTaskDefaultCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceTaskDefaultCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/service-stage',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceStageListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceStageListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceStageCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceStageCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/default-guide-product',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <DefaultGuideProductListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <DefaultGuideProductListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <DefaultGuideProductCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <DefaultGuideProductCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/task-stage',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageTaskListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageTaskListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageTaskCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <StageTaskCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/service-issue',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceIssueListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceIssueListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceIssueCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <ServiceIssueCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/role',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultListPage /> : <Page403 />
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultCreatePage /> : <Page403 />
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <UserRoleDefaultCreatePage /> : <Page403 />
              },
            ],
          },
          {
            path: 'config/track',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.administrator
                ) ? <TrackListPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.superadmin
                ) ? <TrackListPage /> : <Page403 />
              },
            ],
          },
        ] : [],
      ...(user && listRolesAndSubroles(user?.user_role?.name).includes(CONFIG.roles.projectManager)) ?
        [
          {
            path: 'user',
            children: [
              {
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.projectManager
                ) ? <UserProfilePage /> : <Page403 />,
                index: true
              },
              {
                path: 'profile',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.projectManager
                ) ? <UserProfilePage /> : <Page403 />,
              },
              {
                path: 'cards',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.projectManager
                ) ? <UserCardsPage /> : <Page403 />,
              },
              {
                path: 'list',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.projectManager
                ) ? <UserListPage /> : <Page403 />,
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.projectManager
                ) ? <UserCreatePage /> : <Page403 />,
              },
              {
                path: ':id/edit',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.projectManager
                ) ? <UserEditPage /> : <Page403 />,
              },
            ],
          },
        ] : [],
      ...(user && belongsToWorkingStaff(user?.user_role?.name)) ?
        [
          {
            path: 'service',
            children: [
              {
                element: belongsToWorkingStaff(user?.user_role?.name) ? <ServicePage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: belongsToWorkingStaff(user?.user_role?.name) ? <ServicePage /> : <Page403 />,
              },
              {
                path: 'new',
                element: listRolesAndSubroles(
                  user?.user_role?.name
                ).includes(
                  CONFIG.roles.serviceStaff
                ) ? <ServiceCreatePage /> : <Page403 />,
              },
              {
                path: ':id/details',
                element: belongsToWorkingStaff(user?.user_role?.name) ? <ServiceDetailsPage /> : <Page403 />,
              }
            ],
          },
        ] : [],
      ...(user && (
        belongsToWorkingStaff(user?.user_role?.name)
      )) ?
        [
          {
            path: 'measurement',
            children: [
              {
                element: (
                  belongsToWorkingStaff(user?.user_role?.name)
                ) ? <MeasurementPage /> : <Page403 />,
                index: true
              },
              {
                path: 'list',
                element: (
                  belongsToWorkingStaff(user?.user_role?.name)
                ) ? <MeasurementPage /> : <Page403 />,
              },
              {
                path: 'new',
                element: (
                  belongsToWorkingStaff(user?.user_role?.name)
                ) ? <MeasurementCreatePage /> : <Page403 />,
              },
              {
                path: ':id/details',
                element: (
                  belongsToWorkingStaff(user?.user_role?.name)
                ) ? <MeasurementDetailsPage /> : <Page403 />,
              }
            ],
          },
        ] : [],
    ],
  },
];

