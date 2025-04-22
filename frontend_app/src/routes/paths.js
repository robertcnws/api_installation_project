
import { _id, _postTitles } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];

const MOCK_TITLE = _postTitles[2];

const ROOTS = {
  AUTH: '/auth',
  AUTH_DEMO: '/auth-demo',
  DASHBOARD: '/dashboard',
  DASHBOARD_CONFIG: '/dashboard/config',
};

// ----------------------------------------------------------------------

export const paths = {
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  docs: 'https://docs.minimals.cc',
  changelog: 'https://docs.minimals.cc/changelog',
  zoneStore: 'https://mui.com/store/items/zone-landing-page/',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  freeUI: 'https://mui.com/store/items/minimal-dashboard-free/',
  figmaUrl: 'https://www.figma.com/design/cAPz4pYPtQEXivqe11EcDE/%5BPreview%5D-Minimal-Web.v6.0.0',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/sign-in`,
      signUp: `${ROOTS.AUTH}/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: `${ROOTS.DASHBOARD}/analytics`,
    kanban: `${ROOTS.DASHBOARD}/kanban`,
    calendar: `${ROOTS.DASHBOARD}/calendar`,
    fileManager: `${ROOTS.DASHBOARD}/file-manager`,
    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      analytics: `${ROOTS.DASHBOARD}/analytics`,
      calendar: `${ROOTS.DASHBOARD}/calendar`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      cards: `${ROOTS.DASHBOARD}/user/cards`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
      edit: (id) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      demo: {
        edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit`,
      },
    },
    salesOrder: {
      root: `${ROOTS.DASHBOARD}/sales-order`,
      list: `${ROOTS.DASHBOARD}/sales-order/list`,
      details: (id) => `${ROOTS.DASHBOARD}/sales-order/${id}`,
    },
    project: {
      root: `${ROOTS.DASHBOARD}/installation`,
      list: `${ROOTS.DASHBOARD}/installation/list`,
      kanbanProject: `${ROOTS.DASHBOARD}/installation/kanban`,
      kanbanProjectId: (id) => `${ROOTS.DASHBOARD}/installation/${id}/kanban`,
      edit: (id) => `${ROOTS.DASHBOARD}/installation/${id}/edit`,
      details: (id) => `${ROOTS.DASHBOARD}/installation/${id}/details`,
    },
    service: {
      root: `${ROOTS.DASHBOARD}/service`,
      list: `${ROOTS.DASHBOARD}/service/list`,
      new: `${ROOTS.DASHBOARD}/service/new`,
      kanban: `${ROOTS.DASHBOARD}/service/kanban`,
      kanbanId: (id) => `${ROOTS.DASHBOARD}/service/${id}/kanban`,
      edit: (id) => `${ROOTS.DASHBOARD}/service/${id}/edit`,
      details: (id) => `${ROOTS.DASHBOARD}/service/${id}/details`,
    },
    measurement: {
      root: `${ROOTS.DASHBOARD}/measurement`,
      list: `${ROOTS.DASHBOARD}/measurement/list`,
      new: `${ROOTS.DASHBOARD}/measurement/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/measurement/${id}/edit`,
      details: (id) => `${ROOTS.DASHBOARD}/measurement/${id}/details`,
    },
    config: {
      root: `${ROOTS.DASHBOARD_CONFIG}`,
    },
    defaultGuideProduct: {
      root: `${ROOTS.DASHBOARD_CONFIG}/default-guide-product`,
      list: `${ROOTS.DASHBOARD_CONFIG}/default-guide-product/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/default-guide-product/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/default-guide-product/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/default-guide-product/${id}/edit`,
    },
    stage: {
      root: `${ROOTS.DASHBOARD_CONFIG}/stage`,
      list: `${ROOTS.DASHBOARD_CONFIG}/stage/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/stage/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/stage/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/stage/${id}/edit`,
    },
    serviceStage: {
      root: `${ROOTS.DASHBOARD_CONFIG}/service-stage`,
      list: `${ROOTS.DASHBOARD_CONFIG}/service-stage/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/service-stage/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/service-stage/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/service-stage/${id}/edit`,
    },
    stageTask: {
      root: `${ROOTS.DASHBOARD_CONFIG}/task-stage`,
      list: `${ROOTS.DASHBOARD_CONFIG}/task-stage/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/task-stage/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/task-stage/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/task-stage/${id}/edit`,
    },
    task: {
      root: `${ROOTS.DASHBOARD_CONFIG}/default-task`,
      list: `${ROOTS.DASHBOARD_CONFIG}/default-task/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/default-task/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/default-task/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/default-task/${id}/edit`,
    },
    serviceTask: {
      root: `${ROOTS.DASHBOARD_CONFIG}/service-default-task`,
      list: `${ROOTS.DASHBOARD_CONFIG}/service-default-task/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/service-default-task/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/service-default-task/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/service-default-task/${id}/edit`,
    },
    serviceIssue: {
      root: `${ROOTS.DASHBOARD_CONFIG}/service-issue`,
      list: `${ROOTS.DASHBOARD_CONFIG}/service-issue/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/service-issue/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/service-issue/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/service-issue/${id}/edit`,
    },
    track: {
      root: `${ROOTS.DASHBOARD_CONFIG}/track`,
      list: `${ROOTS.DASHBOARD_CONFIG}/track/list`,
    },
    role: {
      root: `${ROOTS.DASHBOARD_CONFIG}/role`,
      list: `${ROOTS.DASHBOARD_CONFIG}/role/list`,
      new: `${ROOTS.DASHBOARD_CONFIG}/role/new`,
      details: (id) => `${ROOTS.DASHBOARD_CONFIG}/role/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD_CONFIG}/role/${id}/edit`,
    },
    order: {
      root: `${ROOTS.DASHBOARD}/order`,
      details: (id) => `${ROOTS.DASHBOARD}/order/${id}`,
      demo: {
        details: `${ROOTS.DASHBOARD}/order/${MOCK_ID}`,
      },
    },
  },
};
