
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fPercent } from 'src/utils/format-number';
import { fAverageDuration, fTypeDuration, fIsAfter, fDurationStats } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { varAlpha, bgGradient } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { useMemo } from 'react';
import { Link, Typography } from '@mui/material';
import { Label } from 'src/components/label';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export function AnalyticsMetricsServiceSummary({
  icon,
  title,
  allProjects,
  color = 'primary',
  sx,
  ...other
}) {
  const theme = useTheme();

  const router = useRouter();

  const finishedProjects = useMemo(
    () => allProjects.filter((project) => project.currentStage?.name?.toLowerCase() === 'finished'),
    [allProjects]
  );
  
  const sortedTasks = useMemo(() => {
    const projectDefaultTasks = allProjects && allProjects[0] && Array.isArray(allProjects[0].projectDefaultTasks)
      ? allProjects[0].projectDefaultTasks
      : [];
    const tasks = [...projectDefaultTasks];

    return tasks?.sort((a, b) => {
      const orderA = a?.project_default_task?.order ?? 0;
      const orderB = b?.project_default_task?.order ?? 0;
      return orderA - orderB;
    });
  }, [allProjects]);

  const firstTask = useMemo(
    () => sortedTasks && sortedTasks.length > 0 ? sortedTasks[0] : null,
    [sortedTasks]
  );

  const lastTask = useMemo(
    () => sortedTasks && sortedTasks.length > 0 ? sortedTasks[sortedTasks.length - 1] : null,
    [sortedTasks]
  );

  const arrayDates = useMemo(() => {
    if (!Array.isArray(allProjects) || allProjects.length === 0 || !firstTask || !lastTask) {
      return [];
    }

    return allProjects
      .map((project) => {
        const tasks = project.projectDefaultTasks ?? [];

        // === START TASK (firstTask) ===
        const startTask = tasks.find(
          (task) =>
            task.project_default_task?.id === firstTask.project_default_task?.id &&
            task?.status === 'finished'
        );

        // === END TASK (lastTask) ===
        const endTask = tasks.find(
          (task) =>
            task.project_default_task?.id === lastTask.project_default_task?.id &&
            task?.status === 'finished'
        );

        if (!startTask || !endTask) return null;

        // === END DATE (always last_modified_time) ===
        const endDate = endTask.last_modified_time;

        // === START DATE LOGIC ===
        const lastModifiedStart = startTask.last_modified_time;
        const createdStart = startTask.created_time;

        // Si lastModifiedStart es mayor que endDate → usar created_time
        const startDate = fIsAfter(lastModifiedStart, endDate)
          ? createdStart
          : lastModifiedStart;

        return {
          startDate,
          endDate,
          id: project.id,
          name: project.name,
          number: project.number
        };
      })
      .filter(Boolean);
  }, [allProjects, firstTask, lastTask]);


  // console.log('arrayDates', arrayDates);

  // const averageDuration = useMemo(
  //   () => fAverageDuration(arrayDates),
  //   [arrayDates]
  // );

  // const minDuration = useMemo(
  //   () => fTypeDuration(arrayDates, 'min'),
  //   [arrayDates]
  // );

  // const maxDuration = useMemo(
  //   () => fTypeDuration(arrayDates, 'max'),
  //   [arrayDates]
  // );

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
  } = useMemo(
    () => fDurationStats(arrayDates),
    [arrayDates]
  );



  return (
    <Card
      sx={{
        p: 2,
        boxShadow: 'none',
        position: 'relative',
        backgroundColor: 'whitesmoke',
        border: '1px solid',
        borderColor: 'grey.300',
        color: `${color}.darker`,
      }}
      {...other}
    >
      <Box display='flex' flexDirection='row' alignItems='center'>
        <Box sx={{ width: 35, height: 35, mb: 1 }}>{icon}</Box>
        <Box sx={{ mb: 1, typography: 'subtitle2' }}>{title}</Box>
      </Box>

      {/* {renderTrending} */}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ fontSize: '14px', justifyContent: 'space-between', display: 'flex', flexDirection: 'row' }}>
            <Typography component="span" sx={{ mr: 1, fontSize: '14px' }}>
              Qty
            </Typography>
            <Typography component="span" sx={{ mr: 1, fontSize: '14px' }}>
              <b>{finishedProjects?.length || 0} installation(s)</b>
            </Typography>
          </Box>
          <Box sx={{ fontSize: '14px', mb: 2, justifyContent: 'space-between', display: 'flex', flexDirection: 'row' }}>
            <Typography component="span" sx={{ mr: 1, fontSize: '14px' }}>
              Avg Duration
            </Typography>
            <Label variant="outlined" color='default'>
              <b>{averageDuration ? `${averageDuration}` : 'N/A'}</b>
            </Label>
          </Box>


          <Box sx={{ fontSize: '14px', mb: 2, justifyContent: 'space-between', display: 'flex', flexDirection: 'row' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography component="span" sx={{ mr: 1, fontSize: '14px' }}>
                Min Duration
              </Typography>
              <Link
                variant="caption"
                color="inherit"
                noWrap
                sx={{
                  color: 'text.primary',
                  cursor: 'pointer',
                  fontSize: '11px',
                  maxWidth: 150, // <-- el tamaño uniforme que quieras
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem('projectId', minProjectId);
                  router.push(paths.dashboard.project.details(minProjectId));
                }}
              >
                {minProjectId && (`${minProjectName || 'Unnamed'}`)}
              </Link>
            </Box>
            <Label variant="outlined" color='default'>
              <b>{minDuration ? `${minDuration} ` : 'N/A'}</b>
            </Label>
          </Box>

          <Box sx={{ fontSize: '14px', justifyContent: 'space-between', display: 'flex', flexDirection: 'row' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography component="span" sx={{ mr: 1, fontSize: '14px' }}>
                Max Duration
              </Typography>
              <Link
                variant="caption"
                color="inherit"
                noWrap
                sx={{
                  color: 'text.primary',
                  cursor: 'pointer',
                  fontSize: '11px',
                  maxWidth: 150, // <-- el tamaño uniforme que quieras
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem('projectId', maxProjectId);
                  router.push(paths.dashboard.project.details(maxProjectId));
                }}
              >
                {maxProjectId && (`${maxProjectName || 'Unnamed'}`)}
              </Link>
            </Box>
            <Label variant="outlined" color='default'>
              <b>{maxDuration ? `${maxDuration} ` : 'N/A'}</b>
            </Label>
          </Box>


        </Box>
      </Box>

      <SvgColor
        src={`${CONFIG.assetsDir}/assets/background/shape-square.svg`}
        sx={{
          top: 0,
          left: -20,
          width: 240,
          zIndex: -1,
          height: 240,
          opacity: 0.24,
          position: 'absolute',
          color: 'whitesmoke',
        }}
      />
    </Card>
  );
}
