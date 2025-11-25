import React, { useRef, useMemo, useState, useEffect } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Button, LinearProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { isInstaller } from 'src/utils/check-permissions';
import { fDate, fIsBetween } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { ProjectCalendarView } from 'src/sections/project/calendar/view';

import { useDataContext } from 'src/auth/context/data/data-context';
import { useSocketList } from 'src/utils/websockets';

import { ProjectListView } from './product/view';
import { AnalyticsNews } from '../analytics-news';
import { WelcomeMetricsTypography } from '../welcome-metrics-typography';
import { ProjectsToDoToday } from '../projects-to-do-today';
import { ProjectsStageToday } from '../projects-stage-today';
import { AnalyticsMetricsWidgetSummary } from '../analytics-metrics-widget-summary';
import { AnalyticsMetricsStageSummary } from '../analytics-metrics-stage-summary';


export function OverviewAnalyticMetricsView() {
  const router = useRouter();


  const userLogged = useMemo(
    () => JSON.parse(sessionStorage.getItem('userLogged')),
    []
  );

  const {
    loadedProjects,
    loadingProjects,
    loadedServices,
    loadingServices,
    loadedMeasurements,
    loadingMeasurements,
  } = useDataContext();

  // Map + ref para WS
  const projectsRef = useRef(new Map());
  const [projects, setProjects] = useState([]);
  const servicesRef = useRef(new Map());
  const [services, setServices] = useState([]);
  const measurementsRef = useRef(new Map());
  const [measurements, setMeasurements] = useState([]);

  // Inicializamos projects desde loadedProjects
  useEffect(() => {
    if (loadedProjects) {
      const m = new Map();
      loadedProjects?.forEach((p) => m.set(p.id, p));
      projectsRef.current = m;
      setProjects(Array.from(m.values()));
    }
  }, [loadedProjects]);

  // Inicializamos services desde loadedServices
  useEffect(() => {
    if (loadedServices) {
      const m = new Map();
      loadedServices?.forEach((s) => m.set(s.id, s));
      servicesRef.current = m;
      setServices(Array.from(m.values()));
    }
  }, [loadedServices]);

  // Inicializamos measurements desde loadedMeasurements
  useEffect(() => {
    if (loadedMeasurements) {
      const m = new Map();
      loadedMeasurements?.forEach((me) => m.set(me.id, me));
      measurementsRef.current = m;
      setMeasurements(Array.from(m.values()));
    }
  }, [loadedMeasurements]);

  // WS para servicios
  useSocketList({
    url: `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/services/ws/services/`,
    setItems: setServices,
  });

  // WS para proyectos
  useSocketList({
    url: `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/projects/`,
    setItems: setProjects,
  });

  // WS para measurements
  useSocketList({
    url: `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/measurements/ws/measurements/`,
    setItems: setMeasurements,
  });

  const isInst = isInstaller(userLogged?.data?.user_role?.name);

  const finishedProjects = useMemo(
    () => projects?.filter((p) => p.currentStage?.name?.toLowerCase() === 'finished'),
    [projects]
  );

  const inProgressProjects = useMemo(
    () => projects?.filter((p) => p.currentStage?.name?.toLowerCase() !== 'finished'),
    [projects]
  );

  const finishedServices = useMemo(
    () => services?.filter((s) => s.currentStage?.name?.toLowerCase() === 'finished' && !s.isClosed),
    [services]
  );

  const inProgressServices = useMemo(
    () => services?.filter((s) => s.currentStage?.name?.toLowerCase() !== 'finished' && !s.isClosed),
    [services]
  );

  const closedServices = useMemo(
    () => services?.filter((s) => s.isClosed),
    [services]
  );

  const projectTypes = useMemo(() => [
    {
      value: 'finished installations',
      label: 'Finished Installations',
      icon: 'mdi:store-complete-outline',
      data: finishedProjects,
    },
    {
      value: 'in progress installations',
      label: 'In Progress Installations',
      icon: 'streamline:business-progress-bar-2-remix',
      data: inProgressProjects,
    },
    {
      value: 'finished services',
      label: 'Finished Services',
      icon: 'carbon:task-complete',
      data: finishedServices,
    },
    {
      value: 'in progress services',
      label: 'In Progress Services',
      icon: 'ix:import-progress',
      data: inProgressServices,
    },
    {
      value: 'closed services',
      label: 'Closed Services',
      icon: 'material-symbols:tab-close-right-outline',
      data: closedServices,
    },
  ], [finishedProjects, inProgressProjects, finishedServices, inProgressServices, closedServices]);

  const projectStageTypes = useMemo(
    () => Object.entries(CONFIG.stages).slice(0, 5).map(([key, label]) => ({
      value: key,
      label,
      data: projects.filter((p) => p.currentStage?.name?.toLowerCase() === key.toLowerCase()),
      icon: CONFIG.stageIcons[key] || 'mdi:progress-clock',
    })),
    [projects]
  )

  if (loadingProjects || projects.length === 0 ||
    loadingServices || services.length === 0 ||
    loadingMeasurements || measurements.length === 0) {
    return (
      <Box
        sx={{
          width: 350,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 'auto',
        }}
      >
        <Typography variant="body2" sx={{ mb: 1 }}>
          Loading data...
        </Typography>
        <LinearProgress
          sx={{
            mb: 2,
            width: '100%',
            '& .MuiLinearProgress-bar': { backgroundColor: 'black' },
            backgroundColor: '#e0e0e0',
          }}
        />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <WelcomeMetricsTypography userLogged={userLogged} />

      {!isInst ? (
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={1}>
            {projectTypes.map(({ value, label, icon, data }) => (
              <Grid key={value} xs={12} sm={6} md={2.4}>
                <AnalyticsMetricsWidgetSummary
                  sx={{ cursor: 'pointer' }}
                  title={label}
                  percent={0}
                  total={0}
                  quantity={data?.length}
                  color='primary'
                  icon={
                    <Iconify
                      icon={icon}
                      width={32}
                      height={32}
                    />
                  }
                />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={1}>
            {projectStageTypes.map(({ value, label, icon, data }) => (
              <Grid key={value} xs={12} sm={6} md={2.4}>
                <AnalyticsMetricsStageSummary
                  sx={{ cursor: 'pointer' }}
                  title={`In Stage: ${label}`}
                  value={value}
                  data={data}
                  allProjects={projects}
                  icon={
                    <Iconify
                      icon={icon}
                      width={32}
                      height={32}
                    />
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Grid container xs={12} spacing={1} sx={{ mb: 1 }}>
          <Button
            sx={{ cursor: 'pointer', border: '1px solid #ddd', fontSize: 11 }}
            color="warning"
            onClick={() => router.push(paths.dashboard.project.list)}
          >
            <Iconify icon="icon-park-solid:install" />
            <Typography variant="caption">Go to Installations</Typography>
          </Button>
        </Grid>
      )}

    </DashboardContent>
  );
}
