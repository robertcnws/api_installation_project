import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { Dialog, DialogContent, DialogTitle, Link, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import { fIsAfter, fDurationStats } from 'src/utils/format-time';
import { CONFIG } from 'src/config-global';
import { varAlpha, bgGradient } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Label } from 'src/components/label';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useBoolean } from 'src/hooks/use-boolean';
import { ProjectDetailsView } from 'src/sections/project/view';

// ----------------------------------------------------------------------

export function AnalyticsMetricsStageSummary({
  icon,
  value,
  title,
  data,
  allProjects,
  color = 'primary',
  sx,
  ...other
}) {
  const theme = useTheme();
  const router = useRouter();

  const sortedTasks = useMemo(() => {
    const tasks = allProjects?.[0]?.projectDefaultTasks ?? [];

    return tasks
      .filter((task) => {
        const stageName = task?.project_default_task?.project_stage?.name;
        return stageName?.toLowerCase() === value.toLowerCase();
      })
      .sort((a, b) => {
        const orderA = a?.project_default_task?.order ?? 0;
        const orderB = b?.project_default_task?.order ?? 0;
        return orderA - orderB;
      });
  }, [allProjects, value]);

  const firstTask = useMemo(
    () => (sortedTasks && sortedTasks.length > 0 ? sortedTasks[0] : null),
    [sortedTasks]
  );

  const lastTask = useMemo(
    () => (sortedTasks && sortedTasks.length > 0 ? sortedTasks[sortedTasks.length - 1] : null),
    [sortedTasks]
  );

  const arrayDates = useMemo(() => {
    if (!Array.isArray(allProjects) || allProjects.length === 0 || !firstTask || !lastTask) {
      return [];
    }

    return allProjects
      .map((project) => {
        const tasks = project.projectDefaultTasks ?? [];

        const startTask = tasks.find(
          (task) =>
            task.project_default_task?.id === firstTask.project_default_task?.id &&
            task?.status === 'finished'
        );

        const endTask = tasks.find(
          (task) =>
            task.project_default_task?.id === lastTask.project_default_task?.id &&
            task?.status === 'finished'
        );

        if (!startTask || !endTask) return null;

        const endDate = endTask.last_modified_time;

        const lastModifiedStart = startTask.last_modified_time;
        const createdStart = startTask.created_time;

        const startDate = fIsAfter(lastModifiedStart, endDate) ? createdStart : lastModifiedStart;

        return {
          startDate,
          endDate,
          id: project.id,
          name: project.name,
          number: project.number,
        };
      })
      .filter(Boolean);
  }, [allProjects, firstTask, lastTask]);



  const {
    averageDuration,
    minDuration,
    maxDuration,
    minProjectId,
    maxProjectId,
    minProjectName,
    maxProjectName,
    minProjectNumber,
    maxProjectNumber,
  } = useMemo(() => fDurationStats(arrayDates), [arrayDates]);

  const installationsCount = data?.length || 0;

  const openProjectDetailsModal = useBoolean(false);

  const [selectedId, setSelectedId] = useState(null);

  const handleProjectDetails = (projectId) => {
    localStorage.setItem('projectId', projectId);
    setSelectedId(projectId);
    openProjectDetailsModal.onTrue();
  };

  return (
    <>
      <Card
        sx={{
          p: 2.5,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: theme.customShadows?.z4 ?? theme.shadows[2],
          bgcolor: alpha(theme.palette[color].main, 0.03),
          ...sx,
        }}
        {...other}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette[color].main, 0.16),
            }}
          >
            {icon || (
              <Iconify icon="solar:chart-2-bold-duotone" width={22} height={22} color="inherit" />
            )}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            {/* <Typography variant="subtitle2" noWrap>
            Stage
          </Typography> */}
            <Typography variant="caption" color="text.secondary" noWrap>
              <b>{value?.toUpperCase()}</b>
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Label color={installationsCount > 0 ? 'success' : 'default'} variant="soft">
            {installationsCount}
            {/* installation{installationsCount === 1 ? '' : 's'} */}
          </Label>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Métricas */}
        <Stack spacing={1.5}>
          {/* Avg duration */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 14,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Avg duration
            </Typography>
            <Label variant="outlined" color="default" sx={{ px: 1.2, py: 0.3 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {averageDuration || 'N/A'}
              </Typography>
            </Label>
          </Box>

          {/* Min duration */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              fontSize: 14,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">
                Min duration
              </Typography>

              <Link
                variant="caption"
                color="inherit"
                noWrap
                sx={{
                  mt: 0.25,
                  color: 'text.primary',
                  cursor: minProjectId ? 'pointer' : 'default',
                  fontSize: '11px',
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!minProjectId) return;
                  // localStorage.setItem('projectId', minProjectId);
                  // router.push(paths.dashboard.project.details(minProjectId));
                  handleProjectDetails(minProjectId);

                }}
              >
                {minProjectId ? `${minProjectName || 'Unnamed'}` : '—'}
              </Link>
            </Box>

            <Label variant="outlined" color="default" sx={{ ml: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {minDuration || 'N/A'}
              </Typography>
            </Label>
          </Box>

          {/* Max duration */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              fontSize: 14,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">
                Max duration
              </Typography>

              <Link
                variant="caption"
                color="inherit"
                noWrap
                sx={{
                  mt: 0.25,
                  color: 'text.primary',
                  cursor: maxProjectId ? 'pointer' : 'default',
                  fontSize: '11px',
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!maxProjectId) return;
                  // localStorage.setItem('projectId', maxProjectId);
                  // router.push(paths.dashboard.project.details(maxProjectId));
                  handleProjectDetails(maxProjectId);
                }}
              >
                {maxProjectId ? `${maxProjectName || 'Unnamed'}` : '—'}
              </Link>
            </Box>

            <Label variant="outlined" color="default" sx={{ ml: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {maxDuration || 'N/A'}
              </Typography>
            </Label>
          </Box>
        </Stack>

        {/* Fondo decorativo */}
        <SvgColor
          src={`${CONFIG.assetsDir}/assets/background/shape-square.svg`}
          sx={{
            top: -32,
            right: -80,
            width: 220,
            height: 220,
            opacity: 0.18,
            position: 'absolute',
            color: theme.palette[color].lighter,
          }}
        />
      </Card>
      <Dialog
        open={openProjectDetailsModal.value}
        onClose={openProjectDetailsModal.onFalse}
        maxWidth="xxl"
        fullWidth
      >
        <DialogTitle>
          Project Details
        </DialogTitle>
        <DialogContent>
          {selectedId && (
            <ProjectDetailsView projectId={selectedId} onCloseModal={openProjectDetailsModal.onFalse} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
