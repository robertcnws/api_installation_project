import React, { useMemo, useState, useEffect } from 'react';

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

import { ProjectListView } from './product/view';
import { AnalyticsNews } from '../analytics-news';
import { WelcomeTypography } from '../welcome-typography';
import { ProjectsToDoToday } from '../projects-to-do-today';
import { ProjectsStageToday } from '../projects-stage-today';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';




const headersCSV = [
  { label: 'SKU', key: 'sku' },
  { label: 'Qty', key: 'stockOnHand' },
  { label: 'Difference', key: 'difference' },
]

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {


  localStorage.setItem('backFromProjectDetails', 'analytics');


  const isOnlyWeek = useBoolean(true);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading data...');

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [availableReminders, setAvailableReminders] = useState([]);

  const {
    loadedProjects,
    refetchProjects,
    loadingProjects,
    loadedProjectReminders,
  } = useDataContext();

  const [projects, setProjects] = useState([]);

  const handleOpenTaskRemainder = (reminder) => {
    localStorage.setItem('projectId', reminder.project.id);
    localStorage.setItem('projectReminderTab', 'tasks');
    localStorage.setItem('projectReminderTaskId', reminder.projectDefaultTask.project_default_task.id);
    router.push(paths.dashboard.project.details(reminder.project.id));
  };

  // useEffect(() => {
  //   if (refetchProjects) {
  //     refetchProjects();
  //   }
  //   setProjects(loadedProjects || []);
  // }, [refetchProjects, loadedProjects]);

  useEffect(() => {
    if (loadedProjects) {
      setProjects(loadedProjects);
    }
  }, [loadedProjects]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/projects/`);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
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
        setProjects((prevData) => prevData.filter(item => String(item.id) !== String(message.item.id)));
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    if (loadedProjectReminders) {
      setAvailableReminders(loadedProjectReminders?.filter(
        (reminder) => fDate(reminder?.date) === fDate(new Date())
      ) || []);
    }
  }, [loadedProjectReminders]);


  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/project-reminders/`);
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


  return (
    <>
      {
        (!projects?.length === 0 || loadingProjects) ? (
          <Box
            sx={{
              width: '350px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80vh',
              margin: 'auto'
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              {titleLinearProgress}
            </Typography>
            <LinearProgress
              key="error"
              sx={{
                mb: 2,
                width: '100%',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'black',
                },
                backgroundColor: '#e0e0e0',
              }}
            />
          </Box>
        ) : (
          <DashboardContent maxWidth="xl">
            <WelcomeTypography
              userLogged={userLogged}
            />
            {!isInstaller(userLogged?.data.user_role.name) ? (
              <Grid container spacing={1}>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.preparation}`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                      ).length
                    }
                    color="error"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-preparation-stage.svg`} />
                    }
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.coordination}`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                      ).length
                    }
                    color="secondary"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-coordination-stage.svg`} />
                    }
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.installation}`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                      ).length
                    }
                    color="info"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-installation-stage.svg`} />
                    }
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.permission}`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                      ).length
                    }
                    color="warning"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-permission-stage.svg`} />
                    }
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.closing}`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                      ).length
                    }
                    color="success"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-closing-stage.svg`} />
                    }
                    onClick={() => { }}
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container xs={12} spacing={1} sx={{ mb: 1 }}>
                <Button sx={{ cursor: 'pointer', border: '1px solid #ddd', fontSize: '11px' }} color='warning' onClick={() => {
                  router.push(paths.dashboard.project.list)
                }}>
                  <Iconify icon="icon-park-solid:install" />
                  <Typography variant="caption">
                    Go to Installations
                  </Typography>
                </Button>
              </Grid>
            )}
            <Grid container xs={12} spacing={1}>

              <Grid
                xs={12}
                md={!isInstaller(userLogged?.data.user_role.name) ? 4 : 12}
                lg={!isInstaller(userLogged?.data.user_role.name) ? 4 : 12}
              >
                <Box
                  sx={{
                    mb: 1,
                    mt: 1,
                    p: { md: 0 },
                    display: 'flex',
                    gap: { xs: 3, md: 1 },
                    borderRadius: { md: 2 },
                    border: '0px solid grey',
                    flexDirection: 'column',
                    // bgcolor: { md: 'background.neutral' },
                    minHeight: { md: '100%' },
                  }}
                >
                  <ProjectsToDoToday
                    title="Intallations today"
                    list={projects.filter(proj => fDate(proj.startDate) === fDate(new Date()) || fIsBetween(new Date(), proj.startDate, proj.endDate))}
                  />
                </Box>
              </Grid>
              {!isInstaller(userLogged?.data.user_role.name) && (
                <>
                  <Grid xs={12} md={4} lg={4}>
                    <Box
                      sx={{
                        mb: 1,
                        mt: 1,
                        p: { md: 0 },
                        display: 'flex',
                        gap: { xs: 3, md: 1 },
                        borderRadius: { md: 2 },
                        border: '0px solid grey',
                        flexDirection: 'column',
                        // bgcolor: { md: 'background.neutral' },
                        minHeight: { md: '100%' },
                      }}
                    >
                      <ProjectsStageToday
                        title="In installation stage"
                        stage="Installation"
                        list={projects.filter(proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1)}
                      />
                    </Box>
                  </Grid>
                  {availableReminders?.length > 0 ? (
                    <Grid xs={12} md={4} lg={4}>
                      <Box
                        sx={{
                          mb: 1,
                          mt: 1,
                          p: { md: 0 },
                          display: 'flex',
                          gap: { xs: 3, md: 1 },
                          borderRadius: { md: 2 },
                          border: '0px solid grey',
                          flexDirection: 'column',
                          // bgcolor: { md: 'background.neutral' },
                          minHeight: { md: '100%' },
                        }}
                      >
                        <AnalyticsNews
                          title="Reminders"
                          subheader="Reminders for today"
                          list={availableReminders}
                          onClick={handleOpenTaskRemainder}
                        />
                      </Box>
                    </Grid>
                  ) : (
                    <Grid xs={12} md={4} lg={4}>
                      <Box
                        sx={{
                          mb: 1,
                          mt: 1,
                          p: { md: 0 },
                          display: 'flex',
                          gap: { xs: 3, md: 1 },
                          borderRadius: { md: 2 },
                          border: '0px solid grey',
                          flexDirection: 'column',
                          // bgcolor: { md: 'background.neutral' },
                          minHeight: { md: '100%' },
                        }}
                      >
                        <ProjectsStageToday
                          title="In closing stage"
                          stage="Closing"
                          list={projects.filter(proj => proj.currentStage?.name?.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1)}
                        />
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>

            <Grid container xs={12} spacing={1}>
              <Grid xs={12} md={6} lg={6}>
                <Box sx={{ mt: 0, mb: 0, width: '100%' }}>
                  <ProjectCalendarView projects={projects} isOnlyWeek={isOnlyWeek.value} />
                </Box>
              </Grid>
              {!isInstaller(userLogged?.data.user_role.name) && (
                <Grid xs={12} md={6} lg={6}>
                  <Box sx={{ mt: 0, mb: 0, width: '100%' }}>
                    <ProjectListView projects={projects} loadingProjects={loadingProjects} />
                  </Box>
                </Grid>
              )}
            </Grid>

          </DashboardContent >
        )}
    </>
  );
}

function applyFilter({ inputData, comparator, filters }) {

  const { name } = filters;

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (name) {
    inputData = inputData?.filter(
      (item) => item.name.trim().toLowerCase().indexOf(name.trim().toLowerCase()) !== -1 ||
        item.sku.trim().toLowerCase().indexOf(name.trim().toLowerCase()) !== -1 ||
        item.itemId.trim().toLowerCase().indexOf(name.trim().toLowerCase()) !== -1
    );
  }

  return inputData;
}


function processingNumbers(arrayNumbers) {
  const ranges = [
    { name: '100%', min: 100, max: Infinity, data: [0] },
    { name: '90% - 100 %', min: 90, max: 100, data: [0] },
    { name: '80% - 90%', min: 80, max: 90, data: [0] },
    { name: '70% - 80%', min: 70, max: 80, data: [0] },
    { name: '60% - 70%', min: 60, max: 70, data: [0] },
    { name: '50% - 60%', min: 50, max: 60, data: [0] },
    { name: '-50%', min: -Infinity, max: 50, data: [0] },
  ];

  arrayNumbers.forEach((number) => {
    const rangeFound = ranges.find(
      (range) => number >= range.min && number < range.max
    );
    if (rangeFound) {
      rangeFound.data[0] += 1;
    }
  });

  return ranges.map(({ name, data }) => ({ name, data }));
};

function processingNumbersPieChart(arrayNumbers) {
  const ranges = [
    { label: '100%', min: 100, max: Infinity, value: 0 },
    { label: '90% - 100 %', min: 90, max: 100, value: 0 },
    { label: '80% - 90%', min: 80, max: 90, value: 0 },
    { label: '70% - 80%', min: 70, max: 80, value: 0 },
    { label: '60% - 70%', min: 60, max: 70, value: 0 },
    { label: '50% - 60%', min: 50, max: 60, value: 0 },
    { label: '-50%', min: -Infinity, max: 50, value: 0 },
  ];

  arrayNumbers.forEach((number) => {
    const rangeFound = ranges.find(
      (range) => number >= range.min && number < range.max
    );
    if (rangeFound) {
      rangeFound.value += 1;
    }
  });

  const list = ranges.map(({ label, value }) => ({ label, value }));

  return list;
};

function linearRegresionCalculation(serie) {
  const n = serie.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i += 1) {
    const x = i;
    const y = serie[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  const pendient = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - pendient * sumX) / n;

  const firstValue = pendient * 0 + intercept;
  const lastValue = pendient * (n - 1) + intercept;
  const percentChange = ((lastValue - firstValue) / firstValue);
  return percentChange;
}

