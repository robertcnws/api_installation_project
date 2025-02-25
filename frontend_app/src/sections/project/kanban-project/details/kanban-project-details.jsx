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

import { KanbanProjectDetailsToolbar } from './kanban-project-details-toolbar';
import { KanbanProjectDetailsCommentInput } from './kanban-project-details-comment-input';
import { KanbanProjectContactsDialog } from '../components/kanban-project-contacts-dialog';
import { ProjectTaskDetailsPriority } from '../../project-task-details-priority';
import { KanbanProjectDetailsTaskAttachments } from './kanban-project-details-task-attachments';

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

export function KanbanProjectDetails({ task, openDetails, onUpdateTask, onDeleteTask, onCloseDetails }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [isRemove, setIsRemove] = useState(false);

  const tabs = useTabs('overview');

  const like = useBoolean();

  const contacts = useBoolean();

  const renderToolbar = (
    <KanbanProjectDetailsToolbar
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
        // { value: 'comments', label: `Comments (${comments?.length})` },
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
          value={task?.name}
          disabled
        />

      </Box>

      {/* Reporter */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StyledLabel>Responsable</StyledLabel>
        <Avatar
          alt={task?.userManager ? task?.userManager?.name : ''}
          src={task?.userManager ? task?.userManager?.avatarUrl : ''}
        />
        <Typography variant="subtitle2" sx={{ ml: 1 }}>
          {task?.userManager ? task?.userManager?.name : ''}
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
          {task?.usersAssignees?.map((user) => (
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

          {task?.usersAssignees?.length > 0 && (
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

          <KanbanProjectContactsDialog
            task={task}
            // contacts={availableUsers}
            open={contacts.value}
            onClose={contacts.onFalse}
            isRemove={isRemove}
          />
        </Box>
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
                // disabled={newFiles.length === 0}
                onClick={null}
              >
                <Iconify icon="material-symbols:attach-file-add" />
              </Button>
            </span>
          </Tooltip>
        </Box>
        <KanbanProjectDetailsTaskAttachments
          task={task}
          // newFiles={newFiles}
          // setNewFiles={setNewFiles}
          type='tasks'
        />
      </Box>
    </Box>
  );

  // const renderTabComments = (
  //   <KanbanProjectDetailsCommentInput task={task} comments={comments} />
  // );

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
        {/* {tabs.value === 'comments' && renderTabComments} */}
      </Scrollbar>
    </Drawer>
  );
}
