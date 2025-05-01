import { useMemo } from 'react';

export function useOrderedDefaultGuideProducts(defaultGuideProducts) {
    const orderedDefaultGuideProducts = useMemo(() => {
        const sortedDefaultGuideProducts = [...defaultGuideProducts].sort((a, b) => a.order - b.order);
        return sortedDefaultGuideProducts;
    }, [defaultGuideProducts]);

    return useMemo(() => orderedDefaultGuideProducts || [], [orderedDefaultGuideProducts]);
}