import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { fTime, fDate } from 'src/utils/format-time';
import { availableTasks, totalPercentageProject } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { ProjectEditModalDatesView } from 'src/sections/project/view/project-edit-modal-dates-view';

// ----------------------------------------------------------------------

export function RenderCellPrice({ params }) {
  return fCurrency(params.row.price);
}

// ----------------------------------------------------------------------

export function RenderCellStage({ params, includeNameStage = false }) {
  return (
    <Label variant="soft" color={
      (params?.row?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 && 'default') ||
      (params?.row?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 && 'secondary') ||
      (params?.row?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1 && 'info') ||
      (params?.row?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1 && 'warning') ||
      (params?.row?.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1 && 'success') ||
      'error'}
    >
      {includeNameStage ? `Stage ${params?.row?.currentStage.name}` : params?.row?.currentStage.name}
    </Label>
  );
}

// ----------------------------------------------------------------------

export function RenderCellDate({ params }) {

  const openModal = useBoolean();

  return (
    <>
      {params?.row?.startDate ? (
        <Stack spacing={0.5} sx={{ width: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box component="span" sx={{ typography: 'caption', color: 'text.primary' }} >{fDate(params?.row?.startDate)}</Box>
            <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
              {fTime(params?.row?.startDate)}
            </Box>
          </Box>
        </Stack>
      ) : (
        <Label
          variant="filled"
          color="default"
          sx={{ cursor: 'pointer', px: 4 }}
          onClick={openModal.onTrue}
        >
          Set Install date
        </Label>
      )}

      <ProjectEditModalDatesView
        project={params?.row}
        open={openModal.value}
        onClose={openModal.onFalse}
        isEdit={false}
        isStartDate
      />
    </>
  );
}

// ----------------------------------------------------------------------

export function RenderCellPercentage({ params }) {
  const percentage = totalPercentageProject(params?.row, CONFIG)

  return (
    <Stack justifyContent="center" sx={{ typography: 'caption', color: 'text.secondary' }}>
      <LinearProgress
        value={percentage}
        variant="determinate"
        color={
          (Number(percentage) === 0 && 'inherit') ||
          ((Number(percentage) > 0 && Number(percentage) <= 50) && 'warning') ||
          'success'
        }
        sx={{ mb: 1, width: 1, height: 6, maxWidth: 80 }}
      />
      {percentage.toFixed(2)} %
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function RenderCellProject({ params, onViewRow }) {

  const tasks = availableTasks(params?.row, params?.row?.projectDefaultTasks, CONFIG);

  const showTasks = useBoolean();
  return (
    <Stack direction="row" alignItems="center" sx={{ py: 2, width: 1 }}>
      <Avatar
        alt={params?.row?.name}
        src={`${CONFIG.assetsDir}/assets/icons/files/ic-folder.svg`}
        variant="rounded"
        sx={{ width: 40, height: 40, mr: 2 }}
      />

      <ListItemText
        disableTypography
        primary={
          <Box sx={{ diplay: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
            <Link
              noWrap
              color="inherit"
              variant="subtitle2"
              onClick={onViewRow}
              sx={{ cursor: 'pointer' }}
            >
              {params?.row?.name}
            </Link>
            <br/>
            <Label
              color="default"
              variant="outlined"
              sx={{ textTransform: 'capitalize', typography: 'caption', cursor: 'pointer', ml: 0 }}
              onClick={showTasks.onToggle}
            >
              {showTasks.value ? 'Hide' : 'See'} tasks <Iconify icon={showTasks.value ? 'heroicons-solid:arrow-sm-up' : 'heroicons-solid:arrow-sm-down'} />
            </Label>
          </Box>
        }
        secondary={
          <Box component="div" sx={{ typography: 'body2', color: 'text.disabled' }} hidden={!showTasks.value}>
            {tasks?.filter(
              (t) => t.percentage < 100 && t.percentage >= 0
            ).map((task) => (
              <Box
                component="div"
                sx={{ typography: 'body2', color: 'text.disabled' }}
                key={`${task?.project_default_task.id}-${params?.row?.id}`}
              >
                {task?.project_default_task?.name}
                <Box
                  component="span"
                  sx={{
                    float: 'right',
                    color: task?.percentage === 0
                      ? 'text.disabled'
                      : task?.percentage === 100
                        ? 'success.main'
                        : 'warning.main'
                  }}
                >
                  {task?.percentage.toFixed(2)} %
                </Box>
              </Box>
            ))}
          </Box>
        }
        sx={{ display: 'flex', flexDirection: 'column' }}
      />
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Mobile
// ----------------------------------------------------------------------

export function RenderCellMobile({ params, onViewRow }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 1 }}>
      <RenderCellProject params={params} onViewRow={onViewRow} />
      <RenderCellStage params={params} includeNameStage/>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 1 }}>
        <RenderCellDate params={params} />
        <RenderCellPercentage params={params} />
      </Box>

    </Box>
  )
}
