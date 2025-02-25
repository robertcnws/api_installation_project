import { useState, useEffect } from 'react';
import { DragOverlay as DndDragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';

import Portal from '@mui/material/Portal';

import ItemBase from '../item/item-base';
import ColumnBase from '../column/column-base';
import { KanbanProjectColumnToolBar } from '../column/kanban-project-column-toolbar';


const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
};

// ----------------------------------------------------------------------

export function KanbanProjectDragOverlay({ columns, tasks, activeId, sx }) {
  const columnIds = columns?.map((column) => column.id);

  const activeColumn = columns?.find((column) => column.id === activeId);

  const [allTasks, setAllTasks] = useState([]);

  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    if (columns && tasks) {
      const all = Object.values(tasks).flat();
      setAllTasks(all);
    }
  }
  , [columns, tasks]);

  useEffect(() => {
    if (allTasks && activeId) {
      const activeT = allTasks.find((task) => task.id === activeId);
      setActiveTask(activeT);
    }
  }, [allTasks, activeId]);

  return (
    <Portal>
      <DndDragOverlay adjustScale={false} dropAnimation={dropAnimation}>
        {activeId ? (
          <>
            {columnIds.includes(activeId) ? (
              <ColumnOverlay column={activeColumn} tasks={tasks[activeId]} sx={sx} />
            ) : (
              <TaskItemOverlay task={activeTask} sx={sx} />
            )}
          </>
        ) : null}
      </DndDragOverlay>
    </Portal>
  );
}

// ----------------------------------------------------------------------

export function ColumnOverlay({ column, tasks, sx }) {
  return (
    <ColumnBase
      slots={{
        header: <KanbanProjectColumnToolBar columnName={column.name} totalTasks={tasks.length} />,
        main: tasks.map((task) => <ItemBase key={task.id} task={task} />),
      }}
      stateProps={{ dragOverlay: true }}
      sx={sx}
    />
  );
}

// ----------------------------------------------------------------------

export function TaskItemOverlay({ task, sx }) {
  return <ItemBase task={task} sx={sx} stateProps={{ dragOverlay: true }} />;
}
