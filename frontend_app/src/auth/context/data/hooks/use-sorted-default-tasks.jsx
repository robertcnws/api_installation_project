import { useMemo } from 'react';

export function useSortedDefaultTasks(defaultTasks) {
    const orderedDefaultTasks = useMemo(() => {
        const sortedDefaultTasks = [...defaultTasks].sort((a, b) => a.order - b.order);
        const newDefaultTasks = sortedDefaultTasks?.map((task) => ({
            ...task,
            number: `T-${String(task.order).padStart(3, "0")}`,
        }));
        return newDefaultTasks;
    }, [defaultTasks]);

    return useMemo(() => orderedDefaultTasks || [], [orderedDefaultTasks]);
}