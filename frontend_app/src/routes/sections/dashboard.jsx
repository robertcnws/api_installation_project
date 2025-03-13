import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('src/pages/dashboard'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
// Order
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
// User
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
// App
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
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
// Stages Tasks
const StageTaskListPage = lazy(() => import('src/pages/dashboard/stages-task/list'));
const StageTaskCreatePage = lazy(() => import('src/pages/dashboard/stages-task/new'));
// Tasks
const TaskDefaultListPage = lazy(() => import('src/pages/dashboard/task-default/list'));
const TaskDefaultCreatePage = lazy(() => import('src/pages/dashboard/task-default/new'));
// User Roles
const UserRoleDefaultListPage = lazy(() => import('src/pages/dashboard/user-role/list'));
const UserRoleDefaultCreatePage = lazy(() => import('src/pages/dashboard/user-role/new'));
// Track
const TrackListPage = lazy(() => import('src/pages/dashboard/track/list'));
// Error
const Page500 = lazy(() => import('src/pages/error/500'));
const Page403 = lazy(() => import('src/pages/error/403'));
const Page404 = lazy(() => import('src/pages/error/404'));

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
        element: <IndexPage />,
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
    ],
  },
];

