import { useRef, useMemo, useState, useEffect, useContext, useCallback } from 'react';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSensor,
  DndContext,
  useSensors,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  rectIntersection,
  getFirstCollision,
  MeasuringStrategy,
} from '@dnd-kit/core';

import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { Box, Alert, LinearProgress } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';

import { isInstaller } from 'src/utils/check-permissions';
import { getProjectInstallers } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';
import { moveColumn } from 'src/actions/kanban';
import { varAlpha, hideScrollY } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { kanbanClasses } from '../classes';
import { coordinateGetter } from '../utils';
import { KanbanColumn } from '../column/kanban-column';
import { KanbanTaskItem } from '../item/kanban-task-item';
import { KanbanColumnSkeleton } from '../components/kanban-skeleton';
import { KanbanDragOverlay } from '../components/kanban-drag-overlay';


// ----------------------------------------------------------------------

const PLACEHOLDER_ID = 'placeholder';

// ----------------------------------------------------------------------

export function KanbanView({
  project,
  refetchProject,
  tasks,
  hasPermission,
  listPermissions,
  projectReminders,
}) {

  const { loadedStages } = useDataContext();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [stages, setStages] = useState(null);

  const [hasInstallDate, setHasInstallDate] = useState(false);

  const [installer, setInstaller] = useState(null);

  useEffect(() => {
    if (project) {
      const installWorkOrders = project?.workOrders?.filter((wo) =>
        wo.work_type.name.toLowerCase().includes('installation')
      );
      setHasInstallDate(installWorkOrders.length > 0);
      setInstaller(getProjectInstallers(project, CONFIG));
    }
  }, [project]);

  useEffect(() => {
    if (loadedStages) {
      const actionStages = hasInstallDate && installer ?
        loadedStages.filter((stage) => stage.name.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) === -1) :
        loadedStages.filter((stage) => stage.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
          stage.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
          stage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1);
      if (isInstaller(userLogged?.data?.user_role?.name)) {
        setStages(actionStages.filter((stage) => stage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1));
      } else if (hasPermission) {
        setStages(actionStages);
      } else {
        setStages(actionStages.filter((stage) => stage.name !== CONFIG.stages.permission));
      }
    }
  }, [loadedStages, hasPermission, userLogged, hasInstallDate, installer]);

  const { isMobile } = useContext(LoadingContext)

  const cssVars = {
    '--item-gap': '10px',
    '--item-radius': '12px',
    '--column-gap': '12px',
    '--column-width': isInstaller(userLogged?.data?.user_role?.name) ? '100%' : !isMobile ? (hasPermission ? '19.2%' : '24.3%') : '100%',
    '--column-radius': '16px',
    '--column-padding': '10px 8px 8px 8px',
  };

  const [defaultTasks, setDefaultTasks] = useState(null);

  const tasksBeforeNoMatter = useMemo(() => [
    CONFIG.tasks.orderIsReadyToPickUp.toLowerCase(), CONFIG.tasks.pickUpOrder.toLowerCase()
  ], []);

  // console.log('tasksBeforeNoMatter', tasksBeforeNoMatter);

  useEffect(() => {
    if (tasks) {
      const initialTasks = tasks.map((task) => ({
        ...task,
        beforeNoMatter: tasksBeforeNoMatter.includes(task.project_default_task.name.toLowerCase()),
      }));
      if (isInstaller(userLogged?.data?.user_role?.name)) {
        const selectedTasks = initialTasks.filter(
          (task) => task.project_default_task.project_stage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
        );
        const finalTasks = selectedTasks.filter(
          (task) => task.project_default_task.name.toLowerCase().includes('start') ||
            task.project_default_task.name.toLowerCase().includes('finish')
        );
        const withUsersTasks = finalTasks.filter(
          (task) => task.users_assignees.length > 0
        );
        setDefaultTasks(withUsersTasks);
      } else {
        setDefaultTasks(initialTasks);
      }
    }
  }, [tasks, userLogged, tasksBeforeNoMatter]);

  const newBoard = useMemo(
    () => adaptToKanbanData(defaultTasks, stages),
    [defaultTasks, stages]
  );

  const percentage = useMemo(() => {
    if (newBoard) {
      const totalTasks = Object.values(newBoard.tasks).flat().length;
      const sumPercentage = Object.values(newBoard.tasks).flat().reduce((acc, task) => acc + task.percentage, 0);
      return totalTasks > 0 ? sumPercentage / totalTasks : 0;
    }
    return 0;
  }, [newBoard]);

  const [board, setBoard] = useState(null);
  const [columnIds, setColumnIds] = useState([]);
  const [isSortingContainer, setIsSortingContainer] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardEmpty, setBoardEmpty] = useState(false);

  useEffect(() => {
    if (newBoard?.columns && newBoard?.tasks) {
      setBoard(newBoard);
      const newColumnIds = newBoard.columns.map((column) => column.id);
      setColumnIds(newColumnIds);
    }
  }, [newBoard]);

  useEffect(() => {
    setIsSortingContainer(activeId ? columnIds.includes(activeId) : false);
  }, [activeId, columnIds]);

  useEffect(() => {
    if (board) {
      setBoardEmpty(board.columns.length === 0);
      setBoardLoading(false);
    }
  }, [board]);

  const [columnFixed, setColumnFixed] = useState(true);

  const recentlyMovedToNewContainer = useRef(false);

  const lastOverId = useRef(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter })
  );

  const collisionDetectionStrategy = useCallback(
    (args) => {
      if (activeId && activeId in board.tasks) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (column) => column.id in board.tasks
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);

      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
          pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (overId in board.tasks) {
          const columnItems = board.tasks[overId].map((task) => task.id);

          // If a column is matched and it contains items (columns 'A', 'B', 'C')
          if (columnItems.length > 0) {
            // Return the closest droppable within that column
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (column) => column.id !== overId && columnItems.includes(column.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, board?.tasks]
  );

  const findColumn = (id) => {
    if (id in board.tasks) {
      return id;
    }

    return Object.keys(board.tasks).find((key) =>
      board.tasks[key].map((task) => task.id).includes(id)
    );
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, []);

  /**
   * onDragStart
   */
  const onDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  /**
   * onDragOver
   */
  const onDragOver = ({ active, over }) => {
    const overId = over?.id;

    if (overId == null || active.id in board.tasks) {
      return;
    }

    const overColumn = findColumn(overId);

    const activeColumn = findColumn(active.id);

    if (!overColumn || !activeColumn) {
      return;
    }

    if (activeColumn !== overColumn) {
      const activeItems = board.tasks[activeColumn].map((task) => task.id);
      const overItems = board.tasks[overColumn].map((task) => task.id);
      const overIndex = overItems.indexOf(overId);
      const activeIndex = activeItems.indexOf(active.id);

      let newIndex;

      if (overId in board.tasks) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;

        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      recentlyMovedToNewContainer.current = true;

      const updateTasks = {
        ...board.tasks,
        [activeColumn]: board.tasks[activeColumn].filter((task) => task.id !== active.id),
        [overColumn]: [
          ...board.tasks[overColumn].slice(0, newIndex),
          board.tasks[activeColumn][activeIndex],
          ...board.tasks[overColumn].slice(newIndex, board.tasks[overColumn].length),
        ],
      };

      // moveTask(updateTasks);
    }
  };

  /**
   * onDragEnd
   */
  const onDragEnd = ({ active, over }) => {
    if (active.id in board.tasks && over?.id) {
      const activeIndex = columnIds.indexOf(active.id);
      const overIndex = columnIds.indexOf(over.id);

      const updateColumns = arrayMove(board.columns, activeIndex, overIndex);

      moveColumn(updateColumns);
    }

    const activeColumn = findColumn(active.id);

    if (!activeColumn) {
      setActiveId(null);
      return;
    }

    const overId = over?.id;

    if (overId == null) {
      setActiveId(null);
      return;
    }

    const overColumn = findColumn(overId);

    if (overColumn) {
      const activeContainerTaskIds = board.tasks[activeColumn].map((task) => task.id);
      const overContainerTaskIds = board.tasks[overColumn].map((task) => task.id);

      const activeIndex = activeContainerTaskIds.indexOf(active.id);
      const overIndex = overContainerTaskIds.indexOf(overId);

      if (activeIndex !== overIndex) {
        const updateTasks = {
          ...board.tasks,
          [overColumn]: arrayMove(board.tasks[overColumn], activeIndex, overIndex),
        };

        // moveTask(updateTasks);
      }
    }

    setActiveId(null);
  };

  const renderLoading = (
    <Stack direction="row" alignItems="flex-start" sx={{ gap: 'var(--column-gap)' }}>
      <KanbanColumnSkeleton />
    </Stack>
  );

  const renderEmpty = <EmptyContent filled sx={{ ml: !isMobile ? -5 : 0, py: 10, maxHeight: { md: 480 } }} />;

  const renderList = (
    // <Typography variant="h4">HOlaaaaa</Typography>
    <DndContext
      id="dnd-kanban"
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >

      <Stack sx={{
        flex: '1 1 auto',
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: 640,
        ml: !isMobile ? -5 : 0,
        mt: !isMobile ? -1 : 0,
        mr: !isMobile ? -5 : 0,
      }}>
        <Stack
          sx={{
            pb: 1,
            display: 'unset',
            ...(columnFixed && { minHeight: 0, display: 'flex', flex: '1 1 auto' }),
          }}
        >
          <Stack
            direction="row"
            sx={{
              gap: 'var(--column-gap)',
              ...(columnFixed && {
                minHeight: 0,
                flex: '1 1 auto',
                [`& .${kanbanClasses.columnList}`]: { ...hideScrollY, flex: '1 1 auto' },
              }),
            }}
          >
            <SortableContext
              items={[...columnIds, PLACEHOLDER_ID]}
              strategy={horizontalListSortingStrategy}
            >
              {board?.columns.map((column) => (
                <KanbanColumn key={column.id} column={column} tasks={board.tasks[column.id].sort(
                  (a, b) => a.project_default_task.order - b.project_default_task.order
                )}>
                  <SortableContext
                    items={board.tasks[column.id]}
                    strategy={verticalListSortingStrategy}
                  >
                    {board.tasks[column.id].map((task) => (
                      <KanbanTaskItem
                        project={project}
                        refetchProject={refetchProject}
                        task={task}
                        key={task.id}
                        columnId={column.id}
                        disabled={isSortingContainer}
                        listPermissions={listPermissions}
                        projectReminders={projectReminders}
                      />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              ))}
              {(!hasInstallDate || !installer) && (
                <>
                  {!hasInstallDate && (
                    <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
                      You must define the some INSTALLATION WORK ORDER to see other tasks.
                    </Alert>
                  )}
                  {!installer && (
                    <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
                      You must assign an INSTALLER to the some WORK ORDER to see other tasks.
                    </Alert>
                  )}
                </>
              )}

              {/* <KanbanColumnAdd id={PLACEHOLDER_ID} /> */}
            </SortableContext>
          </Stack>
        </Stack>
      </Stack>

      <KanbanDragOverlay
        columns={board?.columns}
        tasks={board?.tasks}
        activeId={activeId}
        sx={cssVars}
      />
    </DndContext>
  );

  return (
    <DashboardContent
      maxWidth={false}
      sx={{
        ...cssVars,
        pb: 0,
        pl: { sm: 3 },
        pr: { sm: 0 },
        flex: '1 1 0',
        display: 'flex',
        maxHeight: '100%',
        // overflowY: 'auto',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ pr: { sm: 1 }, mb: { xs: 1, md: 1 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', ml: !isMobile ? -5 : 0, mt: !isMobile ? -5 : 0, mb: 1 }}>
          <div>
            <Box sx={{ mb: 1, gap: 0.5, display: 'flex', alignItems: 'center', typography: 'subtitle2', flexDirection: 'row', width: '100%' }}>
              <Box component="span" sx={{ flexGrow: 1 }}>
                Installation Progress
              </Box>
              {/* <Box component="span">{fCurrency(100)}</Box> */}
              <Box component="span" sx={{
                color: percentage === 0 ? 'grey.500' :
                  percentage > 0 && percentage < 100 ? 'warning.main' : 'success.main'
              }}>
                ({percentage.toFixed(2)} %)
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={percentage}
              color={
                (percentage === 0 && 'error') ||
                (percentage > 0 && percentage < 100 && 'warning') ||
                (percentage === 100 && 'success') ||
                'primary'
              }
              sx={{
                height: 8,
                bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
              }}
            />
          </div>
        </Box>

        <FormControlLabel
          label="Column fixed"
          labelPlacement="start"
          control={
            <Switch
              checked={columnFixed}
              onChange={(event) => {
                setColumnFixed(event.target.checked);
              }}
              inputProps={{ id: 'column-fixed-switch' }}
            />
          }
          sx={{ ml: !isMobile ? -5 : 0, mt: !isMobile ? -5 : 0, mr: !isMobile ? -5 : 0, }}
        />
      </Stack>

      {defaultTasks && defaultTasks.length === 0 ? renderEmpty : boardLoading ? renderLoading : renderList}

    </DashboardContent>
  );
}


function adaptToKanbanData(projectTasks, stages) {
  const columns = [];
  const tasks = {};

  stages?.forEach((stage) => {
    columns.push({
      id: stage.id,
      name: stage.name,
    });
    tasks[stage.id] = [];
  });

  projectTasks?.forEach((task) => {
    const colId = task.project_default_task.project_stage.id;
    if (colId && tasks[colId]) {
      tasks[colId].push({
        ...task,
        id: task.project_default_task.id,
        name: task.project_default_task.name,
        description: task.project_default_task.description,
        priority: task.priority,
        percentage: task.percentage,
      });
    }
  });

  return {
    columns,
    tasks,
  };
}


