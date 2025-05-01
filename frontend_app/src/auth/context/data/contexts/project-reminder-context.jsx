import React, { useMemo, useContext, createContext } from 'react';

import { useProjectRemindersQuery } from 'src/_mock/__project_reminders';

import { useAuth } from './user-context';

const ProjectRemindersContext = createContext();
export const useProjectReminders = () => useContext(ProjectRemindersContext);

export function ProjectRemindersProvider({ children }) {

    const { userLogged } = useAuth();

    const {
        data: projectReminders = [],
        refetch: refetchProjectReminders,
    } = useProjectRemindersQuery(userLogged?.data.username);

    const loadedProjectReminders = useMemo(() => projectReminders || [], [projectReminders]);

    const value = useMemo(() => ({
        loadedProjectReminders,
        refetchProjectReminders,
    }), [
        loadedProjectReminders,
        refetchProjectReminders,
    ]);

    return <ProjectRemindersContext.Provider value={value}>{children}</ProjectRemindersContext.Provider>;
}