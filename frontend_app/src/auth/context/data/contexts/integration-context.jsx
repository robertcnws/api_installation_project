import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { CONFIG } from 'src/config-global';

import { useAuth } from './user-context';
import { useProjects } from './project-context';

const IntegrationContext = createContext();
export const useIntegration = () => useContext(IntegrationContext);

export function IntegrationProvider({ children }) {
  const { userLogged } = useAuth();

  const { loadedProjects } = useProjects();

  const { data: permissions = { results: [] }, refetch: refetchPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => axios.get(`${CONFIG.apiUrl}/integration/list_users_permissions/`, { params: { username: userLogged.data.username } }).then(r => r.data),
    refetchOnWindowFocus: false,
  });

  const [loadedPermissions, setLoadedPermissions] = useState(permissions);

  useEffect(() => {
    if (permissions?.results) {
      setLoadedPermissions(permissions);
    }
  }, [permissions]);

  // const not_sales_order_ids = useMemo(
  //   () => loadedProjects?.map((project) => project.salesOrder.salesorder_id).join(','),
  //   [loadedProjects]
  // );

  const not_sales_order_ids = loadedProjects.map(p => p.salesOrder.salesorder_id).join(',');

  const salesOrdersQueryKey = ['salesOrders', not_sales_order_ids];
  const salesOrdersParams = { not_sales_order_ids };
  const salesOrdersEnabled = loadedProjects.length > 0;

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

  const [loadedSalesOrders, setLoadedSalesOrders] = useState([]);

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

  // const loadedSalesOrders = useMemo(() => {
  //   if (!salesOrders?.results) return { results: [] };
  //   const sorted = [...salesOrders.results].sort((a, b) => new Date(b.date) - new Date(a.date));
  //   const unique = Array.from(new Map(sorted.map(o => [o.salesorder_id, o])).values());
  //   return { ...salesOrders, results: unique };
  // }, [salesOrders]);


  const listPermissions = useMemo(() => {
    if (loadedPermissions && userLogged) {
      const results = loadedPermissions?.results;
      const permits = results?.filter((item) => item.username === userLogged?.data.username);
      return permits[0]?.permissions;
    }
    return [];
  }, [loadedPermissions, userLogged]);

  const stableRefetchPermissions = useCallback(() => refetchPermissions(), [refetchPermissions]);
  const stableSetLoadedSalesOrders = useCallback(
    (orders) => setLoadedSalesOrders(orders),
    [setLoadedSalesOrders]
  );



  const value = useMemo(
    () => ({
      loadedPermissions,
      listPermissions,
      refetchPermissions: stableRefetchPermissions,
      loadedSalesOrders,
      setLoadedSalesOrders: stableSetLoadedSalesOrders,
      isLoadingSalesOrders,
    }),
    [
      loadedPermissions,
      listPermissions,
      stableRefetchPermissions,
      loadedSalesOrders,
      stableSetLoadedSalesOrders,
      isLoadingSalesOrders,
    ]
  );

  return <IntegrationContext.Provider value={value}>{children}</IntegrationContext.Provider>;
}
