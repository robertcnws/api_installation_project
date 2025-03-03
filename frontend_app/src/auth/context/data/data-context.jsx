// src/contexts/DataContext.jsx
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect, useContext, createContext } from 'react';

import { _mock } from 'src/_mock/_mock';
import { CONFIG } from 'src/config-global';
import { useUsersQuery } from 'src/_mock/__users';
import { useStagesQuery } from 'src/_mock/__stages';
import { useProjectsQuery } from 'src/_mock/__projects';
import { useUserRolesQuery } from 'src/_mock/__user_roles';
import { useStagesTaskQuery } from 'src/_mock/__stages_task';
import { useDefaultTasksQuery } from 'src/_mock/__default_tasks';
import { useProjectPermissionsQuery } from 'src/_mock/__project_permissions';
import { useNotificationsQuery } from 'src/_mock/__projects_notifications_users';
import { fIsAfter } from 'src/utils/format-time';
import { isAdministrator, isInstaller, isProjectManager, isOfficeStaff, isSuperAdmin, listRolesAndSubroles } from 'src/utils/check-permissions';


const DataContext = createContext();
export const useDataContext = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    data: projects,
    loading: loadingProjects,
    error: errorProjects,
    refetch: refetchProjects
  } = useProjectsQuery();
  const {
    data: users,
    loading: loadingUsers,
    error: errorUsers,
    refetch: refetchUsers
  } = useUsersQuery();
  const {
    data: notifications,
    loading: loadingNotifications,
    error: errorNotifications,
    refetch: refetchNotifications
  } = useNotificationsQuery(null, userLogged?.data.username, 1, 100);
  const {
    data: projectPermissions,
    loading: loadingProjectPermissions,
    error: errorProjectPermission
  } = useProjectPermissionsQuery();
  const {
    data: stages,
    loading: loadingStages,
    error: errorStages,
    refetch: refetchStages
  } = useStagesQuery();
  const {
    data: stagesTask,
    loading: loadingStagesTask,
    error: errorStagesTask,
    refetch: refetchStagesTask
  } = useStagesTaskQuery();
  const {
    data: defaultTasks,
    loading: loadingDefaultTasks,
    error: errorDefaultTasks,
    refetch: refetchDefaultTasks
  } = useDefaultTasksQuery();
  const {
    data: userRoles,
    loading: loadingUserRoles,
    error: errorUserRoles,
    refetch: refetchUserRoles
  } = useUserRolesQuery(['Superadmin']);

  const loading = loadingProjects || loadingNotifications || loadingUsers || loadingProjectPermissions;
  const error = errorProjects || errorNotifications || errorUsers || errorProjectPermission;

  const _avatarUsers = useMemo(() => users.map((user, index) => ({
    ...user,
    name: `${user.firstName} ${user.lastName}`,
    avatarUrl: user.avatarUrl ? user.avatarUrl : _mock.image.avatar(index),
  })), [users]);

  if (userLogged) {
    userLogged.data.avatarUrl = _avatarUsers.find((user) => user.username === userLogged.data.username)?.avatarUrl;
    userLogged.data.name = _avatarUsers.find((user) => user.username === userLogged.data.username)?.name;
  }

  localStorage.setItem('userLogged', JSON.stringify(userLogged));

  const typedProjects = useMemo(() => projects.map((project) => ({
    ...project,
    type: 'folder',
    userReporter: _avatarUsers.find((user) => user.username === project.userReporter.username),
    usersAssignees: project.usersAssignees.map((user) => ({
      ...user,
      avatarUrl: _avatarUsers.find((u) => u.username === user.username)?.avatarUrl,
    })),
  })), [projects, _avatarUsers]);

  const sortedProjects = useMemo(() => typedProjects.sort((a, b) => fIsAfter(a.startDate, b.startDate)), [typedProjects]);

  let finalProjects = useMemo(() => sortedProjects, [sortedProjects]);

  if (!listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) {
    finalProjects = sortedProjects.filter((project) =>
      project.usersAssignees.some((user) => user.username === userLogged?.data.username) ||
      project.userManager.username === userLogged?.data.username
    );
    if (userLogged?.data.user_role.name.toLowerCase().indexOf(CONFIG.roles.installer.toLowerCase()) !== -1) {
      finalProjects = sortedProjects.filter((project) =>
        project.currentStage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
      );
    }
  }

  const finalUsers = useMemo(() => {
    if (!listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) {
      if (isProjectManager(userLogged?.data?.user_role?.name)) {
        return _avatarUsers.filter(
          (user) =>
            isInstaller(user.userRole.name) || isOfficeStaff(user.userRole.name) 
        );
      }
      return _avatarUsers.filter(
        (user) => !isSuperAdmin(user.userRole.name)
      );
    }
    if (isAdministrator(userLogged?.data?.user_role?.name)) {
      return _avatarUsers.filter(
        (user) => !isSuperAdmin(user.userRole.name) && !isAdministrator(user.userRole.name)
      );
    }
    return _avatarUsers.filter(
      (user) => !isSuperAdmin(user.userRole.name)
    );
  }, [_avatarUsers, userLogged]);


  const finalUserRoles = useMemo(() => {
    if (!isSuperAdmin(userLogged?.data?.user_role?.name)) {
      const possibleRoles = listRolesAndSubroles(userLogged?.data?.user_role?.name).filter(
        (role) => role !== userLogged?.data?.user_role?.name
      );
      return userRoles.filter((role) => possibleRoles.includes(role.name));
    }
    return userRoles;
  }, [userRoles, userLogged]);

  const loadedNotifications = useMemo(() => notifications || null, [notifications]);
  const loadedProjects = useMemo(() => finalProjects || [], [finalProjects]);
  const loadedUsers = useMemo(() => finalUsers || [], [finalUsers]);
  const loadedProjectPermissions = useMemo(() => projectPermissions || [], [projectPermissions]);
  const loadedUserRoles = useMemo(() => finalUserRoles || [], [finalUserRoles]);

  const orderedStages = useMemo(() => {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    return sortedStages;
  }, [stages]);

  const loadedStages = useMemo(() => orderedStages || [], [orderedStages]);

  const orderedStagesTask = useMemo(() => {
    const sortedStagesTask = [...stagesTask].sort((a, b) => a.order - b.order);
    return sortedStagesTask;
  }, [stagesTask]);

  const loadedStagesTask = useMemo(() => orderedStagesTask || [], [orderedStagesTask]);

  const orderedDefaultTasks = useMemo(() => {
    const sortedDefaultTasks = [...defaultTasks].sort((a, b) => a.order - b.order);
    const newDefaultTasks = sortedDefaultTasks.map((task) => ({
      ...task,
      number: `T-${String(task.order).padStart(3, "0")}`,
    }));
    return newDefaultTasks;
  }, [defaultTasks]);

  const loadedDefaultTasks = useMemo(() => orderedDefaultTasks || [], [orderedDefaultTasks]);

  const not_sales_order_ids = useMemo(
    () => loadedProjects?.map((project) => project.salesOrder.salesorder_id).join(','),
    [loadedProjects]
  );

  // console.log('loadedProjects', loadedProjects);

  const { data: permissions, error: errorPermissions, isLoading: isLoadingPermissions, refetch: refetchPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () =>
      axios
        .get(`${CONFIG.apiUrl}/integration/list_users_permissions/`, {
          params: { username: userLogged?.data.username },
        })
        .then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const salesOrdersQueryKey = !not_sales_order_ids ? ['salesOrders'] : ['salesOrders', not_sales_order_ids];
  const salesOrdersParams = !not_sales_order_ids ? {} : { not_sales_order_ids };
  const salesOrdersEnabled = !not_sales_order_ids ? true : !!not_sales_order_ids;

  const { data: salesOrders, error: errorSalesOrders, isLoading: isLoadingSalesOrders, refetch: refetchSalesOrders } = useQuery({
    queryKey: salesOrdersQueryKey,
    queryFn: async () => {
      try {
        const res = await axios.get(`${CONFIG.apiUrl}/integration/list_sales_orders/`, {
          params: salesOrdersParams,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });
        return res.data;
      } catch (err) {
        return console.error(err);
      }
    },
    refetchOnWindowFocus: false,
    enabled: salesOrdersEnabled,
  });

  const [loadedPermissions, setLoadedPermissions] = useState(permissions);
  const [loadedSalesOrders, setLoadedSalesOrders] = useState(salesOrders);

  useEffect(() => {
    setLoadedPermissions(permissions);
  }, [permissions]);

  useEffect(() => {
    if (salesOrders) {
      const sortedSalesOrdersResults = [...salesOrders.results].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const uniqueMap = new Map();
      sortedSalesOrdersResults.forEach(order => {
        uniqueMap.set(order.salesorder_id, order);
      });
      const uniqueSalesOrdersArray = Array.from(uniqueMap.values());
      const sortedSalesOrders = { ...salesOrders, results: uniqueSalesOrdersArray };
      setLoadedSalesOrders(sortedSalesOrders);
    }
  }, [salesOrders]);


  const listPermissions = useMemo(() => {
    if (loadedPermissions && userLogged) {
      const results = loadedPermissions?.results;
      const permits = results?.filter((item) => item.username === userLogged?.data.username);
      return permits[0].permissions;
    }
    return [];
  }, [loadedPermissions, userLogged]);



  const value = useMemo(
    () => ({
      loadedPermissions,
      refetchPermissions,
      loadedSalesOrders,
      refetchSalesOrders,
      loadedProjects,
      refetchProjects,
      loadedNotifications,
      refetchNotifications,
      loadedUsers,
      refetchUsers,
      loadedProjectPermissions,
      loadedStages,
      loadedStagesTask,
      loadedDefaultTasks,
      loadedUserRoles,
      loading,
      error,
      errorStages,
      loadingStages,
      refetchStages,
      errorStagesTask,
      loadingStagesTask,
      refetchStagesTask,
      loadingUserRoles,
      errorUserRoles,
      refetchUserRoles,
      errorDefaultTasks,
      loadingDefaultTasks,
      refetchDefaultTasks,
      setLoadedPermissions,
      setLoadedSalesOrders,
      listPermissions,
    }),
    [
      loadedPermissions,
      refetchPermissions,
      loadedSalesOrders,
      refetchSalesOrders,
      loadedProjects,
      refetchProjects,
      loadedNotifications,
      refetchNotifications,
      loadedUsers,
      refetchUsers,
      loadedProjectPermissions,
      loadedStages,
      loadedStagesTask,
      loadedDefaultTasks,
      loadedUserRoles,
      loading,
      error,
      errorStages,
      loadingStages,
      refetchStages,
      errorStagesTask,
      loadingStagesTask,
      refetchStagesTask,
      loadingUserRoles,
      errorUserRoles,
      refetchUserRoles,
      errorDefaultTasks,
      loadingDefaultTasks,
      refetchDefaultTasks,
      listPermissions,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
