import { useMemo } from 'react';

import { isInstaller, isSuperAdmin, isOfficeStaff, isAdministrator, isProjectManager, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

export function useAvailableUsers(initialUsers, userLogged) {
    return useMemo(() => {
        if (!listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) {
            if (isProjectManager(userLogged?.data?.user_role?.name)) {
                return initialUsers.filter(
                    (user) =>
                        isInstaller(user.userRole.name) || isOfficeStaff(user.userRole.name) || isProjectManager(user.userRole.name)
                );
            }
            return initialUsers.filter(
                (user) => !isSuperAdmin(user.userRole.name)
            );
        }
        if (isAdministrator(userLogged?.data?.user_role?.name)) {
            return initialUsers.filter(
                (user) => !isSuperAdmin(user.userRole.name)
            );
        }
        return initialUsers.filter(
            (user) => !isSuperAdmin(user.userRole.name)
        );
    }, [initialUsers, userLogged]);
}