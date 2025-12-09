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
import { Scrollbar } from 'src/components/scrollbar';

import { useDataContext } from 'src/auth/context/data/data-context';
import dayjs from 'dayjs';
import { CalendarComponent } from 'src/sections/calendar/view/calendar-component';
import { ProjectListView } from './product/view';
import { AnalyticsNews } from '../analytics-news';
import { WelcomeTypography } from '../welcome-typography';
import { ProjectsToDoToday } from '../projects-to-do-today';
import { ProjectsStageToday } from '../projects-stage-today';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';






export function OverviewAnalyticsView() {
  const router = useRouter();

  const isOnlyWeek = useBoolean(true);


  const userLogged = useMemo(
    () => JSON.parse(sessionStorage.getItem('userLogged')),
    []
  );

  const {
    loadedProjects,
    loadingProjects,
    loadedProjectReminders
  } = useDataContext();

  // Map + ref para WS
  const projectsRef = useRef(new Map());
  const [projects, setProjects] = useState([]);
  const [availableReminders, setAvailableReminders] = useState([]);

  // Inicializamos projects desde loadedProjects
  useEffect(() => {
    if (loadedProjects) {
      const m = new Map();
      loadedProjects.forEach((p) => m.set(p.id, p));
      projectsRef.current = m;
      setProjects(Array.from(m.values()));
    }
  }, [loadedProjects]);

  // WS para proyectos
  useEffect(() => {
    const socket = new WebSocket(`${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/projects/`);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
        projectsRef.current = message.item;
        setProjects((prevData) => {
          const existingItemIndex = prevData.findIndex(item => String(item.id) === String(message.item.id));
          if (existingItemIndex !== -1) {
            const updatedData = [...prevData];
            updatedData[existingItemIndex] = message.item;
            return updatedData;
          }
          return [message.item, ...prevData];
        });
      }
      else if (message.type === 'deleted') {
        projectsRef.current = message.item;
        setProjects((prevData) => prevData.filter(item => String(item.id) !== String(message.item.id)));
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Reminders inicial
  useEffect(() => {
    if (loadedProjectReminders) {
      setAvailableReminders(
        loadedProjectReminders.filter((r) => fDate(r.date) === fDate(new Date()))
      );
    }
  }, [loadedProjectReminders]);

  // WS para reminders
  useEffect(() => {
    const socket = new WebSocket(`${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/project-reminders/`);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
        setAvailableReminders((prevData) => {
          if (prevData?.id === message.item.id &&
            message.item.userReporter.id === userLogged?.data.id &&
            fDate(message.item.date) === fDate(new Date())
          ) {
            return message.item;
          }
          return prevData;
        });
      }
      else if (message.type === 'deleted') {
        setAvailableReminders((prevData) => {
          if (prevData?.id === message.item.id) {
            return null;
          }
          return prevData;
        });
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userLogged]);

  // Cálculo memoizado de filtros y métricas

  const widgetColors = useMemo(() => {
    const colors = {
      preparation: 'error',
      coordination: 'secondary',
      installation: 'info',
      permission: 'warning',
      closing: 'success',
    };
    return colors;
  }, []);

  const {
    todayProjects,
    stageBuckets,
    permissionRates
  } = useMemo(() => {
    const now = dayjs();

    // 1) Inicializo buckets a partir de CONFIG.stages
    const stageKeys = Object.keys(CONFIG.stages);
    const buckets = stageKeys.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});

    const todayProjs = [];

    // 2) Recorro proyectos solo UNA vez
    projects.forEach((proj) => {
      // const ed = dayjs(proj.endDate).toDate();
      const workOrders = proj.workOrders || [];
      const installationWorkOrders = workOrders?.filter(
        (wo) => wo.work_type?.name?.toLowerCase() === 'installation'
      ) || [];

      const someInstallationToday = installationWorkOrders.some((wo) => {
        const wod = dayjs(wo.start_date).format('YYYY-MM-DD');
        const woe = dayjs(wo.end_date).format('YYYY-MM-DD');
        return fIsBetween(now, dayjs(wod).toDate(), dayjs(woe).toDate()) || wod === now.format('YYYY-MM-DD');
      });

      // proyectos de hoy
      // if (fDate(sd) === fDate(now) || fIsBetween(now, sd, ed)) {
      if (someInstallationToday) {
        todayProjs.push(proj);
      }

      // bucket por stage
      const stageName = proj.currentStage?.name?.toLowerCase() || '';
      stageKeys.forEach((key) => {
        if (stageName.includes(CONFIG.stages[key].toLowerCase())) {
          buckets[key].push(proj);
        }
      });
    });

    // 3) Calculo % permisos por bucket
    const permissions = stageKeys.reduce((acc, key) => {
      const list = buckets[key];
      const total = list.length;
      const yes = list.filter((p) => p.hasPermission).length;
      acc[key] = total > 0 ? yes / total : 0;
      return acc;
    }, {});

    return { todayProjects: todayProjs, stageBuckets: buckets, permissionRates: permissions };
  }, [projects]);

  if (loadingProjects || projects.length === 0) {
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

  const handleOpenTaskReminder = (rem) => {
    localStorage.setItem('projectId', rem.project.id);
    localStorage.setItem('projectReminderTab', 'tasks');
    localStorage.setItem('projectReminderTaskId', rem.projectDefaultTask.id);
    router.push(paths.dashboard.project.details(rem.project.id));
  };

  const isInst = isInstaller(userLogged?.data?.user_role?.name);

  return (
    <DashboardContent maxWidth="xl">
      <WelcomeTypography userLogged={userLogged} />

      {!isInst ? (
        <Grid container spacing={1}>
          {Object.entries(CONFIG.stages).slice(0, 5).map(([key, label]) => (
            <Grid key={key} xs={12} sm={6} md={2.4}>
              <AnalyticsWidgetSummary
                sx={{ cursor: 'pointer' }}
                title={label}
                percent={permissionRates[key]}
                total={stageBuckets[key].length}
                quantity={stageBuckets[key].length}
                color={widgetColors[key]}
                icon={
                  <img
                    src={`${CONFIG.assetsDir}/assets/icons/glass/ic-${key}-stage.svg`}
                    alt={key}
                  />
                }
              />
            </Grid>
          ))}
        </Grid>
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

      <Grid container spacing={1}>
        <Grid xs={12} md={isInst ? 12 : 4} lg={isInst ? 12 : 4}>
          <ProjectsToDoToday title="Installation(s) Today" list={todayProjects} />
        </Grid>

        {!isInst && (
          <>
            <Grid xs={12} md={4} lg={4}>
              <ProjectsStageToday
                title="In Installation Stage"
                stage={CONFIG.stages.installation}
                list={stageBuckets.installation}
              />
            </Grid>

            <Grid xs={12} md={4} lg={4}>
              {availableReminders.length > 0 ? (
                <AnalyticsNews
                  title="Reminders"
                  subheader="For Today"
                  list={availableReminders}
                  onClick={handleOpenTaskReminder}
                />
              ) : (
                <ProjectsStageToday
                  title="In Closing Stage"
                  stage={CONFIG.stages.closing}
                  list={stageBuckets.closing}
                />
              )}
            </Grid>
          </>
        )}
      </Grid>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1,
          width: '100%',
        }}
      >

        {/* CALENDAR */}
        <Box
          sx={{
            flex: 1,
            mt: 1.5,
            width: '100%',
            height: 370,
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <Scrollbar sx={{ height: 370 }}>
            <CalendarComponent height={350} isOnlyWeek />
          </Scrollbar>
        </Box>

        {/* PROJECT LIST (solo si NO es installer) */}
        {!isInstaller(userLogged?.data?.user_role?.name) && (
          <Box
            sx={{
              flex: 1,
              width: '100%',
              mt: { xs: 1, md: 0 },
            }}
          >
            <ProjectListView projects={projects} loadingProjects={loadingProjects} />
          </Box>
        )}

      </Box>

    </DashboardContent>
  );

}
