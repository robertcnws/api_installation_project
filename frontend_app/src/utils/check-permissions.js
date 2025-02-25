import { CONFIG } from 'src/config-global';

export const verifyPermissions = (permissions, system, module, operation) => {
  if (!permissions) {
    return false;
  }
  return permissions?.some((permission) =>
    permission?.module_system?.system?.name.includes(system) &&
    permission?.module_system?.name.includes(module) &&
    permission?.name.includes(operation)
  );
}

export const verifyRole = (roles, role) => {
  if (!roles) {
    return false;
  }
  return roles?.some((r) => r.name.includes(role));
}


export const listRolesAndSubroles = (role) =>
  role?.indexOf(CONFIG.roles.superadmin) !== -1 ?
    [CONFIG.roles.superadmin, CONFIG.roles.manager, CONFIG.roles.installer, CONFIG.roles.seller, CONFIG.roles.client] :
    role?.indexOf(CONFIG.roles.manager) !== -1 ?
      [CONFIG.roles.manager, CONFIG.roles.installer, CONFIG.roles.seller, CONFIG.roles.client] :
      role?.indexOf(CONFIG.roles.installer) !== -1 ?
        [CONFIG.roles.installer] :
        role?.indexOf(CONFIG.roles.seller) !== -1 ?
          [CONFIG.roles.seller] :
          role?.indexOf(CONFIG.roles.client) !== -1 ?
            [CONFIG.roles.client] : [];