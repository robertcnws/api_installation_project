import { useMemo } from 'react';

export function useSortedStages(stages) {
    const orderedStages = useMemo(() => {
        const sortedStages = [...stages].sort((a, b) => a.order - b.order);
        return sortedStages;
    }, [stages]);

    return useMemo(() => orderedStages || [], [orderedStages]);
}