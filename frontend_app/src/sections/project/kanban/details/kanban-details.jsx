import dayjs from 'dayjs';
import axios from 'axios';
import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { InputBase } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';

import { KanbanDetailsToolbar } from './kanban-details-toolbar';
import { KanbanDetailsCommentInput } from './kanban-details-comment-input';
import { KanbanContactsDialog } from '../components/kanban-contacts-dialog';
import { ProjectTaskDetailsPriority } from '../../project-task-details-priority';
import { KanbanDetailsTaskAttachments } from './kanban-details-task-attachments';

// ----------------------------------------------------------------------

const SUBTASKS = [
  'Complete project proposal',
  'Conduct market research',
  'Design user interface mockups',
  'Develop backend api',
  'Implement authentication system',
];

const StyledLabel = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  width: 100,
  flexShrink: 0,
  color: theme.vars.palette.text.secondary,
  fontWeight: theme.typography.fontWeightSemiBold,
}));

// ----------------------------------------------------------------------

export function KanbanDetails({ project, refetchProject, task, openDetails, onUpdateTask, onDeleteTask, onCloseDetails }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [isRemove, setIsRemove] = useState(false);

  const tabs = useTabs('overview');

  const [priority, setPriority] = useState(task.priority);

  const [taskName, setTaskName] = useState(task.name);

  const [subtaskCompleted, setSubtaskCompleted] = useState(SUBTASKS.slice(0, 2));

  const [newFiles, setNewFiles] = useState([]);

  const comments = useMemo(
    () => project.projectComments?.filter((comment) => comment.project_default_task.project_default_task.id === task.id) || [],
    [project, task]);

  const availableUsers = useMemo(() => project.usersAssignees.filter((user) => !task.users_assignees.some((t) => t.id === user.id)), [project, task]);

  const like = useBoolean();

  const contacts = useBoolean();

  const [taskDescription, setTaskDescription] = useState(task.description);

  const startDate = task?.start_date ? dayjs(task.start_date) : task?.startDate ? dayjs(task.startDate) : null;
  const endDate = task?.end_date ? dayjs(task.end_date) : task?.endDate ? dayjs(task.endDate) : null;

  const [loadedTasks, setLoadedTasks] = useState([]);

  useEffect(() => {
    if (project) {
      const tasks = project?.projectDefaultTasks?.map((t) => ({
        ...t,
        number: `T-${String(t.project_default_task.order).padStart(3, "0")}`,
      }));
      const sortedTasks = tasks?.sort(
        (a, b) => a.project_default_task.order - b.project_default_task.order
      );
      let foundNotStarted = false;
      const filtered = sortedTasks?.filter((t) => {
        if (t.status !== "not started") return true;
        if (!foundNotStarted) {
          foundNotStarted = true;
          return true;
        }
        return false;
      });
      if (project.hasPermission) {
        const permissionTasks = sortedTasks?.filter(
          (t) => t.project_default_task?.project_stage?.name === CONFIG.stages.permission && t.status === CONFIG.taskStatus.notStarted
        );
        filtered.push(...permissionTasks);
      }
      setLoadedTasks(filtered);
    }
  }, [project]);

  const handleAddFiles = useCallback(
    async () => {
      if (newFiles.length === 0) return;
      try {
        const formData = new FormData();

        const filePromises = newFiles.map(async (file) => {
          if (file instanceof File) {
            return file;
          }
          if (file.fileUrl) {
            const response = await fetch(file.fileUrl);
            const blob = await response.blob();
            return new File([blob], file.name, { type: blob.type });
          }
          return null;
        });

        const filesToUpload = (await Promise.all(filePromises)).filter((f) => f !== null);

        filesToUpload.forEach((file) => {
          formData.append('projectTaskAttachments', file);
        });
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const taskId = task.project_default_task.id;

        const {id} = project;

        const response = await axios.post(`${CONFIG.apiUrl}/projects/upload/project/${id}/task/${taskId}/file/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.status !== 201) {
          console.error('Error uploading new default task files', response.statusText);
          toast.error('Error uploading new default task files');
          return;
        }
        const respRefetch = await refetchProject?.();

        const updatedProject = respRefetch?.data?.projectById;

        if (updatedProject) {
          const updated = updatedProject?.projectDefaultTasks.find(
            (t) => t.project_default_task.id === task.project_default_task.id
          );
          setNewFiles([]);
          toast.success('Default Task Files uploaded successfully');
        }
      } catch (error) {
        console.error('Error uploading new default task files', error);
        toast.error('Error uploading new default task files');
      }
    }, [newFiles, setNewFiles, task, userLogged, refetchProject, project]);


  const handleManageTask = useCallback(
    async (taskType) => {
      const updatedTask = { ...task };
      if (!updatedTask) {
        return;
      }
      updatedTask.status = taskType === 'start' || taskType === 'rollback' ? 'in progress' : 'finished';
      updatedTask.percentage = taskType === 'start' || taskType === 'rollback' ? 50 : 100;

      const taskId = updatedTask?.project_default_task._id;
      const projectId = project?.id;

      try {
        const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${projectId}/task/${taskId}/change-status/`, {
          userReporter: userLogged?.data,
          status: updatedTask.status,
          percentage: updatedTask.percentage,
        });
        const response = await promise;
        if (!response.data) {
          return;
        }
        refetchProject?.();
        const lTasks = loadedTasks.map((t) => (t.project_default_task.id === updatedTask.project_default_task.id ? updatedTask : t));
        setLoadedTasks(lTasks)
      } catch (error) {
        console.error(error);
      }
    }, [userLogged, refetchProject, loadedTasks, project, task]);

  const renderToolbar = (
    <KanbanDetailsToolbar
      liked={like.value}
      taskName={task.name}
      onLike={like.onToggle}
      onDelete={onDeleteTask}
      taskStatus={task.status}
      onCloseDetails={onCloseDetails}
    />
  );

  const renderTabs = (
    <CustomTabs
      value={tabs.value}
      onChange={tabs.onChange}
      variant="fullWidth"
      slotProps={{ tab: { px: 0 } }}
    >
      {[
        { value: 'overview', label: 'Overview' },
        { value: 'comments', label: `Comments (${comments?.length})` },
      ].map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </CustomTabs>
  );

  const renderTabOverview = (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }}>
        <InputBase
          sx={{
            py: 0.75,
            borderRadius: 1,
            typography: 'h1',
            borderWidth: 1,
            borderStyle: 'none',
            fontSize: 20,
            // borderColor: 'transparent',
            transition: (theme) => theme.transitions.create(['padding-left', 'border-color']),
          }}
          value={taskName}
          disabled
        />
        {(loadedTasks?.length > 0 &&
          loadedTasks?.some((t) => t.project_default_task.id === task.project_default_task.id)) ? (
          <>
            {task && task.status === CONFIG.taskStatus.notStarted && (
              <Button
                variant="soft"
                color="info"
                size="medium"
                startIcon={<Iconify icon="vaadin:start-cog" />}
                sx={{ ml: 2.5, height: 50 }}
                disabled={!task || task.status !== CONFIG.taskStatus.notStarted || task?.users_assignees?.length === 0 || !priority}
                onClick={() => handleManageTask('start')}
              >
                Start Task
              </Button>
            )}
            {task && task.status !== CONFIG.taskStatus.notStarted && task.status !== 'finished' && (
              <Button
                variant="soft"
                color="success"
                size="medium"
                startIcon={<Iconify icon="octicon:tracked-by-closed-completed-16" />}
                sx={{ ml: 2.5, height: 50 }}
                disabled={!task || task?.users_assignees?.length === 0 || !priority}
                onClick={() => handleManageTask('finish')}
              >
                Finish Task
              </Button>
            )}
            {task && task.status === 'finished' && (
              <Button
                variant="soft"
                color="warning"
                size="medium"
                startIcon={<Iconify icon="eos-icons:snapshot-rollback" />}
                sx={{ ml: 2.5, height: 50 }}
                disabled={!task || task?.users_assignees?.length === 0 || !priority}
                onClick={() => handleManageTask('rollback')}
              >
                Rollback Task
              </Button>
            )}
          </>
        ) : (
          <Label color="error" sx={{ ml: 2.5, height: 50 }}>
            Task not available
          </Label>
        )}

      </Box>

      {/* Reporter */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StyledLabel>Responsable</StyledLabel>
        <Avatar
          alt={project?.userManager ? project?.userManager?.name : ''}
          src={project?.userManager ? project?.userManager?.avatarUrl : ''}
        />
        <Typography variant="subtitle2" sx={{ ml: 1 }}>
          {project?.userManager ? project?.userManager?.name : ''}
        </Typography>
      </Box>

      {/* Assignee */}
      <Box sx={{ display: 'flex' }}>
        <StyledLabel sx={{
          height: 40,
          lineHeight: '40px',
          color: task?.users_assignees?.length === 0 ? 'error.main' : 'default',
        }}>
          Assignee(s)
        </StyledLabel>

        <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
          {task?.users_assignees?.map((user) => (
            <Tooltip title={user.name} key={user.id}>
              <Avatar key={user.id} alt={user.name} src={user.avatarUrl} />
            </Tooltip>
          ))}

          <Tooltip title="Add assignee">
            <IconButton
              onClick={() => {
                contacts.onTrue()
                setIsRemove(false)
              }}
              sx={{
                bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                color: task?.users_assignees?.length === 0 ? 'error.main' : 'default',
              }}
            >
              <Iconify icon="mingcute:add-line" />
            </IconButton>
          </Tooltip>

          {task?.users_assignees?.length > 0 && (
            <Tooltip title="Remove assignee">
              <IconButton
                onClick={() => {
                  contacts.onTrue()
                  setIsRemove(true)
                }}
                sx={{
                  bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                  border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                }}
              >
                <Iconify icon="stash:minus-solid" />
              </IconButton>
            </Tooltip>
          )}

          <KanbanContactsDialog
            // assignee={project?.usersAssignees}
            project={project}
            task={task}
            contacts={availableUsers}
            open={contacts.value}
            onClose={contacts.onFalse}
            refetchProject={refetchProject}
            isRemove={isRemove}
          />
        </Box>
      </Box>

      {/* Priority */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StyledLabel>Priority</StyledLabel>
        <ProjectTaskDetailsPriority
          project={project}
          task={task}
          priority={priority}
          setPriority={setPriority}
        />
      </Box>

      {/* Attachments */}
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <StyledLabel>Attachments</StyledLabel>
          <Tooltip title="Add Files" sx={{ width: 40 }}>
            <span>
              <Button
                color="primary"
                variant="outlined"
                disabled={newFiles.length === 0}
                onClick={handleAddFiles}
              >
                <Iconify icon="material-symbols:attach-file-add" />
              </Button>
            </span>
          </Tooltip>
        </Box>
        <KanbanDetailsTaskAttachments
          task={task}
          project={project}
          refetchProject={refetchProject}
          newFiles={newFiles}
          setNewFiles={setNewFiles}
          id={project?.id}
          name={project?.name}
          type='tasks'
        />
      </Box>
    </Box>
  );

  const renderTabComments = (
    <KanbanDetailsCommentInput task={task} comments={comments} project={project} refetchProject={refetchProject} />
  );

  return (
    <Drawer
      open={openDetails}
      onClose={onCloseDetails}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, sm: 480 } } }}
    >
      {renderToolbar}

      {renderTabs}

      <Scrollbar fillContent sx={{ py: 3, px: 2.5 }}>
        {tabs.value === 'overview' && renderTabOverview}
        {tabs.value === 'comments' && renderTabComments}
      </Scrollbar>
    </Drawer>
  );
}
