import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import { Box, ListItem, TextField, Autocomplete } from '@mui/material';

import { isInstaller } from 'src/utils/check-permissions';
import { availableTasks } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useMockedUser } from 'src/auth/hooks';
import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

export function ProjectDetailsCommentInput({ project, refetchProject, commentData = null, confirmEdit = null }) {
  const { user } = useMockedUser();

  const { isMobile } = useContext(LoadingContext);

  const { loadedUsers } = useDataContext();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [loadedTasks, setLoadedTasks] = useState([]);

  const [selectedTask, setSelectedTask] = useState(!commentData ? null : commentData.project_default_task);

  const [comment, setComment] = useState(!commentData ? '' : commentData.comment);

  const [showPicker, setShowPicker] = useState(false);

  const popover = usePopover();

  const handleEmojiSelect = (emojiData, event) => {
    setComment(prev => prev + emojiData.emoji);
    setShowPicker(false);
  };

  useEffect(() => {
    if (refetchProject) {
      refetchProject?.();
    }
  }, [refetchProject]);

  useEffect(() => {
    if (project) {
      const filtered = availableTasks(project, project?.projectDefaultTasks, CONFIG);

      if (isInstaller(userLogged?.data?.user_role?.name)) {
        const selectedTasks = filtered?.filter(
          (task) => task.project_default_task?.project_stage?.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
        );
        const finalTasks = selectedTasks.filter(
          (task) => task.project_default_task.name.toLowerCase().includes(CONFIG.permissions.operationUploadFile.toLowerCase())
        );
        const withUsersTasks = finalTasks.filter(
          (task) => task.users_assignees.length > 0
        );
        setLoadedTasks(withUsersTasks);
      } else {
        setLoadedTasks(filtered);
      }
    }
  }, [project, userLogged]);

  const handleTaskChange = (_, value) => {
    setSelectedTask(value);
  };

  const handleComment = useCallback(
    async () => {
      const taskId = selectedTask?.project_default_task.id ?? selectedTask?.project_default_task._id;
      const newComment = comment.trim();
      let userReporter = userLogged?.data;
      userReporter = {
        ...userReporter,
        avatarUrl: loadedUsers?.find((u) => u.id === userReporter._id)?.avatarUrl,
      }

      try {
        const url = !commentData ? `${CONFIG.apiUrl}/projects/create/project/${project.id}/comment/` :
          `${CONFIG.apiUrl}/projects/edit/project/${project.id}/comment/${commentData.id}/`;
        await axios.post(url, {
          taskId,
          comment: newComment,
          userReporter,
        });

      }
      catch (error) {
        console.error(error);
      }
      finally {
        setSelectedTask(null);
        setComment('');
        refetchProject?.();
        if (confirmEdit) {
          confirmEdit.onFalse();
        }
      }
    },
    [selectedTask, comment, project, userLogged, refetchProject, loadedUsers, commentData, confirmEdit]);


  return (
    <Stack direction="row" spacing={2} sx={{ py: 3, px: 2.5 }}>
      <Avatar src={user?.photoURL} alt={user?.displayName}>
        {user?.displayName?.charAt(0).toUpperCase()}
      </Avatar>

      <Paper variant="outlined" sx={{ p: 1, flexGrow: 1, bgcolor: 'transparent' }}>

        {isMobile && (<Autocomplete
          options={loadedTasks ?? []}
          getOptionLabel={(option) =>
            `${option.project_default_task.project_stage.name} ${option.number} -- ${option.project_default_task.name} (${option.status})`
          }
          isOptionEqualToValue={(option, value) =>
            value.project_default_task.id ? option.project_default_task.id === value.project_default_task.id :
              option.project_default_task.id === value.project_default_task._id
          }
          value={selectedTask ?? null}
          onChange={handleTaskChange}
          renderOption={(props, stage, index) => {
            let icon; let color;
            if (stage.status === CONFIG.taskStatus.notStarted) {
              icon = 'mdi:restart-off';
              color = '#ed6c02'; // color warning
            } else if (stage.status === 'in progress') {
              icon = 'carbon:executable-program';
              color = '#0288d1'; // color info
            } else if (stage.status === 'finished') {
              icon = 'rivet-icons:inbox-complete';
              color = '#2e7d32'; // color success
            } else {
              icon = 'material-symbols:sms-failed';
              color = '#d32f2f'; // color error
            }

            return (
              <ListItem
                {...props}
                key={`${stage.project_default_task.id}-${index}-${stage.status}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color,
                  padding: '4px 8px'
                }}
              >
                <Iconify icon={icon} sx={{ mr: 1 }} />
                <span>
                  {stage.project_default_task.project_stage.name} {stage.number} -- {stage.project_default_task.name} <br />
                  <strong>({stage.status})</strong>
                </span>
              </ListItem>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="Select Task" variant="outlined" />
          )}
          sx={{ width: '100%' }}
        />)}

        <InputBase fullWidth multiline rows={3} placeholder="Type a message" sx={{ px: 1 }} value={comment} onChange={
          (e) => setComment(e.target.value)
        } />

        <Stack direction="row" alignItems="center">
          <Stack direction="row" flexGrow={1}>
            <IconButton>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>

            <IconButton>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>

            <IconButton onClick={popover.onOpen}>
              <Iconify icon="mdi:emoticon-happy-outline" />
            </IconButton>
            <CustomPopover
              open={popover.open}
              anchorEl={popover.anchorEl}
              onClose={popover.onClose}
              slotProps={{ arrow: { placement: 'right-top' } }}
            >
              <Box sx={{ p: 1 }}>
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </Box>
            </CustomPopover>

            {!isMobile && (
              <Autocomplete
                options={loadedTasks ?? []}
                getOptionLabel={(option) =>
                  `${option.project_default_task.project_stage.name} ${option.number} -- ${option.project_default_task.name} (${option.status})`
                }
                isOptionEqualToValue={(option, value) =>
                  value.project_default_task.id ? option.project_default_task.id === value.project_default_task.id :
                    option.project_default_task.id === value.project_default_task._id
                }
                value={selectedTask ?? null}
                onChange={handleTaskChange}
                renderOption={(props, stage, index) => {
                  let icon; let color;
                  if (stage.status === CONFIG.taskStatus.notStarted) {
                    icon = 'mdi:restart-off';
                    color = '#ed6c02'; // color warning
                  } else if (stage.status === 'in progress') {
                    icon = 'carbon:executable-program';
                    color = '#0288d1'; // color info
                  } else if (stage.status === 'finished') {
                    icon = 'rivet-icons:inbox-complete';
                    color = '#2e7d32'; // color success
                  } else {
                    icon = 'material-symbols:sms-failed';
                    color = '#d32f2f'; // color error
                  }

                  return (
                    <ListItem
                      {...props}
                      key={`${stage.project_default_task.id}-${index}-${stage.status}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color,
                        padding: '4px 8px'
                      }}
                    >
                      <Iconify icon={icon} sx={{ mr: 1 }} />
                      <span>
                        {stage.project_default_task.project_stage.name} {stage.number} -- {stage.project_default_task.name} <br />
                        <strong>({stage.status})</strong>
                      </span>
                    </ListItem>
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Select Task" variant="outlined" />
                )}
                sx={{ width: '93%' }}
              />
            )}
          </Stack>

          <Button variant="contained" onClick={handleComment} disabled={!comment}>
            {!commentData ? 'Comment' : 'Edit'}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
