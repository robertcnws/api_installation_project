import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import { Box } from '@mui/material';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useMockedUser } from 'src/auth/hooks';
import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

// ----------------------------------------------------------------------

export function MeasurementDetailsCommentInput({ measurement, refetchMeasurement, commentData = null, confirmEdit = null }) {
  const { user } = useMockedUser();

  const { isMobile } = useContext(LoadingContext);

  const { loadedUsers } = useDataContext();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [comment, setComment] = useState(!commentData ? '' : commentData.comment);

  const [showPicker, setShowPicker] = useState(false);

  const popover = usePopover();

  const handleEmojiSelect = (emojiData, event) => {
    setComment(prev => prev + emojiData.emoji);
    setShowPicker(false);
  };

  useEffect(() => {
    if (refetchMeasurement) {
      refetchMeasurement?.();
    }
  }, [refetchMeasurement]);

  const handleComment = useCallback(
    async () => {
      const newComment = comment.trim();
      let userReporter = userLogged?.data;
      userReporter = {
        ...userReporter,
        avatarUrl: loadedUsers?.find((u) => u.id === userReporter._id)?.avatarUrl,
      }

      try {
        const url = !commentData ? `${CONFIG.apiUrl}/measurements/create/measurement/${measurement.id}/comment/` :
          `${CONFIG.apiUrl}/measurements/edit/measurement/${measurement.id}/comment/${commentData.id}/`;
        await axios.post(url, {
          comment: newComment,
          userReporter,
        });

      }
      catch (error) {
        console.error(error);
      }
      finally {
        setComment('');
        refetchMeasurement?.();
        if (confirmEdit) {
          confirmEdit.onFalse();
        }
      }
    },
    [comment, measurement, userLogged, refetchMeasurement, loadedUsers, commentData, confirmEdit]);


  return (
    <Stack direction="row" spacing={2} sx={{ py: 3, px: 2.5 }}>
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
          </Stack>

          <Button variant="contained" onClick={handleComment} disabled={!comment}>
            {!commentData ? 'Comment' : 'Edit'}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
