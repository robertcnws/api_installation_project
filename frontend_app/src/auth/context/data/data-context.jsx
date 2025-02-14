// src/contexts/DataContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CONFIG } from 'src/config-global';
import { _mock } from 'src/_mock/_mock';
import { useProjectsQuery } from 'src/_mock/__projects';
import { useNotificationsQuery } from 'src/_mock/__projects_notifications_users';
import { useUsersQuery } from 'src/_mock/__users';
import { useProjectPermissionsQuery } from 'src/_mock/__project_permissions';
import { useStagesQuery } from 'src/_mock/__stages';
import { useDefaultTasksQuery } from 'src/_mock/__default_tasks';
import { useStagesTaskQuery } from 'src/_mock/__stages_task';
import { useQuery } from '@tanstack/react-query';
import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

const DataContext = createContext();
export const useDataContext = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { data: projects, loading: loadingProjects, error: errorProjects, refetch: refetchProjects } = useProjectsQuery();
  const { data: users, loading: loadingUsers, error: errorUsers } = useUsersQuery();
  const { data: notifications, loading: loadingNotifications, error: errorNotifications } = useNotificationsQuery(userLogged?.data.username, 1, 100);
  const { data: projectPermissions, loading: loadingProjectPermissions, error: errorProjectPermission } = useProjectPermissionsQuery();
  const { data: stages, loading: loadingStages, error: errorStages, refetch: refetchStages } = useStagesQuery();
  const { data: stagesTask, loading: loadingStagesTask, error: errorStagesTask, refetch: refetchStagesTask } = useStagesTaskQuery();
  const { data: defaultTasks, loading: loadingDefaultTasks, error: errorDefaultTasks, refetch: refetchDefaultTasks } = useDefaultTasksQuery();

  const loading = loadingProjects || loadingNotifications || loadingUsers || loadingProjectPermissions;
  const error = errorProjects || errorNotifications || errorUsers || errorProjectPermission;

  const _avatarUsers = useMemo(() => users.map((user, index) => ({
    ...user,
    name: `${user.firstName} ${user.lastName}`,
    avatarUrl: _mock.image.avatar(index),
  })), [users]);

  if (userLogged) {
    userLogged.data.avatarUrl = _avatarUsers.find((user) => user.username === userLogged.data.username)?.avatarUrl;
    userLogged.data.name = _avatarUsers.find((user) => user.username === userLogged.data.username)?.name;
  }

  localStorage.setItem('userLogged', JSON.stringify(userLogged));

  // console.log('1loadedProjects', projects);

  const typedProjects = useMemo(() => projects.map((project) => ({
    ...project,
    type: 'folder',
    userReporter: _avatarUsers.find((user) => user.username === project.userReporter.username),
    usersAssignees: project.usersAssignees.map((user) => ({
      ...user,
      avatarUrl: _avatarUsers.find((u) => u.username === user.username)?.avatarUrl,
    })),
  })), [projects, _avatarUsers]);

  const sortedProjects = useMemo(() => typedProjects.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)), [typedProjects]);

  const loadedNotifications = useMemo(() => notifications || null, [notifications]);
  const loadedProjects = useMemo(() => sortedProjects || [], [sortedProjects]);
  const loadedUsers = useMemo(() => _avatarUsers || [], [_avatarUsers]);
  const loadedProjectPermissions = useMemo(() => projectPermissions || [], [projectPermissions]);

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



  const value = useMemo(
    () => ({
      loadedPermissions,
      refetchPermissions,
      loadedSalesOrders,
      refetchSalesOrders,
      loadedProjects,
      refetchProjects,
      loadedNotifications,
      loadedUsers,
      loadedProjectPermissions,
      loadedStages,
      loadedStagesTask,
      loadedDefaultTasks,
      loading,
      error,
      errorStages,
      loadingStages,
      refetchStages,
      errorStagesTask,
      loadingStagesTask,
      refetchStagesTask,
      errorDefaultTasks,
      loadingDefaultTasks,
      refetchDefaultTasks,
      setLoadedPermissions,
      setLoadedSalesOrders,
    }),
    [
      loadedPermissions,
      refetchPermissions,
      loadedSalesOrders,
      refetchSalesOrders,
      loadedProjects,
      refetchProjects,
      loadedNotifications,
      loadedUsers,
      loadedProjectPermissions,
      loadedStages,
      loadedStagesTask,
      loadedDefaultTasks,
      loading,
      error,
      errorStages,
      loadingStages,
      refetchStages,
      errorStagesTask,
      loadingStagesTask,
      refetchStagesTask,
      errorDefaultTasks,
      loadingDefaultTasks,
      refetchDefaultTasks,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
