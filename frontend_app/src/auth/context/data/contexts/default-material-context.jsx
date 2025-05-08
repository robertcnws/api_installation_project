import React, { useMemo, useContext, createContext } from 'react';

import { useDefaultMaterialsQuery } from 'src/_mock/__default_materials';

const DefaultMaterialsContext = createContext();
export const useDefaultMaterials = () => useContext(DefaultMaterialsContext);

export function DefaultMaterialsProvider({ children }) {
  const { 
    data: defaultMaterials = [], 
    refetch: refetchDefaultMaterials, 
    loading: loadingDefaultMaterials, 
    error: errorDefaultMaterials 
  } = useDefaultMaterialsQuery();

  const loadedDefaultMaterials = useMemo(() => defaultMaterials, [defaultMaterials]);

  const value = useMemo(() => ({ 
    loadedDefaultMaterials, 
    refetchDefaultMaterials, 
    loadingDefaultMaterials, 
    errorDefaultMaterials 
}), [
    loadedDefaultMaterials, 
    refetchDefaultMaterials, 
    loadingDefaultMaterials, 
    errorDefaultMaterials 
]);

  return <DefaultMaterialsContext.Provider value={value}>{children}</DefaultMaterialsContext.Provider>;
}