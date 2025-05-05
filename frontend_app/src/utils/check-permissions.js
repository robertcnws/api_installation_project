import { CONFIG } from 'src/config-global';

export const verifyPermissions = (permissions, system, module, operation) => {
  if (!permissions) {
    return false;
  }
  return permissions?.some((permission) =>
    permission?.module_system?.system?.name.toLowerCase().includes(system.toLowerCase()) &&
    permission?.module_system?.name.toLowerCase().includes(module.toLowerCase()) &&
    permission?.name.toLowerCase().includes(operation.toLowerCase())
  );
}

export const verifyRole = (roles, role) => {
  if (!roles) {
    return false;
  }
  return roles?.some((r) => r.name.includes(role));
}


export const listRolesAndSubroles = (role) =>
  role?.toLowerCase().indexOf(CONFIG.roles.superadmin.toLowerCase()) !== -1 ?
    [
      CONFIG.roles.superadmin,
      CONFIG.roles.administrator,
      CONFIG.roles.projectManager,
      CONFIG.roles.installer,
      CONFIG.roles.officeStaff,
      CONFIG.roles.warehouseStaff,
      CONFIG.roles.financialStaff,
      CONFIG.roles.serviceStaff,
    ] :
    role?.toLowerCase().indexOf(CONFIG.roles.administrator.toLowerCase()) !== -1 ?
      [
        CONFIG.roles.administrator,
        CONFIG.roles.projectManager,
        CONFIG.roles.installer,
        CONFIG.roles.officeStaff,
        CONFIG.roles.warehouseStaff,
        CONFIG.roles.financialStaff,
        CONFIG.roles.serviceStaff,
      ] :
      role?.toLowerCase().indexOf(CONFIG.roles.projectManager.toLowerCase()) !== -1 ?
        [
          CONFIG.roles.projectManager,
          CONFIG.roles.installer,
          CONFIG.roles.officeStaff
        ] :
        role?.toLowerCase().indexOf(CONFIG.roles.installer.toLowerCase()) !== -1 ?
          [CONFIG.roles.installer] :
          role?.toLowerCase().indexOf(CONFIG.roles.officeStaff.toLowerCase()) !== -1 ?
            [CONFIG.roles.officeStaff] :
            role?.toLowerCase().indexOf(CONFIG.roles.warehouseStaff.toLowerCase()) !== -1 ?
              [CONFIG.roles.warehouseStaff] :
              role?.toLowerCase().indexOf(CONFIG.roles.financialStaff.toLowerCase()) !== -1 ?
                [CONFIG.roles.financialStaff] :
                role?.toLowerCase().indexOf(CONFIG.roles.serviceStaff.toLowerCase()) !== -1 ?
                  [CONFIG.roles.serviceStaff] : [];

export const isSuperAdmin = (role) => role?.toLowerCase().indexOf(CONFIG.roles.superadmin.toLowerCase()) !== -1;
export const isAdministrator = (role) => role?.toLowerCase().indexOf(CONFIG.roles.administrator.toLowerCase()) !== -1;
export const isProjectManager = (role) => role?.toLowerCase().indexOf(CONFIG.roles.projectManager.toLowerCase()) !== -1;
export const isInstaller = (role) => role?.toLowerCase().indexOf(CONFIG.roles.installer.toLowerCase()) !== -1;
export const isOfficeStaff = (role) => role?.toLowerCase().indexOf(CONFIG.roles.officeStaff.toLowerCase()) !== -1;
export const isWarehouseStaff = (role) => role?.toLowerCase().indexOf(CONFIG.roles.warehouseStaff.toLowerCase()) !== -1;
export const isFinancialStaff = (role) => role?.toLowerCase().indexOf(CONFIG.roles.financialStaff.toLowerCase()) !== -1;
export const isServiceStaff = (role) => role?.toLowerCase().indexOf(CONFIG.roles.serviceStaff.toLowerCase()) !== -1;

export const belongsToWorkingStaff = (role) => (
  isSuperAdmin(role) || isAdministrator(role) || isWarehouseStaff(role) || isServiceStaff(role) || isInstaller(role)
);

export const createDefaultPermissions = (role) => {
  const data = {};
  const { system } = CONFIG.permissions;
  const modules = [];
  modules.push({
    name: CONFIG.permissions.moduleDashboards,
    permissions: [
      { name: CONFIG.permissions.operationList },
    ]
  });
  if (!isServiceStaff(role)) {
    modules.push({
      name: CONFIG.permissions.moduleProjects,
      permissions: [
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationDetails },
      ]
    });
  }
  if (isSuperAdmin(role) || isAdministrator(role) || isProjectManager(role)) {
    modules.push({
      name: CONFIG.permissions.moduleUsers,
      permissions: [
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationDetails },
        { name: CONFIG.permissions.operationCreate },
        { name: CONFIG.permissions.operationUpdate },
        { name: CONFIG.permissions.operationDelete },
      ]
    });
  }
  if (isSuperAdmin(role) || isAdministrator(role)) {
    modules.push({
      name: CONFIG.permissions.moduleServices,
      permissions: [
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationDetails },
        { name: CONFIG.permissions.operationCreate },
        { name: CONFIG.permissions.operationUpdate },
        { name: CONFIG.permissions.operationDelete },
        { name: CONFIG.permissions.operationUploadFile },
        { name: CONFIG.permissions.operationDownloadFile },
        { name: CONFIG.permissions.operationRemoveFile },
        { name: CONFIG.permissions.operationEditCalendar },
        { name: CONFIG.permissions.operationEditAddress },
        { name: CONFIG.permissions.operationEditPhoneNumber },
        { name: CONFIG.permissions.operationEditResponsable },
        { name: CONFIG.permissions.operationEditServiceTeam },
        { name: CONFIG.permissions.operationEditStartDate },

      ]
    });
    modules.push({
      name: CONFIG.permissions.moduleSalesOrders,
      permissions: [
        { name: CONFIG.permissions.operationList },
      ]
    });
    modules.push({
      name: CONFIG.permissions.moduleProjects,
      permissions: [
        { name: CONFIG.permissions.operationCreate },
        { name: CONFIG.permissions.operationUpdate },
        { name: CONFIG.permissions.operationDelete },
        { name: CONFIG.permissions.operationDetails },
        { name: CONFIG.permissions.operationEditCalendar },
        { name: CONFIG.permissions.operationEditAddress },
        { name: CONFIG.permissions.operationEditPhoneNumber },
        { name: CONFIG.permissions.operationEditReferenceNumber },
        { name: CONFIG.permissions.operationEditResponsable },
        { name: CONFIG.permissions.operationEditInstaller },
        { name: CONFIG.permissions.operationEditInstallDate },
        { name: CONFIG.permissions.operationEditClosingDate },
        { name: CONFIG.permissions.operationEditUsersAssignees },
        { name: CONFIG.permissions.operationEditHasPermission },
        { name: CONFIG.permissions.operationUploadFile },
        { name: CONFIG.permissions.operationDownloadFile },
        { name: CONFIG.permissions.operationRemoveFile },
      ]
    });
    modules.push({
      name: CONFIG.permissions.moduleTasks,
      permissions: [
        { name: CONFIG.permissions.operationUploadFile },
        { name: CONFIG.permissions.operationDownloadFile },
        { name: CONFIG.permissions.operationRemoveFile },
        { name: CONFIG.permissions.operationEditPriority },
      ]
    });
  }
  if (isSuperAdmin(role)) {
    modules.push({
      name: CONFIG.permissions.moduleTasks,
      permissions: [
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationCreate },
        { name: CONFIG.permissions.operationUpdate },
        { name: CONFIG.permissions.operationDelete },
        { name: CONFIG.permissions.operationDetails },
      ]
    });
    modules.push({
      name: CONFIG.permissions.moduleTaskStages,
      permissions: [
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationCreate },
        { name: CONFIG.permissions.operationUpdate },
        { name: CONFIG.permissions.operationDelete },
        { name: CONFIG.permissions.operationDetails },
      ]
    });
    modules.push({
      name: CONFIG.permissions.moduleRoles,
      permissions: [
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationCreate },
        { name: CONFIG.permissions.operationUpdate },
        { name: CONFIG.permissions.operationDelete },
        { name: CONFIG.permissions.operationDetails },
      ]
    });
    modules.push({
      name: CONFIG.permissions.moduleInstallationStages,
      permissions: [
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationCreate },
        { name: CONFIG.permissions.operationUpdate },
        { name: CONFIG.permissions.operationDelete },
        { name: CONFIG.permissions.operationDetails },
      ]
    });
  }
  if (isInstaller(role)) {
    modules.push({
      name: CONFIG.permissions.moduleTasks,
      permissions: [
        { name: CONFIG.permissions.operationUploadFile },
        { name: CONFIG.permissions.operationDownloadFile },
        { name: CONFIG.permissions.operationRemoveFile },
        { name: CONFIG.permissions.operationDetails },
      ]
    });
    modules.push({
      name: CONFIG.permissions.moduleProjects,
      permissions: [
        { name: CONFIG.permissions.operationUploadFile },
        { name: CONFIG.permissions.operationDownloadFile },
        { name: CONFIG.permissions.operationRemoveFile },
      ]
    });
  }
  if (isServiceStaff(role)) {
    modules.push({
      name: CONFIG.permissions.moduleServices,
      permissions: [
        { name: CONFIG.permissions.operationDetails },
        { name: CONFIG.permissions.operationList },
        { name: CONFIG.permissions.operationCreate},
      ]
    });
  }

  data.system = system;
  data.modules = modules;
  return data;
}