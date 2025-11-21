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
  apiPort: import.meta.env.VITE_BACKEND_PORT ?? 543,
  apiDomain: import.meta.env.VITE_BACKEND_DOMAIN ?? '',
  pollingInterval: import.meta.env.VITE_POLLING_INTERVAL ?? 10000,
  frontendHost: import.meta.env.VITE_FRONTEND_HOST ?? '',
  frontendUrl: import.meta.env.VITE_FRONTEND_URL ?? '',
  frontendPort: import.meta.env.VITE_FRONTEND_PORT ?? 3000,
  wsProtocol: import.meta.env.VITE_WEBSOCKET_PROTOCOL ?? 'ws',
  wsHost: import.meta.env.VITE_WEBSOCKET_HOST ?? '',
  wsDomain: import.meta.env.VITE_WEBSOCKET_DOMAIN ?? '',
  permissions: {
    system: import.meta.env.VITE_PERMISSION_SYSTEM_NAME ?? '',
    moduleSalesOrders: import.meta.env.VITE_PERMISSION_MODULE_SALES_ORDERS_NAME ?? '',
    moduleProjects: import.meta.env.VITE_PERMISSION_MODULE_PROJECTS_NAME ?? '',
    moduleServices: import.meta.env.VITE_PERMISSION_MODULE_SERVICES_NAME ?? '',
    moduleDashboards: import.meta.env.VITE_PERMISSION_MODULE_DASHBOARD_NAME ?? '',
    moduleTasks: import.meta.env.VITE_PERMISSION_MODULE_TASKS_NAME ?? '',
    moduleUsers: import.meta.env.VITE_PERMISSION_MODULE_USERS_NAME ?? '',
    moduleTaskStages: import.meta.env.VITE_PERMISSION_MODULE_TASK_STAGES_NAME ?? '',
    moduleRoles: import.meta.env.VITE_PERMISSION_MODULE_ROLES_NAME ?? '',
    moduleInstallationStages: import.meta.env.VITE_PERMISSION_MODULE_INSTALLATION_STAGES_NAME ?? '',
    operationList: import.meta.env.VITE_PERMISSION_OPERATION_LIST_NAME ?? '',
    operationDetails: import.meta.env.VITE_PERMISSION_OPERATION_DETAILS_NAME ?? '',
    operationCreate: import.meta.env.VITE_PERMISSION_OPERATION_CREATE_NAME ?? '',
    operationUpdate: import.meta.env.VITE_PERMISSION_OPERATION_UPDATE_NAME ?? '',
    operationEdit: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_NAME ?? '',
    operationDelete: import.meta.env.VITE_PERMISSION_OPERATION_DELETE_NAME ?? '',
    operationUploadFile: import.meta.env.VITE_PERMISSION_OPERATION_UPLOAD_FILE_NAME ?? '',
    operationDownloadFile: import.meta.env.VITE_PERMISSION_OPERATION_DOWNLOAD_FILE_NAME ?? '',
    operationRemoveFile: import.meta.env.VITE_PERMISSION_OPERATION_REMOVE_FILE_NAME ?? '',
    operationEditCalendar: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_CALENDAR_NAME ?? '',
    operationEditAddress: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_ADDRESS_NAME ?? '',
    operationEditPhoneNumber: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_PHONE_NUMBER_NAME ?? '',
    operationEditReferenceNumber: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_REFERENCE_NUMBER_NAME ?? '',
    operationEditResponsable: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_RESPONSABLE_NAME ?? '',
    operationEditInstaller: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_INSTALLER_NAME ?? '',
    operationEditServiceTeam: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_SERVICE_TEAM_NAME ?? '',
    operationEditInstallDate: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_INSTALL_DATE_NAME ?? '',
    operationEditStartDate: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_START_DATE_NAME ?? '',
    operationEditClosingDate: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_CLOSING_DATE_NAME ?? '',
    operationEditUsersAssignees: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_USERS_ASSIGNEES_NAME ?? '',
    operationEditHasPermission: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_HAS_PERMISSION_NAME ?? '',
    operationEditPriority: import.meta.env.VITE_PERMISSION_OPERATION_EDIT_PRIORITY_NAME ?? '',
  },
  stages: {
    preparation: import.meta.env.VITE_STAGE_PREPARATION ?? '',
    coordination: import.meta.env.VITE_STAGE_COORDINATION ?? '',
    installation: import.meta.env.VITE_STAGE_INSTALLATION ?? '',
    permission: import.meta.env.VITE_STAGE_PERMISSION ?? '',
    closing: import.meta.env.VITE_STAGE_CLOSING ?? '',
    finished: import.meta.env.VITE_STAGE_FINISHED ?? '',
    repair: import.meta.env.VITE_STAGE_REPAIR ?? '',
  },
  taskStatus: {
    notStarted: import.meta.env.VITE_TASK_STATUS_NOT_STARTED ?? '',
    inProgress: import.meta.env.VITE_TASK_STATUS_IN_PROGRESS ?? '',
    finished: import.meta.env.VITE_TASK_STATUS_FINISHED ?? '',
  },
  roles: {
    superadmin: import.meta.env.VITE_ROLE_SUPERADMIN ?? '',
    administrator: import.meta.env.VITE_ROLE_ADMINISTRATOR ?? '',
    projectManager: import.meta.env.VITE_ROLE_PROJECT_MANAGER ?? '',
    installer: import.meta.env.VITE_ROLE_INSTALLER ?? '',
    officeStaff: import.meta.env.VITE_ROLE_OFFICE_STAFF ?? '',
    warehouseStaff: import.meta.env.VITE_ROLE_WAREHOUSE_STAFF ?? '',
    financialStaff: import.meta.env.VITE_ROLE_FINANCIAL_STAFF ?? '',
    serviceStaff: import.meta.env.VITE_ROLE_SERVICE_STAFF ?? '',
  },
  projectPermissions: {
    fullAccess: import.meta.env.VITE_PROJECT_PERMISSION_FULL_ACCESS ?? '',
    read: import.meta.env.VITE_PROJECT_PERMISSION_READ ?? '',
    write: import.meta.env.VITE_PROJECT_PERMISSION_WRITE ?? '',
    delete: import.meta.env.VITE_PROJECT_PERMISSION_DELETE ?? '',
  },
  installationGuide: {
    windowUntil74Name: import.meta.env.VITE_INSTALLATION_WINDOWS_UNTIL_74_NAME ?? '',
    windowUntil74Price: import.meta.env.VITE_INSTALLATION_WINDOWS_UNTIL_74_PRICE ?? '',
    windowUntil111Name: import.meta.env.VITE_INSTALLATION_WINDOWS_UNTIL_111_NAME ?? '',
    windowUntil111Price: import.meta.env.VITE_INSTALLATION_WINDOWS_UNTIL_111_PRICE ?? '',
    fixedSideName: import.meta.env.VITE_INSTALLATION_FIXED_SIDE_NAME ?? '',
    fixedSidePrice: import.meta.env.VITE_INSTALLATION_FIXED_SIDE_PRICE ?? '',
    fdUntil39Name: import.meta.env.VITE_INSTALLATION_FD_UNTIL_39_NAME ?? '',
    fdUntil39Price: import.meta.env.VITE_INSTALLATION_FD_UNTIL_39_PRICE ?? '',
    fdDoubleUntil76Name: import.meta.env.VITE_INSTALLATION_FD_DOUBLE_UNTIL_76_NAME ?? '',
    fdDoubleUntil76Price: import.meta.env.VITE_INSTALLATION_FD_DOUBLE_UNTIL_76_PRICE ?? '',
    sgdForPanel72Name: import.meta.env.VITE_INSTALLATION_SGD_FOR_PANEL_72_NAME ?? '',
    sgdForPanel72Price: import.meta.env.VITE_INSTALLATION_SGD_FOR_PANEL_72_PRICE ?? '',
    sgdForPanel96Name: import.meta.env.VITE_INSTALLATION_SGD_FOR_PANEL_96_NAME ?? '',
    sgdForPanel96Price: import.meta.env.VITE_INSTALLATION_SGD_FOR_PANEL_96_PRICE ?? '',
    storefrontName: import.meta.env.VITE_INSTALLATION_STOREFRONT_NAME ?? '',
  },
  tasks: {
    startInstallation: import.meta.env.VITE_TASK_START_INSTALLATION ?? '',
    finishInstallation: import.meta.env.VITE_TASK_FINISH_INSTALLATION ?? '',
    assignInstallationCrew: import.meta.env.VITE_TASK_ASSIGN_INSTALLATION_CREW ?? '',
    coordinateInstallationDate: import.meta.env.VITE_TASK_COORDINATE_INSTALLATION_DATE ?? '',
    coordinateInspection: import.meta.env.VITE_TASK_COORDINATE_INSPECTION ?? '',
    orderIsReadyToPickUp: import.meta.env.VITE_TASK_ORDER_IS_READY_TO_PICK_UP ?? '',
    pickUpOrder: import.meta.env.VITE_TASK_PICK_UP_ORDER ?? '',
    completeSatisfactionForm: import.meta.env.VITE_TASK_COMPLETE_SATISFACTION_FORM ?? '',
    generateInstallationGuide: import.meta.env.VITE_TASK_GENERATE_INSTALLATION_GUIDE ?? '',
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
