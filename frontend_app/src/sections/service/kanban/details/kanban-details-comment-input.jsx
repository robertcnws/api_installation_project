import axios from 'axios';
import { useMemo, useState, useCallback } from 'react';

import { Box } from '@mui/material';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

import { ServiceDetailsCommentList } from 'src/sections/service/service-details-comment-list';

import { useMockedUser } from 'src/auth/hooks';
import { useDataContext } from 'src/auth/context/data/data-context';



// ----------------------------------------------------------------------

export function KanbanDetailsCommentInput({ comments, task, service, refetchService }) {
  const { user } = useMockedUser();

  const { loadedUsers } = useDataContext();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [comment, setComment] = useState('');

  const handleComment = useCallback(
    async () => {
      const taskId = task?.service_default_task.id ?? task?.service_default_task._id;
      const newComment = comment.trim();
      let userReporter = userLogged?.data;
      userReporter = {
        ...userReporter,
        avatarUrl: loadedUsers?.find((u) => u.id === userReporter._id)?.avatarUrl,
      }

      try {
        const url = `${CONFIG.apiUrl}/services/create/service/${service.id}/comment/`;
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
        setComment('');
        refetchService?.();
      }
    },
    [comment, service, task, userLogged, refetchService, loadedUsers]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 760, overflowY: 'auto', overflowX: 'hidden' }}>
        {comments.length > 0 && (
          <Box sx={{ ml: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 580, overflowY: 'auto' }}>
            <ServiceDetailsCommentList comments={comments} service={service} refetchService={refetchService} />
          </Box>
        )}
        <Stack direction="row" spacing={2} sx={{ py: 6, px: 2.5 }}>
          <Avatar src={user?.photoURL} alt={user?.displayName}>
            {user?.displayName?.charAt(0).toUpperCase()}
          </Avatar>

          <Paper variant="outlined" sx={{ p: 1, flexGrow: 1, bgcolor: 'transparent' }}>
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
              </Stack>

              <Button variant="contained" onClick={handleComment} disabled={!comment}>
                Comment
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Box>
  );
}
