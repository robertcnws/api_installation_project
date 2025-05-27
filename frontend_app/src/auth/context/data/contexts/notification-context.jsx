import React, { useMemo, useContext, createContext } from 'react';

import { useNotificationsQuery } from 'src/_mock/__projects_notifications_users';

import { useAuth } from './user-context';

import { useProjects } from './project-context';
import { useServices } from './service-context';
import { useMeasurements } from './measurement-context';
import { useFilteredNotifications } from '../hooks/use-filtered-notifications';

const NotificationsContext = createContext();
export const useNotifications = () => useContext(NotificationsContext);

export function NotificationsProvider({ children }) {

    const { userLogged } = useAuth();

    const { loadedProjects = [] } = useProjects() || {};

    const { loadedServices = []} = useServices() || {};

    const { loadedMeasurements =[] } = useMeasurements() || {};

    const {
        data: notifications,
        loading: loadingNotifications,
        error: errorNotifications,
        refetch: refetchNotifications
    } = useNotificationsQuery(null, userLogged?.data.username, 1, 100);


    const filteredNotifications = useFilteredNotifications(
        notifications,
        loadedProjects,
        loadedServices,
        loadedMeasurements,
        userLogged
    );

    const loadedNotifications = useMemo(() => filteredNotifications || null, [filteredNotifications]);

    const value = useMemo(() => ({
        loadedNotifications,
        refetchNotifications,
        loadingNotifications,
        errorNotifications
    }), [
        loadedNotifications,
        refetchNotifications,
        loadingNotifications,
        errorNotifications
    ]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}