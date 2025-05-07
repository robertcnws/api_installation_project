import dayjs from 'dayjs';
import { memo, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { styled, lighten, useTheme } from '@mui/material/styles';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { fIsAfter } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { varAlpha, stylesMode } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { imageClasses } from 'src/components/image';

import { kanbanClasses } from '../classes';



// ----------------------------------------------------------------------

export const StyledItemWrap = styled(ListItem)(() => ({
  '@keyframes fadeIn': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
  transform:
    'translate3d(var(--translate-x, 0), var(--translate-y, 0), 0) scaleX(var(--scale-x, 1)) scaleY(var(--scale-y, 1))',
  transformOrigin: '0 0',
  touchAction: 'manipulation',
  [`&.${kanbanClasses.state.fadeIn}`]: { animation: 'fadeIn 500ms ease' },
  [`&.${kanbanClasses.state.dragOverlay}`]: { zIndex: 999 },
}));

export const StyledItem = styled(Stack)(({ theme }) => ({
  width: '100%',
  cursor: 'grab',
  outline: 'none',
  overflow: 'hidden',
  position: 'relative',
  transformOrigin: '50% 50%',
  touchAction: 'manipulation',
  boxShadow: theme.customShadows.z1,
  borderRadius: 'var(--item-radius)',
  WebkitTapHighlightColor: 'transparent',
  backgroundColor: theme.vars.palette.common.white,
  transition: theme.transitions.create(['box-shadow']),
  [stylesMode.dark]: { backgroundColor: theme.vars.palette.grey[900] },
  [`&.${kanbanClasses.state.disabled}`]: {},
  [`&.${kanbanClasses.state.sorting}`]: {},
  [`&.${kanbanClasses.state.dragOverlay}`]: {
    backdropFilter: `blur(6px)`,
    boxShadow: theme.customShadows.z20,
    backgroundColor: varAlpha(theme.vars.palette.common.whiteChannel, 0.48),
    [stylesMode.dark]: {
      backgroundColor: varAlpha(theme.vars.palette.grey['900Channel'], 0.48),
    },
  },
  [`&.${kanbanClasses.state.dragging}`]: {
    opacity: 0.2,
    filter: 'grayscale(1)',
  },
}));

// ----------------------------------------------------------------------

const ItemBase = forwardRef(({ task, stateProps, sx, ...other }, ref) => {
  useEffect(() => {
    if (!stateProps?.dragOverlay) {
      return;
    }

    document.body.style.cursor = 'grabbing';

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.style.cursor = '';
    };
  }, [stateProps?.dragOverlay]);

  const th = useTheme();
  const today = dayjs().format('YYYY-MM-DD');

  const itemWrapClassName = kanbanClasses.itemWrap.concat(
    (stateProps?.fadeIn && ` ${kanbanClasses.state.fadeIn}`) ||
    (stateProps?.dragOverlay && ` ${kanbanClasses.state.dragOverlay}`) ||
    ''
  );

  const itemClassName = kanbanClasses.item.concat(
    (stateProps?.dragging && ` ${kanbanClasses.state.dragging}`) ||
    (stateProps?.disabled && ` ${kanbanClasses.state.disabled}`) ||
    (stateProps?.sorting && ` ${kanbanClasses.state.sorting}`) ||
    (stateProps?.dragOverlay && ` ${kanbanClasses.state.dragOverlay}`) ||
    ''
  );

  const renderPriority = (
    <Iconify
      icon={
        (task?.priority === 'low' && 'solar:double-alt-arrow-down-bold-duotone') ||
        (task?.priority === 'medium' && 'solar:double-alt-arrow-right-bold-duotone') ||
        'solar:double-alt-arrow-up-bold-duotone'
      }
      sx={{
        top: 4,
        right: 4,
        position: 'absolute',
        ...(task?.priority === 'low' && { color: 'info.main' }),
        ...(task?.priority === 'medium' && { color: 'warning.main' }),
        ...(task?.priority === 'high' && { color: 'error.main' }),
      }}
    />
  );

  const renderImg = !!task?.attachments?.length && (
    <Box
      sx={{
        p: (theme) => theme.spacing(1, 1, 0, 1),
      }}
    >
      <Box
        component="img"
        className={imageClasses.root}
        alt={task?.attachments?.[0]}
        src={task?.attachments?.[0]}
        sx={{
          width: 320,
          height: 'auto',
          borderRadius: 1.5,
          aspectRatio: '4/3',
          objectFit: 'cover',
        }}
      />
    </Box>
  );

  const renderInfo = (
    <Stack direction="row" alignItems="center">
      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        sx={{
          typography: 'caption',
          color: task?.percentage === 0 ? 'default.lighter' :
            task?.percentage === 100 ? 'success.main' : 'warning.main'
        }}
      >
        {/* <Iconify width={16} icon="solar:chat-round-dots-bold" sx={{ mr: 0.25 }} />

        <Box component="span" sx={{ mr: 1 }}>
          {task?.comments?.length}
        </Box> */}

        {task?.projectAttachments && (
          <>
            <Iconify width={16} icon="eva:attach-2-fill" sx={{ mr: 0.25 }} />
            <Box component="span" sx={{ mr: 2 }}>
              {task?.projectAttachments?.length}
            </Box>
          </>
        )}

        <Box component="span" sx={{ mr: 0.3 }}>{task?.percentage?.toFixed(2) ?? 0}</Box>
        <Iconify width={16} icon="lets-icons:percent" />
        <Label color={task?.percentage === 0 ? 'default' :
          task?.percentage === 100 ? 'success' : 'warning'} sx={{ ml: 1 }}>
          {task?.percentage === 0 ? 'Not Started' :
            task?.percentage === 100 ? 'Finished' : 'In Progress'}
        </Label>

      </Stack>

      <AvatarGroup sx={{ [`& .${avatarGroupClasses.avatar}`]: { width: 24, height: 24 } }}>
        {task?.assignee?.map((user) => (
          <Avatar key={user.id} alt={user.name} src={user.avatarUrl} />
        ))}
      </AvatarGroup>
    </Stack>
  );

  return (
    <StyledItemWrap
      ref={ref}
      disablePadding
      className={itemWrapClassName}
      sx={{
        ...(!!stateProps?.transition && { transition: stateProps?.transition }),
        ...(!!stateProps?.transform && {
          '--translate-x': `${Math.round(stateProps?.transform.x)}px`,
          '--translate-y': `${Math.round(stateProps?.transform.y)}px`,
          '--scale-x': `${stateProps?.transform?.scaleX}`,
          '--scale-y': `${stateProps?.transform?.scaleY}`,
        }),
      }}
    >
      <StyledItem
        className={itemClassName}
        data-cypress="draggable-item"
        sx={sx}
        tabIndex={0}
        {...stateProps?.listeners}
        {...other}
      >
        {renderImg}

        <Box
          sx={{
            px: 2,
            py: 2.5,
            position: 'relative',
            bgcolor: task?.endDate ? ((fIsAfter(today, dayjs(task?.endDate).format('YYYY-MM-DD')) && (
              task?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ||
              task?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ||
              task?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
            )) ? lighten(th.palette.error.lighter, 0.6) : 'inherit') : 'inherit',
          }}
        >
          {renderPriority}

          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {task?.name}
          </Typography>

          {renderInfo}
        </Box>
      </StyledItem>
    </StyledItemWrap>
  );
});

export default memo(ItemBase);
