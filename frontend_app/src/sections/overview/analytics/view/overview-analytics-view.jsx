import React, { useRef, useMemo, useState, useEffect, useContext, useCallback } from 'react';

import { CONFIG } from 'src/config-global';

import { fDate, fDateTime, fIsBetween } from 'src/utils/format-time';

import Grid from '@mui/material/Unstable_Grid2';

import Typography from '@mui/material/Typography';
import { Box, LinearProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';

import { useTable, getComparator } from 'src/components/table';
import { useBoolean } from 'src/hooks/use-boolean';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import { ProjectCalendarView } from 'src/sections/project/calendar/view';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { WelcomeTypography } from '../welcome-typography';
import { ProjectsToDoToday } from '../projects-to-do-today';
import { ProjectsStageToday } from '../projects-stage-today';

const headersCSV = [
  { label: 'SKU', key: 'sku' },
  { label: 'Qty', key: 'stockOnHand' },
  { label: 'Difference', key: 'difference' },
]

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {

  
  localStorage.setItem('backFromProjectDetails', 'analytics');


  const isOnlyWeek = useBoolean(true);


  const { setError, isMobile } = useContext(LoadingContext);

  const [updating, setUpdating] = useState(false);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading data...');

  const router = useRouter();

  const [categories, setCategories] = useState(['Items']);

  const [openModal, setOpenModal] = useState({
    subListItems: false,
    subListItemsSerials: false,
    itemSerialsDetails: false,
    listItemsSerials: false,
  });

  const handleOpenModal = (modalId) => {
    setOpenModal((prev) => ({ ...prev, [modalId]: true }));
  };

  const handleCloseModal = (modalId) => {
    setOpenModal((prev) => ({ ...prev, [modalId]: false }));
  };

  const [modalListItems, setModalListItems] = useState(null);
  const [modalTitle, setModalTitle] = useState(null);
  const [modalButtonColor, setModalButtonColor] = useState(null);

  const filters = useSetState({ name: '' });

  const table = useTable({ defaultDense: true });

  const itemsZohoSenitronRef = useRef(null);

  const intervalIdRef = useRef(null);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [hasIgnoredErrors, setHasIgnoredErrors] = useState(false);

  // console.log('userLogged', userLogged);

  const {
    loadedProjects,
    refetchProjects,
  } = useDataContext();

  const [projects, setProjects] = useState([]);
  const [installationProjects, setInstallationProjects] = useState([]);
  const [closingProjects, setClosingProjects] = useState([]);

  useEffect(() => {
    if (refetchProjects) {
      refetchProjects();
    }
    setProjects(loadedProjects || []);
  }, [refetchProjects, loadedProjects]);

  useEffect(() => {
    if (loadedProjects) {
      setProjects(loadedProjects);
    }
  }, [loadedProjects]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/projects/`);
    // socket.onopen = () => {
    //   console.log('WebSocket connected');
    // };
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    // socket.onclose = (e) => {
    //   console.log('WebSocket closed', e);
    // };
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



  return (
    <>
      {
        !projects ? (
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
          <>
            <DashboardContent maxWidth="xl">
              <WelcomeTypography
                userLogged={userLogged}
              />
              <Grid container spacing={1}>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.preparation} Stage`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                      ).length
                    }
                    color="error"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-preparation-stage.svg`} />
                    }
                    chart={{
                      categories: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                      ).map((proj) => fDateTime(proj.startDate)).slice(-8),
                      series: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1
                      ).map((proj) => proj.hasPermission).slice(-8),
                    }}
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.coordination} Stage`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                      ).length
                    }
                    color="secondary"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-coordination-stage.svg`} />
                    }
                    chart={{
                      categories: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                      ).map((proj) => fDateTime(proj.startDate)).slice(-8),
                      series: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1
                      ).map((proj) => proj.hasPermission).slice(-8),
                    }}
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.installation} Stage`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                      ).length
                    }
                    color="info"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-installation-stage.svg`} />
                    }
                    chart={{
                      categories: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                      ).map((proj) => fDateTime(proj.startDate)).slice(-8),
                      series: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1
                      ).map((proj) => proj.hasPermission).slice(-8),
                    }}
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.permission} Stage`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                      ).length
                    }
                    color="warning"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-permission-stage.svg`} />
                    }
                    chart={{
                      categories: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                      ).map((proj) => fDateTime(proj.startDate)).slice(-8),
                      series: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
                      ).map((proj) => proj.hasPermission).slice(-8),
                    }}
                    onClick={() => { }}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={2.4}>
                  <AnalyticsWidgetSummary
                    sx={{ cursor: 'pointer' }}
                    title={`${CONFIG.stages.closing} Stage`}
                    percent={
                      linearRegresionCalculation(
                        projects?.filter(
                          proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                        ).map((proj) => proj.hasPermission)
                      )}
                    total={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                      ).length
                    }
                    quantity={
                      projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                      ).length
                    }
                    color="success"
                    icon={
                      <img alt="icon" src={`${CONFIG.assetsDir}/assets/icons/glass/ic-closing-stage.svg`} />
                    }
                    chart={{
                      categories: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                      ).map((proj) => fDateTime(proj.startDate)).slice(-8),
                      series: projects?.filter(
                        proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1
                      ).map((proj) => proj.hasPermission).slice(-8),
                    }}
                    onClick={() => { }}
                  />
                </Grid>
              </Grid>
              <Grid container xs={12} spacing={1}>

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
                    <ProjectsToDoToday
                      title="To do today"
                      list={projects.filter(proj => fDate(proj.startDate) === fDate(new Date()) || fIsBetween(new Date(), proj.startDate, proj.endDate))}
                    />
                  </Box>
                </Grid>
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
                      list={projects.filter(proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1)}
                    />
                  </Box>
                </Grid>
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
                      list={projects.filter(proj => proj.currentStage.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1)}
                    />
                  </Box>
                </Grid>
              </Grid>
              <Grid container xs={12} spacing={1}>
                <Box sx={{ mt: 0, mb: 0, width: '100%' }}>
                  <ProjectCalendarView projects={projects} isOnlyWeek={isOnlyWeek.value} />
                </Box>
              </Grid>
            </DashboardContent >
          </>
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

