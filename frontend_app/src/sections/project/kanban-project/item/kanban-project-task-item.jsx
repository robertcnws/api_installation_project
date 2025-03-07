import { useSortable } from '@dnd-kit/sortable';
import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { deleteTask, updateTask } from 'src/actions/kanban';

import { toast } from 'src/components/snackbar';
import { imageClasses } from 'src/components/image';

import ItemBase from './item-base';
import { KanbanProjectDetails } from '../details/kanban-project-details';

// ----------------------------------------------------------------------

export function KanbanProjectTaskItem({ task, disabled, columnId, sx }) {
  const openDetails = useBoolean();

  const router = useRouter();

  const { setNodeRef, listeners, isDragging, isSorting, transform, transition } = useSortable({
    id: task?.id,
  });

  const mounted = useMountStatus();

  const mountedWhileDragging = isDragging && !mounted;

  const handleDeleteTask = useCallback(async () => {
    try {
      deleteTask(columnId, task.id);
      toast.success('Delete success!', { position: 'top-center' });
    } catch (error) {
      console.error(error);
    }
  }, [columnId, task.id]);

  const handleUpdateTask = useCallback(
    async (taskData) => {
      try {
        updateTask(columnId, taskData);
      } catch (error) {
        console.error(error);
      }
    },
    [columnId]
  );

  return (
    <>
      <ItemBase
        ref={disabled ? undefined : setNodeRef}
        task={task}
        onClick={
          () => {
            localStorage.setItem('projectId', task.id)
            router.push(paths.dashboard.project.details(task.id))
          }
        }
        stateProps={{
          transform,
          listeners,
          transition,
          sorting: isSorting,
          dragging: isDragging,
          fadeIn: mountedWhileDragging,
        }}
        sx={{ ...(openDetails.value && { [`& .${imageClasses.root}`]: { opacity: 0.8 } }), ...sx }}
      />

      <KanbanProjectDetails
        task={task}
        openDetails={openDetails.value}
        onCloseDetails={openDetails.onFalse}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);

    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}
