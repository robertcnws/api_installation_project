import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import axios from 'axios';
import { fDate, fDateTime } from 'src/utils/format-time';
import { LoadingContext } from 'src/auth/context/loading-context';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Box, Stack, LinearProgress, Button, Alert } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useSetState } from 'src/hooks/use-set-state';
import { useTable, getComparator } from 'src/components/table';
import { CONFIG } from 'src/config-global';
import { useDataContext } from 'src/auth/context/data/data-context';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  _analyticTasks,
  _analyticPosts,
  _analyticTraffic,
  _analyticOrderTimeline,
  _bookingReview,
  _bookingsOverview,
  _bankingContacts,
} from 'src/_mock';

import { WelcomeTypography } from 'src/sections/welcome-typography/welcome-typography';
import AnimatedIcon from 'src/components/animate/animated-icon';


import { ItemListShippedLogsView } from 'src/sections/live-monitor/view/item-list-shipped-logs';

import { BookingCheckInWidgets } from 'src/sections/live-monitor/booking/booking-check-in-widgets';
import { BookingBooked } from 'src/sections/live-monitor/booking/booking-booked';
import { BookingTotalIncomes } from 'src/sections/live-monitor/booking/booking-total-incomes';
import { ModalListItemsSerials } from './modal-list-items-serials';
import { ItemListShippedLogsTotals } from './item-list-shipped-logs-totals';
import { ItemListShippedLogsTotalsTable } from './item-list-shipped-logs-totals-table';



// ----------------------------------------------------------------------

export function LiveMonitorAnalyticsView() {


  const { setError, isMobile } = useContext(LoadingContext);

  const [updating, setUpdating] = useState(false);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading data...');


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


  const [modalListItems, setModalListItems] = useState(null);

  const filters = useSetState({ name: '' });

  const globalDateFilters = useSetState({
    startDate: null,
    endDate: null,
  });

  const table = useTable({ defaultDense: true });

  const itemsZohoSenitronRef = useRef(null);

  const intervalIdRef = useRef(null);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  // console.log('userLogged', userLogged);

  const {
    senitronItems,
    itemsZohoData,
    jobsUpdatingTimeData,
    manualUpdatingJobsData,
    itemsAssetsLogsInfo,
    itemsZohoSenitron,
    itemsSenitronZoho,
    countLostItems,
    setCountLostItems
  } = useDataContext();

  const [date, setDate] = useState(null);

  const [isLive, setIsLive] = useState(true);

  const [stateWidthModal, setStateWidthModal] = React.useState('md');

  useEffect(() => {
    if (globalDateFilters.state.startDate && globalDateFilters.state.endDate) {
      setDate(fDate(globalDateFilters.state.endDate, 'YYYY-MM-DD'));
    }
  }, [globalDateFilters]);

  const filteredData = useMemo(() => {
    if (itemsAssetsLogsInfo && itemsAssetsLogsInfo.length > 0) {
      return itemsAssetsLogsInfo?.map(item => {
        const filteredLogs = item?.logs?.filter(log => fDate(log.createdAt, 'YYYY-MM-DD') === date);
        return {
          ...item,
          logs: filteredLogs,
        };
      }).filter(item => item?.logs?.length > 0);
    }
    return null;
  }, [itemsAssetsLogsInfo, date]);

  // console.log('filteredData', filteredData);


  const lastLog = filteredData?.length > 0 ? filteredData[0].logs[filteredData[0].logs.length - 1] : 0;


  const totalsNewsTrack = useMemo(() => {
    if (filteredData) {
      return filteredData?.filter(item => fDate(item.date, 'YYYY-MM-DD') === date).reduce(
        (acc, item) => acc + item.logs.filter(
          log => fDate(log.createdAt, 'YYYY-MM-DD') === date).reduce(
            (acl, log) => acl + (log.currentStatusName.toLowerCase().includes('live') ? 1 : 0), 0
          ), 0
      );
    }
    return 0;
  }, [filteredData, date]);


  const totalsRemovedTrack = useMemo(() => {
    if (filteredData) {
      return filteredData?.filter(item => fDate(item.date, 'YYYY-MM-DD') === date).reduce(
        (acc, item) => acc + item.logs.filter(
          log => fDate(log.createdAt, 'YYYY-MM-DD') === date).reduce(
            (acl, log) => acl + (log.currentStatusName.toLowerCase().includes('remove') ? 1 : 0), 0
          ), 0
      );
    }
    return 0;
  }, [filteredData, date]);


  const totalsKilledTrack = useMemo(() => {
    if (filteredData) {
      return filteredData?.filter(item => fDate(item.date, 'YYYY-MM-DD') === date).reduce(
        (acc, item) => acc + item.logs.filter(
          log => fDate(log.createdAt, 'YYYY-MM-DD') === date).reduce(
            (acl, log) => acl + (log.currentStatusName.toLowerCase().includes('kill') ? 1 : 0), 0
          ), 0
      );
    }
    return 0;
  }, [filteredData, date]);

  const totalsLostsTrack = useMemo(() => totalsRemovedTrack + totalsKilledTrack, [totalsRemovedTrack, totalsKilledTrack]);

  const itemsSynced = useMemo(() => {
    if (itemsZohoData) {
      return itemsZohoData.filter((item) => item.syncedWithSenitron);
    }
    return null;
  }, [itemsZohoData]);

  const totalSenitronQty = useMemo(() => {
    if (senitronItems) {
      return senitronItems.reduce((acc, senitronItem) => acc + senitronItem.count, 0);
    }
    return null;
  }, [senitronItems]);

  const totalZohoQty = useMemo(() => {
    if (itemsSynced) {
      return itemsSynced.reduce((acc, item) => acc + item.stockOnHand, 0);
    }
    return null;
  }, [itemsSynced]);


  const { totalErrors } = useMemo(() => {
    if (itemsZohoSenitron) {
      const errors =
        Math.abs(
          parseInt(
            itemsZohoSenitron
              ?.filter(
                (it) =>
                  parseInt(it.stockOnHand, 10) - parseInt(it.quantity, 10) > 0 &&
                  it.syncedWithSenitron &&
                  !it.ignoreErrors
              )
              .reduce((acc, it) => acc + it.quantity, 0),
            10
          ) -
          parseInt(
            itemsZohoSenitron
              ?.filter(
                (it) =>
                  parseInt(it.stockOnHand, 10) - parseInt(it.quantity, 10) > 0 &&
                  it.syncedWithSenitron &&
                  !it.ignoreErrors
              )
              .reduce((acc, it) => acc + it.stockOnHand, 0),
            10
          )
        ) +
        Math.abs(
          parseInt(
            itemsZohoSenitron
              ?.filter(
                (it) =>
                  parseInt(it.stockOnHand, 10) - parseInt(it.quantity, 10) < 0 &&
                  it.syncedWithSenitron &&
                  !it.ignoreErrors
              )
              .reduce((acc, it) => acc + it.quantity, 0),
            10
          ) -
          parseInt(
            itemsZohoSenitron
              ?.filter(
                (it) =>
                  parseInt(it.stockOnHand, 10) - parseInt(it.quantity, 10) < 0 &&
                  it.syncedWithSenitron &&
                  !it.ignoreErrors
              )
              .reduce((acc, it) => acc + it.stockOnHand, 0),
            10
          )
        );

      const tSenitronQty = itemsZohoSenitron
        ?.filter((it) => it.syncedWithSenitron && !it.ignoreErrors)
        .reduce((acc, item) => acc + item.quantity, 0);

      const tOnHand = itemsZohoSenitron
        ?.filter((it) => it.syncedWithSenitron && !it.ignoreErrors)
        .reduce((acc, item) => acc + item.stockOnHand, 0);

      const tErrors = errors;
      const tRFIDCorrect = tSenitronQty - errors;
      const percent = Math.floor(((tOnHand - errors) / tOnHand) * 100) || 0;
      return { percentage: percent, totalErrors: tErrors, totalRFIDCorrect: tRFIDCorrect };
    }
    return { percentage: null, totalErrors: null, totalRFIDCorrect: null };
  }, [itemsZohoSenitron]);

  /**
   * Shipments
   */

  const [totalsItemsNoReconciled, setTotalsItemsNoReconciled] = useState(0);
  const [totalsItemsLost, setTotalsItemsLost] = useState(0);
  const [totalsItemsAll, setTotalsItemsAll] = useState(0);
  const [listItemsNoReconciled, setListItemsNoReconciled] = useState(null);
  const [listItemsLost, setListItemsLost] = useState(null);

  // console.log('finalGroupedArray', finalGroupedArray);

  // Data loaded validation

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (
      itemsZohoSenitron &&
      itemsSenitronZoho &&
      itemsZohoData &&
      totalZohoQty !== null &&
      totalSenitronQty !== null &&
      totalErrors !== null &&
      globalDateFilters.state.endDate !== null &&
      filteredData !== null &&
      !updating
    ) {
      setDataLoaded(true);
    } else {
      setDataLoaded(false);
    }
  }, [
    itemsZohoSenitron,
    itemsSenitronZoho,
    itemsZohoData,
    totalZohoQty,
    totalSenitronQty,
    totalErrors,
    globalDateFilters.state.endDate,
    filteredData,
    updating,
  ]);

  useEffect(() => {
    if (itemsZohoSenitron) {
      itemsZohoSenitronRef.current = itemsZohoSenitron;
    }
  }, [itemsZohoSenitron]);

  useEffect(() => {
    async function createZohoSenitronItems() {
      const currentItems = itemsZohoSenitronRef.current;
      if (currentItems) {
        try {
          // console.log('response', response);
        } catch (err) {
          console.error('Error al crear la información de seguimiento de SKU:', err);
        }
      }
    }

    if (dataLoaded && !intervalIdRef.current) {
      createZohoSenitronItems();
      intervalIdRef.current = setInterval(() => {
        createZohoSenitronItems();
      }, 5 * 60 * 1000);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [dataLoaded]);




  const handleFilterName = useCallback(
    (event) => {
      filters.setState({ name: event.target.value });
    },
    [filters]
  );


  const handleSetManualUpdatingJobs = (isRunning) => {
    const payload = {
      is_running: isRunning,
    };
    axios
      .post(`${CONFIG.apiUrl}/api_zoho/set_manual_updating_jobs/`, payload)
      .then(() => {
        console.log(`Manual updating jobs set to ${isRunning}`);
      })
      .catch((err) => {
        console.error('Error setting manual updating jobs:', err);
        setError('There was an error setting manual updating jobs.');
      });
  }


  return (
    <>
      {!itemsZohoSenitron || !itemsSenitronZoho || !itemsZohoData || filteredData === null ||
        totalZohoQty === null || totalSenitronQty === null || totalErrors === null || updating ? (
        <>
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
        </>
      ) : (
        <>
          <DashboardContent maxWidth="xl">
            <Grid container spacing={3}>
              <Grid xs={countLostItems > 0 ? 8 : 12} sm={countLostItems > 0 ? 8 : 12} md={countLostItems > 0 ? 8 : 12}>
                <WelcomeTypography
                  userLogged={userLogged}
                  manualUpdatingJobsData={manualUpdatingJobsData}
                  jobsUpdatingTimeData={jobsUpdatingTimeData}
                  itemsZohoSenitron={itemsZohoSenitron}
                  setUpdating={setUpdating}
                  setError={setError}
                  handleSetManualUpdatingJobs={handleSetManualUpdatingJobs}
                  setTitleLinearProgress={setTitleLinearProgress}
                  isMobile={isMobile}
                />
              </Grid >
              {countLostItems > 0 && (
                <Grid xs={4} sm={4} md={4}>
                  <Alert
                    severity="error"
                    icon={<AnimatedIcon icon="mdi:error" color="error" width="25px" />}
                    sx={{ mb: 2, cursor: 'pointer', p: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '14px' }}>
                      <b>{countLostItems}</b> {`${!isMobile ? `Items` : ``} lost today`}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid >

            <Grid container spacing={3}>


              {/* <Grid container xs={12}>
                <Grid xs={12} md={12} lg={12}>
                  <Box
                    sx={{
                      mb: 1,
                      p: { md: 1 },
                      display: 'flex',
                      gap: { xs: 3, md: 1 },
                      borderRadius: { md: 2 },
                      flexDirection: 'column',
                      bgcolor: { md: 'background.neutral' },
                    }}
                  >
                    <ItemListShippedLogsView
                      setTotalsItemsNoReconciled={setTotalsItemsNoReconciled}
                      setTotalsItemsLost={setTotalsItemsLost}
                      setTotalsItemsAll={setTotalsItemsAll}
                      setListItemsNoReconciled={setListItemsNoReconciled}
                      setListItemsLost={setListItemsLost}
                      updating={updating}
                      setUpdating={setUpdating}
                      setTitleLinearProgress={setTitleLinearProgress}
                      globalDateFilters={globalDateFilters}
                    />

                  </Box>
                </Grid>
              </Grid> */}

              <Grid container xs={12}>

                <Grid xs={12} md={7} lg={8}>
                  <Box
                    sx={{
                      mb: 1,
                      p: { md: 1 },
                      display: 'flex',
                      gap: { xs: 3, md: 1 },
                      borderRadius: { md: 2 },
                      flexDirection: 'column',
                      bgcolor: { md: 'background.neutral' },
                      minHeight: { md: '100%' },
                    }}
                  >
                    <ItemListShippedLogsView
                      setTotalsItemsNoReconciled={setTotalsItemsNoReconciled}
                      setTotalsItemsLost={setTotalsItemsLost}
                      setTotalsItemsAll={setTotalsItemsAll}
                      setListItemsNoReconciled={setListItemsNoReconciled}
                      setListItemsLost={setListItemsLost}
                      updating={updating}
                      setUpdating={setUpdating}
                      setTitleLinearProgress={setTitleLinearProgress}
                      globalDateFilters={globalDateFilters}
                    />

                  </Box>
                </Grid>
                <Grid xs={12} md={5} lg={4}>
                  <Box
                    sx={{
                      p: { md: 1 },
                      display: 'grid',
                      gap: { xs: 3, md: 0 },
                      borderRadius: { md: 2 },
                      bgcolor: { md: 'background.paper' },
                      gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
                    }}
                  >
                    {!isMobile && (
                      <BookingTotalIncomes
                        title="Items read on"
                        // total={finalGroupedArray.filter((item) => item.date === startDate).reduce((acc, item) => acc + item.itemTotalQty, 0)}
                        total={totalsNewsTrack + totalsLostsTrack}
                        percent={2.6}
                        // chart={{
                        //   categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                        //   series: [{ data: [10, 41, 80, 100, 60, 120, 69, 91, 160] }],
                        // }}
                        chart={{
                          categories: [],
                          series: [{ data: [] }],
                        }}
                        isMobile={isMobile}
                      />
                    )}

                    <BookingBooked
                      title="Items Totals"
                      data={
                        [
                          { status: 'Canceled', value: totalsLostsTrack + totalsNewsTrack, quantity: totalsLostsTrack },
                          { status: 'Sold', value: totalsLostsTrack + totalsNewsTrack, quantity: totalsNewsTrack },
                        ]
                      }
                      sx={{ boxShadow: { md: 'none' } }}
                      openModal={openModal}
                      setOpenModal={setOpenModal}
                      handleOpenModal={handleOpenModal}
                      isLive={isLive}
                      setIsLive={setIsLive}
                    />
                  </Box>

                  <BookingCheckInWidgets
                    chart={{
                      series: [
                        { label: 'To reconcile', percent: (parseFloat((totalsItemsNoReconciled / totalsItemsAll)) * 100 || 0).toFixed(2), total: totalsItemsNoReconciled },
                        { label: 'Losts', percent: (parseFloat((totalsItemsLost / totalsItemsAll)) * 100 || 0).toFixed(2), total: totalsItemsLost },
                      ],
                      // colors: [theme.palette.warning.light, theme.palette.error.light],
                    }}
                    sx={{ boxShadow: { md: 'none' } }}
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    handleOpenModal={handleOpenModal}
                    listItemsNoReconciled={listItemsNoReconciled}
                    listItemsLost={listItemsLost}
                  />
                </Grid>
              </Grid>

              <Grid container xs={12}>

                <Grid xs={12} md={6} lg={6}>
                  <Box
                    sx={{
                      mb: 1,
                      p: { md: 1 },
                      display: 'flex',
                      gap: { xs: 3, md: 1 },
                      borderRadius: { md: 2 },
                      flexDirection: 'column',
                      bgcolor: { md: 'background.neutral' },
                      minHeight: { md: '100%' },
                    }}
                  >
                    <ItemListShippedLogsTotals
                      title='Items Received/Shipped'
                      subheader={`
                  ${filteredData.length} 
                  ${lastLog.createdTime ? ` SKUs with last changes at ${fDate(lastLog.createdTime)}` : `SKUs without changes`
                        }`}
                      list={filteredData}
                      openModal={openModal}
                      setOpenModal={setOpenModal}
                      handleOpenModal={handleOpenModal}
                      table={table}
                      filters={filters}
                      handleFilterName={handleFilterName}
                      globalDateFilters={globalDateFilters}
                      setStateWidthModal={setStateWidthModal}
                      isLive={isLive}
                      setIsLive={setIsLive}
                    />
                  </Box>
                </Grid>
                <Grid xs={12} md={6} lg={6}>
                  <Box
                    sx={{
                      mb: 1,
                      p: { md: 1 },
                      display: 'flex',
                      gap: { xs: 3, md: 1 },
                      borderRadius: { md: 2 },
                      flexDirection: 'column',
                      bgcolor: { md: 'background.neutral' },
                      minHeight: { md: '100%' },
                    }}
                  >
                    <ItemListShippedLogsTotalsTable
                      title='Details Items Received/Shipped'
                      subheader={`
                  ${filteredData.length} 
                  ${lastLog.createdTime ? ` SKUs with last changes at ${fDate(lastLog.createdTime)}` : `SKUs without changes`
                        }`}
                      list={filteredData}
                      openModal={openModal}
                      setOpenModal={setOpenModal}
                      handleOpenModal={handleOpenModal}
                      table={table}
                      filters={filters}
                      handleFilterName={handleFilterName}
                      globalDateFilters={globalDateFilters}
                      setStateWidthModal={setStateWidthModal}
                      isLive={isLive}
                      setIsLive={setIsLive}
                    />
                  </Box>
                </Grid>
              </Grid>


            </Grid>
          </DashboardContent >

          <ModalListItemsSerials
            openModal={openModal}
            setOpenModal={setOpenModal}
            handleOpenModal={handleOpenModal}
            filters={filters}
            handleFilterName={handleFilterName}
            itemsAssetsLogsInfo={filteredData}
            table={table}
            globalDateFilters={globalDateFilters}
            isLive={isLive}
            setIsLive={setIsLive}
          />



        </>
      )
      }
    </>
  );
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


