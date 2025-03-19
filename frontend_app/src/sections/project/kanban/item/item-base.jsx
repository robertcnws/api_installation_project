import { memo, useMemo, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { IconButton } from '@mui/material';
import ListItem from '@mui/material/ListItem';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { isInstaller, listRolesAndSubroles } from 'src/utils/check-permissions';
import { availableTasks, previousTasksInStatus } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';
import { varAlpha, stylesMode } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

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

const ItemBase = forwardRef(({
  project,
  task,
  stateProps,
  onClick,
  handleManageTask,
  sx,
  ...other
}, ref) => {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const possibleTasks = useMemo(() => availableTasks(project, project?.projectDefaultTasks, CONFIG), [project]);

  const isAvailableTask = useMemo(() => possibleTasks?.some((t) => t.project_default_task.id === task.project_default_task.id), [possibleTasks, task]);

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
        (task.priority === 'low' && 'solar:double-alt-arrow-down-bold-duotone') ||
        (task.priority === 'medium' && 'solar:double-alt-arrow-right-bold-duotone') ||
        'solar:double-alt-arrow-up-bold-duotone'
      }
      sx={{
        top: 4,
        right: 4,
        position: 'absolute',
        ...(task.priority === 'low' && { color: 'info.main' }),
        ...(task.priority === 'medium' && { color: 'warning.main' }),
        ...(task.priority === 'high' && { color: 'error.main' }),
      }}
      onClick={onClick}
    />
  );

  const renderButtonTask = (
    <Stack direction="row" alignItems="center" sx={{ mr: 4, mt: 1 }}>
      {(task && isAvailableTask) && (
        <>
          {(
            listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ||
            task?.users_assignees?.some((u) => u.id === userLogged?.data?.id) ||
            project?.userManager?.id === userLogged?.data?.id
          ) && (
              <>
                {(task && task.status === CONFIG.taskStatus.notStarted && (task?.project_default_task?.order === 1 ||
                  (project?.hasPermission && task?.project_default_task?.project_stage.name.toLowerCase() === CONFIG.stages.permission.toLowerCase()))) && (
                    <IconButton
                      variant="soft"
                      color="default"
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: 10,
                        mt: -0.6,
                        mr: 1,
                        '&:hover': {
                          boxShadow: 'none',
                          backgroundColor: 'transparent',
                        },
                      }}
                      disabled={!task || task.status !== CONFIG.taskStatus.notStarted || task?.users_assignees?.length === 0}
                      onClick={() => handleManageTask('start')}
                    >
                      <Iconify icon="vaadin:start-cog" sx={{ width: 15, height: 15 }} /> Start
                    </IconButton>
                  )}
                {task && task.status !== CONFIG.taskStatus.notStarted && task.status !== 'finished' && (
                  previousTasksInStatus(
                    task,
                    project?.projectDefaultTasks,
                    CONFIG.taskStatus.inProgress,
                    task?.project_default_task?.project_stage?.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1,
                    CONFIG
                  ).length === 0 && (
                    <IconButton
                      variant="soft"
                      color="success"
                      size="small"
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: 10,
                        mt: -0.6,
                        mr: 1,
                        '&:hover': {
                          boxShadow: 'none',
                          backgroundColor: 'transparent',
                        },
                      }}
                      disabled={
                        !task ||
                        task?.users_assignees?.length === 0 ||
                        task.status === 'finished' ||
                        (isInstaller(userLogged?.data?.user_role?.name) && task?.project_task_attachments?.length === 0)
                      }
                      onClick={() => handleManageTask('finish')}
                    >
                      <Iconify icon="octicon:tracked-by-closed-completed-16" sx={{ width: 15, height: 15 }} /> Finish
                    </IconButton>
                  )
                  // : (
                  //   <Label color='error' sx={{ fontSize: '8px', mr: -3 }}>Finish previous tasks</Label>
                  // )
                )}
                {(task && task.status === 'finished' && listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.superadmin)) && (
                  <IconButton
                    variant="soft"
                    color="warning"
                    size="small"
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: 10,
                      mt: -0.6,
                      mr: 1,
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                      },
                    }}
                    disabled={!task || task?.users_assignees?.length === 0}
                    onClick={() => handleManageTask('rollback')}
                  >
                    <Iconify icon="eos-icons:snapshot-rollback" sx={{ width: 15, height: 15 }} /> Rollback
                  </IconButton>
                )}
              </>
            )}
        </>
      )}
    </Stack>
  );

  const renderInfo = (
    <Stack direction="row" alignItems="center" onClick={onClick}>
      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        sx={{
          typography: 'caption',
        }}
      >
        {/* <Iconify width={16} icon="solar:chat-round-dots-bold" sx={{ mr: 0.25 }} />

        <Box component="span" sx={{ mr: 1 }}>
          {task?.comments?.length}
        </Box> */}

        {/* <Iconify
          width={16}
          icon="la:percent"
          sx={{
            mr: 0.25,
            ml: 1,
            color: task?.percentage === 0 ? 'grey.500' :
              task?.percentage === 100 ? 'success.main' : 'warning.main'
          }}
        />
        <Box component="span" sx={{
          color: task?.percentage === 0 ? 'grey.500' :
            task?.percentage === 100 ? 'success.main' : 'warning.main'
        }}>
          {task?.percentage.toFixed(2)}
        </Box> */}

        <Box
          component="span"
          key={`${project.id}-${task?.project_default_task.id}-percentage`}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            typography: 'body2',
            color: 'backgound.neutral',
            gap: 0,
            cursor: 'pointer'
          }}
        >
          <Label
            variant='outlined'
            color={
              task?.percentage === 100 ? 'success' :
                task?.percentage < 100 && task?.percentage > 0 ? 'warning' :
                  'default'
            }
            sx={{
              cursor: 'pointer',
            }}
          >
            {/* <Iconify icon={
              task?.percentage === 100 ? 'gis:flag-finish-b-o' :
                task?.percentage < 100 && task?.percentage > 0 ? 'grommet-icons:in-progress' :
                  'tabler:clock-stop'
            } width={16} height={16} /> */}
            <span style={{ fontSize: 'x-small' }}>
              {
                task?.percentage === 100 ? 'Finished' :
                  task?.percentage < 100 && task?.percentage > 0 ? 'In Progress' :
                    'Not Started'
              }
            </span>
          </Label>
        </Box>

        {(task?.project_default_task.has_attachments) && (
          <>
            <Iconify width={16} icon="eva:attach-2-fill" sx={{ mr: 0.25 }} />
            <Box component="span">
              {task?.project_task_attachments?.length} Attachment(s)
            </Box>
          </>
        )}

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
        ...(!!stateProps?.transition && { transition: stateProps.transition }),
        ...(!!stateProps?.transform && {
          '--translate-x': `${Math.round(stateProps.transform.x)}px`,
          '--translate-y': `${Math.round(stateProps.transform.y)}px`,
          '--scale-x': `${stateProps.transform.scaleX}`,
          '--scale-y': `${stateProps.transform.scaleY}`,
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

        <Box sx={{ px: 2, py: 1, position: 'relative' }}>

          <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 999, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            {(task && isAvailableTask) && (
              renderButtonTask
            )}
          </Box>

          {renderPriority}

          <Typography variant="subtitle2" sx={{ mb: 2, width: '70%' }} onClick={onClick}>
            {task.name}
          </Typography>

          {renderInfo}
        </Box>

      </StyledItem>
    </StyledItemWrap>
  );
});

export default memo(ItemBase);
