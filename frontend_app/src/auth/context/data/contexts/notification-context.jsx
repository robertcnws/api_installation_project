import React, { useMemo, useContext, createContext } from 'react';

import { useNotificationsQuery } from 'src/_mock/__projects_notifications_users';

import { useAuth } from './user-context';

const NotificationsContext = createContext();
export const useNotifications = () => useContext(NotificationsContext);

export function NotificationsProvider({ children }) {
    const { userLogged, loadedUsers } = useAuth();

    const {
        data: notifications,
        loading: loadingNotifications,
        error: errorNotifications,
        refetch: refetchNotifications
    } = useNotificationsQuery(null, userLogged?.data.username, 1, 100);


    const loadedNotifications = useMemo(() => notifications || null, [notifications]);

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