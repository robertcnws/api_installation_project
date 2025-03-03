import axios from 'axios';
import { useMemo, useState, useCallback, useEffect, useContext } from 'react';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { Box, Button, Divider, MenuItem, MenuList } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fToNow, fIsAfter } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { Image } from 'src/components/image';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Lightbox, useLightBox } from 'src/components/lightbox';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectDetailsCommentInput } from './project-details-comment-input';




// ----------------------------------------------------------------------

export function ProjectDetailsCommentList({ comments, project, refetchProject }) {

  const { isMobile } = useContext(LoadingContext);

  const { loadedUsers } = useDataContext();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [sortedComments, setSortedComments] = useState([]);

  useEffect(() => {
    if (comments && refetchProject) {
      refetchProject?.();
      setSortedComments([...comments].sort((a, b) => fIsAfter(b.last_modified_time, a.last_modified_time) ? 1 : -1));
    }
  }, [comments, refetchProject]);

  const popover = usePopover();

  const confirm = useBoolean();

  const confirmEdit = useBoolean();

  const [selectedComment, setSelectedComment] = useState(null);

  const slides = sortedComments
    .filter((comment) => comment.messageType === 'image')
    .map((slide) => ({ src: slide.message }));

  const lightbox = useLightBox(slides);

  const onDeleteComment = useCallback(
    async () => {
      let userReporter = userLogged?.data;
      userReporter = {
        ...userReporter,
        avatarUrl: loadedUsers?.find((u) => u.id === userReporter._id)?.avatarUrl,
      }

      try {
        const url = `${CONFIG.apiUrl}/projects/delete/project/${project.id}/comment/${selectedComment.id}/`;
        await axios.delete(url, {
          data: {
            userReporter: userLogged?.data,
          }
        });
        confirm.onFalse();
        toast.success('Comment deleted');
      }
      catch (error) {
        console.error(error);
        toast.error('Failed to delete comment');
      }

    }, [confirm, selectedComment, project.id, userLogged, loadedUsers]);

  return (
    <>
      <Stack component="ul" spacing={3} sx={{ mb: 1, ml: 2, mr: 5, borderRadius: 1, p: 2, bgcolor: 'background.neutral' }}>
        {sortedComments.map((comment) => (
          <Stack component="li" key={comment.id} direction="row" spacing={2}>
            <Avatar src={comment.user_reporter.avatar_url} />

            <Stack spacing={comment.messageType === 'image' ? 1 : 0.5} flexGrow={1}>
              <Stack
                direction={!isMobile ? "row" : "column"}
                alignItems={!isMobile ? "center" : "left"}
                justifyContent={!isMobile ? "space-between" : "flex-start"}
              >
                <Typography variant="subtitle2" sx={{ fontSize: 'x-small' }}>
                  {comment.user_reporter.first_name} {comment.user_reporter.last_name}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  alignItems: 'center', 
                  gap: !isMobile ? 1 : 15,
                  }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 'x-small' }}>
                    {fToNow(comment.last_modified_time)}
                  </Typography>
                  {userLogged?.data.id === comment?.user_reporter.id ? (
                    <Button sx={{ p: 0, ml: 1 }} onClick={(e) => {
                      popover.onOpen(e);
                      setSelectedComment(comment)
                    }}>
                      <Iconify icon="eva:more-vertical-fill" />
                    </Button>
                  ) : (
                    <Box sx={{ width: 72 }} />
                  )}
                </Box>
                <CustomPopover
                  open={popover.open}
                  anchorEl={popover.anchorEl}
                  onClose={popover.onClose}
                // slotProps={{ arrow: { placement: 'right-top' } }}
                >
                  <MenuList>
                    <MenuItem
                      onClick={() => {
                        confirmEdit.onTrue();
                        popover.onClose();
                      }}
                    >
                      <Iconify icon="typcn:edit" />
                      Edit Comment
                    </MenuItem>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    <MenuItem
                      onClick={() => {
                        confirm.onTrue();
                        popover.onClose();
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                      Delete Comment
                    </MenuItem>
                  </MenuList>
                </CustomPopover>
              </Stack>

              {comment.messageType === 'image' ? (
                <Image
                  alt={comment.comment}
                  src={comment.comment}
                  onClick={() => lightbox.onOpen(comment.comment)}
                  sx={{
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    transition: (theme) => theme.transitions.create(['opacity']),
                    '&:hover': { opacity: 0.8 },
                  }}
                />
              ) : (
                <Typography variant="body2" sx={{ fontSize: 'small', mr: 15 }}>
                  {comment.comment}
                  {comment.project_default_task && (
                    <>
                      <br />
                      <Label>
                        <b>{comment.project_default_task.project_default_task.name}</b>
                      </Label>
                    </>
                  )}
                </Typography>
              )}
            </Stack>
          </Stack>
        ))}
      </Stack >

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Comment"
        maxWidth="md"
        content={
          <Typography variant="body2">
            Are you sure want to delete selected comment &quot;<b>{selectedComment?.comment}</b>&quot;?
          </Typography>
        }
        action={
          <Button variant="contained" color="error" onClick={onDeleteComment}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmEdit.value}
        onClose={confirmEdit.onFalse}
        title="Edit Comment"
        maxWidth="lg"
        content={
          <ProjectDetailsCommentInput project={project} refetchProject={refetchProject} commentData={selectedComment} confirmEdit={confirmEdit} />
        }
      />

    </>
  );
}
