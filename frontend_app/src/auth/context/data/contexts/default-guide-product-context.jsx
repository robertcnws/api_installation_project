import React, { useMemo, useContext, createContext } from 'react';

import { useDefaultGuideProductsQuery } from 'src/_mock/__default_guide_products';

import { useOrderedDefaultGuideProducts } from '../hooks/use-ordered-default-guide-products';

const DefaultGuideProductsContext = createContext();
export const useDefaultGuideProducts = () => useContext(DefaultGuideProductsContext);

export function DefaultGuideProductsProvider({ children }) {
  const { 
    data: defaultGuideProducts = [], 
    refetch: refetchDefaultGuideProducts, 
    loading: loadingDefaultGuideProducts, 
    error: errorDefaultGuideProducts 
  } = useDefaultGuideProductsQuery();

  const loadedDefaultGuideProducts = useOrderedDefaultGuideProducts(defaultGuideProducts);

  const value = useMemo(() => ({ 
    loadedDefaultGuideProducts, 
    refetchDefaultGuideProducts, 
    loadingDefaultGuideProducts, 
    errorDefaultGuideProducts 
}), [
    loadedDefaultGuideProducts, 
    refetchDefaultGuideProducts, 
    loadingDefaultGuideProducts, 
    errorDefaultGuideProducts 
]);

  return <DefaultGuideProductsContext.Provider value={value}>{children}</DefaultGuideProductsContext.Provider>;
}