import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { verifyPermissions } from 'src/utils/check-permissions';



// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('src/pages/dashboard'));
const OverviewEcommercePage = lazy(() => import('src/pages/dashboard/ecommerce'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const OverviewBankingPage = lazy(() => import('src/pages/dashboard/banking'));
const OverviewBookingPage = lazy(() => import('src/pages/dashboard/booking'));
const OverviewFilePage = lazy(() => import('src/pages/dashboard/file'));
const OverviewCoursePage = lazy(() => import('src/pages/dashboard/course'));
const LiveMonitorAnalyticsPage = lazy(() => import('src/pages/dashboard/live-monitor'));
// Product
const ProductDetailsPage = lazy(() => import('src/pages/dashboard/product/details'));
const ProductListPage = lazy(() => import('src/pages/dashboard/product/list'));
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const ProductEditPage = lazy(() => import('src/pages/dashboard/product/edit'));
// Order
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
// Invoice
const InvoiceListPage = lazy(() => import('src/pages/dashboard/invoice/list'));
const InvoiceDetailsPage = lazy(() => import('src/pages/dashboard/invoice/details'));
const InvoiceCreatePage = lazy(() => import('src/pages/dashboard/invoice/new'));
const InvoiceEditPage = lazy(() => import('src/pages/dashboard/invoice/edit'));
// User
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
// Blog
const BlogPostsPage = lazy(() => import('src/pages/dashboard/post/list'));
const BlogPostPage = lazy(() => import('src/pages/dashboard/post/details'));
const BlogNewPostPage = lazy(() => import('src/pages/dashboard/post/new'));
const BlogEditPostPage = lazy(() => import('src/pages/dashboard/post/edit'));
// Job
const JobDetailsPage = lazy(() => import('src/pages/dashboard/job/details'));
const JobListPage = lazy(() => import('src/pages/dashboard/job/list'));
const JobCreatePage = lazy(() => import('src/pages/dashboard/job/new'));
const JobEditPage = lazy(() => import('src/pages/dashboard/job/edit'));
// Tour
const TourDetailsPage = lazy(() => import('src/pages/dashboard/tour/details'));
const TourListPage = lazy(() => import('src/pages/dashboard/tour/list'));
const TourCreatePage = lazy(() => import('src/pages/dashboard/tour/new'));
const TourEditPage = lazy(() => import('src/pages/dashboard/tour/edit'));
// File manager
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));
// App
const ChatPage = lazy(() => import('src/pages/dashboard/chat'));
const MailPage = lazy(() => import('src/pages/dashboard/mail'));
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
// Test render page by role
const PermissionDeniedPage = lazy(() => import('src/pages/dashboard/permission'));
// Blank page
const ParamsPage = lazy(() => import('src/pages/dashboard/params'));
const BlankPage = lazy(() => import('src/pages/dashboard/blank'));
// Shipment
const ShipmentListPage = lazy(() => import('src/pages/dashboard/shipment/list'));
const ShipmentDetailsPage = lazy(() => import('src/pages/dashboard/shipment/details'));
const ShipmentListBySkuPage = lazy(() => import('src/pages/dashboard/shipment/listBySku'));
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


export const dashboardRoutes = (listPermissions) => [
  {
    path: 'dashboard',
    // element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    element: CONFIG.auth.skip ? <OverviewAnalyticsPage /> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      // { path: 'ecommerce', element: <OverviewEcommercePage /> },
      { path: 'analytics', element: <OverviewAnalyticsPage /> },
      { path: 'live-monitor', element: <LiveMonitorAnalyticsPage /> },
      // { path: 'banking', element: <OverviewBankingPage /> },
      // { path: 'booking', element: <OverviewBookingPage /> },
      // { path: 'file', element: <OverviewFilePage /> },
      // { path: 'course', element: <OverviewCoursePage /> },

      {
        path: 'sales-order',
        children: [
          {
            element: verifyPermissions(listPermissions, CONFIG.permissions.system, CONFIG.permissions.moduleSalesOrders, CONFIG.permissions.operationList) ?
              <SalesOrderListPage /> : <Page403 />, index: true
          },
          {
            path: 'list', element: verifyPermissions(listPermissions, CONFIG.permissions.system, CONFIG.permissions.moduleSalesOrders, CONFIG.permissions.operationList) ?
              <SalesOrderListPage /> : <Page403 />
          },
          { path: ':id', element: <SalesOrderDetailsPage /> },
        ],
      },
      {
        path: 'installation',
        children: [
          {
            element: verifyPermissions(listPermissions, CONFIG.permissions.system, CONFIG.permissions.moduleProjects, CONFIG.permissions.operationList) ?
              <ProjectPage /> : <Page403 />, index: true
          },
          {
            path: 'list', element: verifyPermissions(listPermissions, CONFIG.permissions.system, CONFIG.permissions.moduleProjects, CONFIG.permissions.operationList) ?
              <ProjectPage /> : <Page403 />
          },
          {
            path: ':id/kanban', element: <KanbanPage />,
          },
          {
            path: ':id/edit', element: <ProjectEditPage />,
          },
          {
            path: ':id/details', element: <ProjectDetailsPage />,
          }

        ],
      },
      {
        path: 'config/default-task',
        children: [
          { element: <TaskDefaultListPage />, index: true },
          { path: 'list', element: <TaskDefaultListPage /> },
          { path: 'new', element: <TaskDefaultCreatePage /> },
          { path: ':id/edit', element: <TaskDefaultCreatePage /> },
        ],
      },
      {
        path: 'config/stage',
        children: [
          { element: <StageListPage />, index: true },
          { path: 'list', element: <StageListPage /> },
          { path: 'new', element: <StageCreatePage /> },
          { path: ':id/edit', element: <StageCreatePage /> },
        ],
      },
      {
        path: 'config/task-stage',
        children: [
          { element: <StageTaskListPage />, index: true },
          { path: 'list', element: <StageTaskListPage /> },
          { path: 'new', element: <StageTaskCreatePage /> },
          { path: ':id/edit', element: <StageTaskCreatePage /> },
        ],
      },
      {
        path: 'config/rol',
        children: [
          { element: <StageTaskListPage />, index: true },
          { path: 'list', element: <StageTaskListPage /> },
          { path: 'new', element: <StageTaskCreatePage /> },
          { path: ':id/edit', element: <StageTaskCreatePage /> },
        ],
      },
      {
        path: 'user',
        children: [
          { element: <UserProfilePage />, index: true },
          { path: 'profile', element: <UserProfilePage /> },
          { path: 'cards', element: <UserCardsPage /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: 'account', element: <UserAccountPage /> },
        ],
      },
      {
        path: 'product',
        children: [
          { element: <ProductListPage />, index: true },
          { path: 'list', element: <ProductListPage /> },
          { path: ':id', element: <ProductDetailsPage /> },
          { path: 'new', element: <ProductCreatePage /> },
          { path: ':id/edit', element: <ProductEditPage /> },
        ],
      },
      {
        path: 'order',
        children: [
          { element: <OrderListPage />, index: true },
          { path: 'list', element: <OrderListPage /> },
          { path: ':id', element: <OrderDetailsPage /> },
        ],
      },
      {
        path: 'shipment',
        children: [
          { element: <ShipmentListPage />, index: true },
          { path: 'list', element: <ShipmentListPage /> },
          { path: 'listBySku', element: <ShipmentListBySkuPage /> },
          { path: ':id', element: <ShipmentDetailsPage /> },
        ],
      },
      {
        path: 'invoice',
        children: [
          { element: <InvoiceListPage />, index: true },
          { path: 'list', element: <InvoiceListPage /> },
          { path: ':id', element: <InvoiceDetailsPage /> },
          { path: ':id/edit', element: <InvoiceEditPage /> },
          { path: 'new', element: <InvoiceCreatePage /> },
        ],
      },
      {
        path: 'post',
        children: [
          { element: <BlogPostsPage />, index: true },
          { path: 'list', element: <BlogPostsPage /> },
          { path: ':title', element: <BlogPostPage /> },
          { path: ':title/edit', element: <BlogEditPostPage /> },
          { path: 'new', element: <BlogNewPostPage /> },
        ],
      },
      {
        path: 'job',
        children: [
          { element: <JobListPage />, index: true },
          { path: 'list', element: <JobListPage /> },
          { path: ':id', element: <JobDetailsPage /> },
          { path: 'new', element: <JobCreatePage /> },
          { path: ':id/edit', element: <JobEditPage /> },
        ],
      },
      {
        path: 'tour',
        children: [
          { element: <TourListPage />, index: true },
          { path: 'list', element: <TourListPage /> },
          { path: ':id', element: <TourDetailsPage /> },
          { path: 'new', element: <TourCreatePage /> },
          { path: ':id/edit', element: <TourEditPage /> },
        ],
      },
      { path: 'file-manager', element: <FileManagerPage /> },
      { path: 'mail', element: <MailPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      // { path: 'kanban', element: <KanbanPage /> },
      { path: 'permission', element: <PermissionDeniedPage /> },
      { path: 'params', element: <ParamsPage /> },
      { path: 'blank', element: <BlankPage /> },
    ],
  },
];

