import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  appName: 'NWS Home',
  appVersion: packageJson.version,
  serverUrl: import.meta.env.VITE_SERVER_URL ?? '',
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  apiUrl: import.meta.env.VITE_BACKEND_URL ?? '',
  apiHost: import.meta.env.VITE_BACKEND_HOST ?? '',
  apiDomain: import.meta.env.VITE_BACKEND_DOMAIN ?? '',
  pollingInterval: import.meta.env.VITE_POLLING_INTERVAL ?? 10000,
  permissions: {
    system: import.meta.env.VITE_PERMISSION_SYSTEM_NAME ?? '',
    moduleSalesOrders: import.meta.env.VITE_PERMISSION_MODULE_SALES_ORDERS_NAME ?? '',
    moduleProjects: import.meta.env.VITE_PERMISSION_MODULE_PROJECTS_NAME ?? '',
    moduleDashboards: import.meta.env.VITE_PERMISSION_MODULE_DASHBOARD_NAME ?? '',
    operationList: import.meta.env.VITE_PERMISSION_OPERATION_LIST_NAME ?? '',
    operationDetails: import.meta.env.VITE_PERMISSION_OPERATION_DETAILS_NAME ?? '',
    operationCreate: import.meta.env.VITE_PERMISSION_OPERATION_CREATE_NAME ?? '',
    operationUpdate: import.meta.env.VITE_PERMISSION_OPERATION_UPDATE_NAME ?? '',
    operationEdit: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_NAME ?? '',
    operationDelete: import.meta.env.VITE_PERMISSION_OPERATION_DELETE_NAME ?? '',
  },
  // aws: {
  //   accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID ?? '',
  //   secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY ?? '',
  //   region: import.meta.env.VITE_AWS_REGION ?? '',
  //   bucketName: import.meta.env.VITE_AWS_STORAGE_BUCKET_NAME ?? '',
  //   folderProjects: import.meta.env.VITE_AWS_S3_FOLDER_PROJECTS ?? '',
  //   folderTasks: import.meta.env.VITE_AWS_S3_FOLDER_TASKS ?? '',
  //   folderComments: import.meta.env.VITE_AWS_S3_FOLDER_COMMENTS ?? '',
  // },
  /**
   * Auth
   * @method jwt | amplify | firebase | supabase | auth0
   */
  auth: {
    method: 'jwt',
    skip: false,
    redirectPath: paths.dashboard.root,
  },
  /**
   * Mapbox
   */
  mapboxApiKey: import.meta.env.VITE_MAPBOX_API_KEY ?? '',
  /**
   * Firebase
   */
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APPID ?? '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
  },
  /**
   * Amplify
   */
  amplify: {
    userPoolId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_ID ?? '',
    userPoolWebClientId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID ?? '',
    region: import.meta.env.VITE_AWS_AMPLIFY_REGION ?? '',
  },
  /**
   * Auth0
   */
  auth0: {
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? '',
    domain: import.meta.env.VITE_AUTH0_DOMAIN ?? '',
    callbackUrl: import.meta.env.VITE_AUTH0_CALLBACK_URL ?? '',
  },
  /**
   * Supabase
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
};
