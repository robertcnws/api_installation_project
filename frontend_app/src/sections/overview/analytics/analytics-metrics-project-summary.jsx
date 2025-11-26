import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { Link, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import dayjs from 'dayjs';

import { fIsAfter, fDurationStats } from 'src/utils/format-time';
import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Label } from 'src/components/label';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { Chart } from 'src/components/chart'; // ajusta el path si en tu proyecto es otro

// ----------------------------------------------------------------------
// Helper: construir serie mensual (últimos 6 meses)
const MS_IN_DAY = 1000 * 60 * 60 * 24;

function buildMonthlyDurationSeries(arrayDates, monthsBack = 6) {
  if (!arrayDates || arrayDates.length === 0) {
    // Devolvemos los últimos 6 meses con valor 0 para que el chart no explote
    const now = dayjs();
    return Array.from({ length: monthsBack }).map((_, idx) => {
      const m = now.subtract(monthsBack - 1 - idx, 'month').startOf('month');
      return {
        key: m.format('YYYY-MM'),
        label: m.format('MMM YYYY'),
        value: 0,
      };
    });
  }

  const now = dayjs();
  const monthKeys = [];
  const monthKeySet = new Set();

  // construimos los últimos N meses (incluyendo el actual)
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const m = now.subtract(i, 'month').startOf('month');
    const key = m.format('YYYY-MM');
    monthKeys.push({ key, date: m });
    monthKeySet.add(key);
  }

  const monthlyTotals = new Map(); // key -> { totalMs, count }

  // inicializar mapa con todos los meses a 0
  monthKeys.forEach(({ key }) => {
    monthlyTotals.set(key, { totalMs: 0, count: 0 });
  });

  arrayDates.forEach(({ startDate, endDate }) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) return;
    if (end.isBefore(start)) return;

    // Iterar por mes desde el mes del start hasta el mes del end
    let cursor = start.startOf('month');

    while (cursor.isBefore(end, 'month') || cursor.isSame(end, 'month')) {
      const monthStart = cursor.startOf('month');
      const monthEnd = cursor.endOf('month');

      const segmentStart = start.isAfter(monthStart) ? start : monthStart;
      const segmentEnd = end.isBefore(monthEnd) ? end : monthEnd;

      if (segmentEnd.isAfter(segmentStart)) {
        const diffMs = segmentEnd.diff(segmentStart);

        const key = monthStart.format('YYYY-MM');
        if (monthKeySet.has(key)) {
          const agg = monthlyTotals.get(key) || { totalMs: 0, count: 0 };
          agg.totalMs += diffMs;
          agg.count += 1;
          monthlyTotals.set(key, agg);
        }
      }

      cursor = cursor.add(1, 'month').startOf('month');
    }
  });

  // Construimos array final en orden cronológico
  const series = monthKeys.map(({ key, date }) => {
    const agg = monthlyTotals.get(key) || { totalMs: 0, count: 0 };
    let valueDays = 0;

    if (agg.count > 0 && agg.totalMs > 0) {
      const avgMs = agg.totalMs / agg.count;
      valueDays = Number((avgMs / MS_IN_DAY).toFixed(1)); // días redondeados a 1 decimal
    }

    return {
      key,
      label: date.format('MMM YYYY'),
      value: valueDays,
    };
  });

  return series;
}

// ----------------------------------------------------------------------

export function AnalyticsMetricsProjectSummary({
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
    () =>
      Array.isArray(allProjects)
        ? allProjects.filter(
            (project) => project.currentStage?.name?.toLowerCase() === 'finished'
          )
        : [],
    [allProjects]
  );

  const sortedTasks = useMemo(() => {
    const projectDefaultTasks =
      allProjects && allProjects[0] && Array.isArray(allProjects[0].projectDefaultTasks)
        ? allProjects[0].projectDefaultTasks
        : [];
    const tasks = [...projectDefaultTasks];

    return tasks.sort((a, b) => {
      const orderA = a?.project_default_task?.order ?? 0;
      const orderB = b?.project_default_task?.order ?? 0;
      return orderA - orderB;
    });
  }, [allProjects]);

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

  const finishedCount = finishedProjects?.length || 0;

  // Serie mensual para el chart (últimos 6 meses)
  const monthlySeries = useMemo(
    () => buildMonthlyDurationSeries(arrayDates, 6),
    [arrayDates]
  );

  const chartSeries = [
    {
      name: 'Avg duration (days)',
      data: monthlySeries.map((m) => m.value),
    },
  ];

  const chartOptions = {
  chart: {
    toolbar: { show: true },
  },

  plotOptions: {
    bar: {
      dataLabels: {
        position: 'top',  // ← Valor encima de la barra
      },
    },
  },

  dataLabels: {
    enabled: true,
    formatter: (val) => `${val}`, // ← Muestra el valor tal cual
    style: {
      fontSize: '11px',
      fontWeight: '600',
      colors: [theme.palette[color].main],
    },
    offsetY: -12,
  },

  xaxis: {
    categories: monthlySeries.map((m) => m.label),
    labels: {
      style: {
        fontSize: '11px',
        fontWeight: 500,
      },
    },
  },

  // === Ocultar completamente eje Y ===
  yaxis: {
    show: false,
  },

  grid: {
    show: false, // también quitamos las líneas
  },

  colors: [theme.palette[color].lighter],

  tooltip: {
    y: {
      formatter: (val) => `${val} day(s)`,
    },
  },

  legend: {
    show: false,
  },
};

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: theme.customShadows?.z4 ?? theme.shadows[2],
        bgcolor: alpha(theme.palette[color].main, 0.03),
        color: theme.palette.text.primary,
        gap: 2,
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
            <Iconify icon="solar:case-round-minimalistic-bold-duotone" width={22} height={22} />
          )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Project summary
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Label color={finishedCount > 0 ? 'success' : 'default'} variant="soft">
          {finishedCount} installations
        </Label>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Layout: métricas + chart lado a lado */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', md: 'flex-start' },
        }}
      >
        {/* Métricas (lado izquierdo) */}
        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          {/* Avg Duration */}
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

          {/* Min Duration */}
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
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!minProjectId) return;
                  localStorage.setItem('projectId', minProjectId);
                  router.push(paths.dashboard.project.details(minProjectId));
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

          {/* Max Duration */}
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
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!maxProjectId) return;
                  localStorage.setItem('projectId', maxProjectId);
                  router.push(paths.dashboard.project.details(maxProjectId));
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

        {/* Chart (lado derecho) */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 120,
          }}
        >
          <Chart
            type="bar"
            series={chartSeries}
            options={chartOptions}
            height="100%"
          />
        </Box>
      </Box>

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
  );
}
