
import { paths } from 'src/routes/paths';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

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
      { title: 'Analytics', path: paths.dashboard.general.analytics, icon: ICONS.analytics },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      {
        title: 'Installations',
        path: paths.dashboard.project.root,
        icon: ICONS.project,
        children: [
          {
            title: 'List',
            path: paths.dashboard.project.list,
          },
          // {
          //   title: 'Calendar View',
          //   path: paths.dashboard.shipment.listBySku,
          // },
          // {
          //   title: 'Kanban View',
          //   path: paths.dashboard.shipment.listBySku,
          // },
        ],
      },
      ...(userLogged && listRolesAndSubroles(userLogged?.data.user_role.name).includes(CONFIG.roles.administrator) ? [
        {
          title: 'Sales Orders',
          path: paths.dashboard.salesOrder.root,
          icon: ICONS.salesOrder,
          children: [
            {
              title: 'List',
              path: paths.dashboard.salesOrder.list,
              onClick: () => {
                alert('List');
              }
            },
          ],
        },
      ] : []),
      ...(userLogged && listRolesAndSubroles(userLogged?.data.user_role.name).includes(CONFIG.roles.projectManager) ? [
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
      ...(userLogged && listRolesAndSubroles(userLogged?.data.user_role.name).includes(CONFIG.roles.superadmin) ? [
        {
          title: 'Configuration',
          path: paths.dashboard.config.root,
          icon: ICONS.config,
          open: true,
          children: [
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
