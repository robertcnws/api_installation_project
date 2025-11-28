
import { paths } from 'src/routes/paths';

import { isInstaller, isServiceStaff, listRolesAndSubroles, belongsToWorkingStaff } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';


// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
  item: icon('ic-item'),
  shipment: icon('ic-shipment'),
  salesOrder: icon('ic-sale-order'),
  project: icon('ic-project'),
  stage: icon('ic-stage'),
  stageTask: icon('ic-stage-task'),
  task: icon('ic-task'),
  access: icon('ic-access'),
  radar: icon('ic-radar'),
  config: icon('ic-config'),
  track: icon('ic-track'),
  defaultGuideProduct: icon('ic-guide-product'),
  service: icon('ic-service'),
  serviceIssue: icon('ic-service-issue'),
  serviceStage: icon('ic-service-stage'),
  serviceTask: icon('ic-service-task'),
  calendarOverview: icon('ic-calendar-overview'),
  measurement: icon('ic-measurements'),
  defaultMaterial: icon('ic-material'),
  statistics: icon('ic-statistics'),
  report: icon('ic-report'),
};

const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

// const { countLostItems } = useDataContext();

// ----------------------------------------------------------------------

export const navData = () => [
  // export const navData = (countLostItems) => [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      { title: 'Dashboard', path: paths.dashboard.general.analytics, icon: ICONS.dashboard },
      { title: 'Calendar', path: paths.dashboard.general.calendar, icon: ICONS.calendarOverview },
      ...(userLogged && listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.projectManager) ? [
        { title: 'Metrics', path: paths.dashboard.general.metrics, icon: ICONS.statistics },
        { title: 'Reports', path: paths.dashboard.general.reports, icon: ICONS.report },
      ] : []),
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      ...(userLogged && !isServiceStaff(userLogged?.data?.user_role?.name) ? [
        {
          title: 'Installations',
          path: paths.dashboard.project.root,
          icon: ICONS.project,
          children: [
            {
              title: 'List',
              path: paths.dashboard.project.list,
            },
            ...((userLogged && !isInstaller(userLogged?.data?.user_role?.name)) ? [
              {
                title: 'Attachments',
                path: paths.dashboard.project.attachments,
              },
            ] : []),
          ],
        },
      ] : []),
      ...(userLogged && belongsToWorkingStaff(userLogged?.data?.user_role?.name) ? [
        {
          title: 'Services',
          path: paths.dashboard.service.root,
          icon: ICONS.service,
          children: [
            {
              title: 'List',
              path: paths.dashboard.service.list,
            },
            ...((userLogged && !isInstaller(userLogged?.data?.user_role?.name)) ? [
              {
                title: 'Attachments',
                path: paths.dashboard.service.attachments,
              },
              {
                title: 'Create',
                path: paths.dashboard.service.new
              },
            ] : []),
          ],
        },
      ] : []),
      ...((userLogged && belongsToWorkingStaff(userLogged?.data?.user_role?.name)) ? [
        {
          title: 'Measurements',
          path: paths.dashboard.measurement.root,
          icon: ICONS.measurement,
          children: [
            {
              title: 'List',
              path: paths.dashboard.measurement.list,
            },
            ...((userLogged && !isInstaller(userLogged?.data?.user_role?.name)) ? [
              {
                title: 'Create',
                path: paths.dashboard.measurement.new
              },
            ] : []),
          ],
        },
      ] : []),
      ...(userLogged && listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ? [
        {
          title: 'Sales Orders',
          path: paths.dashboard.salesOrder.root,
          icon: ICONS.salesOrder,
          children: [
            {
              title: 'List',
              path: paths.dashboard.salesOrder.list,
            },
          ],
        },
      ] : []),
      ...(userLogged && listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.projectManager) ? [
        {
          title: 'Users',
          path: paths.dashboard.user.root,
          icon: ICONS.user,
          children: [
            { title: 'List', path: paths.dashboard.user.list },
            { title: 'Create', path: paths.dashboard.user.new },
          ],
        },
      ] : []),
      ...(userLogged && listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.superadmin) ? [
        {
          title: 'Configuration',
          path: paths.dashboard.config.root,
          icon: ICONS.config,
          open: true,
          children: [
            {
              title: 'Default Guide Products',
              path: paths.dashboard.defaultGuideProduct.root,
              icon: ICONS.defaultGuideProduct,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.defaultGuideProduct.root,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.defaultGuideProduct.new
                },
              ],
            },
            {
              title: 'Default Materials',
              path: paths.dashboard.defaultMaterial.root,
              icon: ICONS.defaultMaterial,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.defaultMaterial.root,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.defaultMaterial.new
                },
              ],
            },
            {
              title: 'Installation Stages',
              path: paths.dashboard.stage.root,
              icon: ICONS.stage,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.stage.root,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.stage.new
                },
              ],
            },
            {
              title: 'Task Stages',
              path: paths.dashboard.stageTask.root,
              icon: ICONS.stageTask,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.stageTask.list,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.stageTask.new
                },
              ],
            },
            {
              title: 'Tasks',
              path: paths.dashboard.task.root,
              icon: ICONS.task,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.task.list,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.task.new
                },
              ],
            },
            {
              title: 'Service Issues',
              path: paths.dashboard.serviceIssue.root,
              icon: ICONS.serviceIssue,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.serviceIssue.root,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.serviceIssue.new
                },
              ],
            },
            {
              title: 'Service Stages',
              path: paths.dashboard.serviceStage.root,
              icon: ICONS.serviceStage,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.serviceStage.root,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.serviceStage.new
                },
              ],
            },
            {
              title: 'Service Tasks',
              path: paths.dashboard.serviceTask.root,
              icon: ICONS.serviceTask,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.serviceTask.root,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.serviceTask.new
                },
              ],
            },
            {
              title: 'Roles',
              path: paths.dashboard.role.root,
              icon: ICONS.access,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.role.list,
                },
                {
                  title: 'Create',
                  path: paths.dashboard.role.new
                },
              ],
            },
            {
              title: 'Tracking Logs',
              path: paths.dashboard.track.root,
              icon: ICONS.track,
              open: true,
              children: [
                {
                  title: 'List',
                  path: paths.dashboard.track.root,
                },
              ],
            },
          ],
        },
      ] : []),

    ],
  },
];
