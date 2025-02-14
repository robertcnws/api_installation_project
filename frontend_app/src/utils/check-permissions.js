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