import axios from 'axios';
import { useSortable } from '@dnd-kit/sortable';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';
import { deleteTask, updateTask } from 'src/actions/kanban';

import { toast } from 'src/components/snackbar';
import { imageClasses } from 'src/components/image';

import ItemBase from './item-base';
import { KanbanDetails } from '../details/kanban-details';



// ----------------------------------------------------------------------

export function KanbanTaskItem({ 
  service, 
  refetchProject, 
  task, 
  disabled, 
  columnId, 
  sx 
}) {
  const openDetails = useBoolean();

  const { setNodeRef, listeners, isDragging, isSorting, transform, transition } = useSortable({
    id: task?.id,
  });

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const mounted = useMountStatus();

  const mountedWhileDragging = isDragging && !mounted;

  const handleDeleteTask = useCallback(async () => {
    try {
      deleteTask(columnId, task?.id);
      toast.success('Delete success!', { position: 'top-center' });
    } catch (error) {
      console.error(error);
    }
  }, [columnId, task]);

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

  const handleManageTask = useCallback(
    async (taskType) => {
      const updatedTask = { ...task };
      if (!updatedTask) {
        return;
      }
      updatedTask.status = taskType === 'start' || taskType === 'rollback' ? 'in progress' : 'finished';
      updatedTask.percentage = taskType === 'start' || taskType === 'rollback' ? 50 : 100;

      const taskId = updatedTask?.service_default_task._id;
      const serviceId = service?.id;

      try {
        const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${serviceId}/task/${taskId}/change-status/`, {
          userReporter: userLogged?.data,
          status: updatedTask.status,
          percentage: updatedTask.percentage,
        });
        const response = await promise;
        if (!response.data) {
          return;
        }
        refetchProject?.();
      } catch (error) {
        console.error(error);
      }
    }, [userLogged, refetchProject, service, task]);

  return (
    <>
      <ItemBase
        ref={disabled ? undefined : setNodeRef}
        service={service}
        task={task}
        onClick={openDetails.onTrue}
        handleManageTask={handleManageTask}
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

      <KanbanDetails
        service={service}
        refetchProject={refetchProject}
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
