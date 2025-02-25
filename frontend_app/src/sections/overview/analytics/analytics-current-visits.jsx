import React, { useEffect } from 'react';

import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart, ChartLegends } from 'src/components/chart';
// ----------------------------------------------------------------------

export function AnalyticsCurrentVisits({
  title,
  subheader,
  chart,
  openModal,
  setOpenModal,
  handleOpenModal,
  modalTitle,
  headersCSV,
  setModalTitle,
  modalDataFiltered,
  setModalDataFiltered,
  modalButtonColor,
  setModalButtonColor,
  zohoItems,
  senitronItems,
  handleViewRow,
  handleFilterName,
  filters,
  userLogged,
  hasIgnoredErrors,
  setHasIgnoredErrors,
  ignoreErrorsSelected,
  setIgnoreErrorsSelected,
  handleCheckboxChange,
  handleSelectAllIgnoreErrors,
  valueIgnoreErrors,
  handleUpdateIgnoreErrors,
  isIgnore,
  setIsIgnore,
  ...other
}) {
  const theme = useTheme();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors = chart.colors ?? [
    hexAlpha(theme.palette.success.main, 0.8),
    hexAlpha(theme.palette.success.dark, 0.8),
    hexAlpha(theme.palette.info.main, 0.8),
    hexAlpha(theme.palette.info.dark, 0.8),
    hexAlpha(theme.palette.warning.main, 0.8),
    hexAlpha(theme.palette.warning.dark, 0.8),
    hexAlpha(theme.palette.error.main, 0.8),
  ];

  useEffect(() => {
    if (zohoItems.length > 0 && senitronItems.length > 0) {
      const newData = [];
      const sItemMap = new Map();
      senitronItems.forEach((sItem) => {
        sItemMap.set(sItem.itemNumber, sItem);
      });
      zohoItems.filter(item => item.syncedWithSenitron).forEach((zItem) => {
        const sItem = sItemMap.get(zItem.itemId);
        const max = Math.max(zItem.stockOnHand, sItem?.count ?? 0);
        const min = Math.min(zItem.stockOnHand, sItem?.count ?? 0);
        const match = max !== 0 ? Math.floor((min / max) * 100) : max === 0 && min === 0 ? 100 : 0;
        newData.push({
          itemId: zItem.itemId,
          name: zItem.name,
          sku: zItem.sku,
          stockOnHand: zItem.stockOnHand,
          quantity: sItem?.count ?? 0,
          difference: parseInt(sItem?.count ?? 0, 10) - parseInt(zItem.stockOnHand, 10),
          percentage: match,
        });
      });
      setModalDataFiltered(newData);
    }
  }, [zohoItems, senitronItems, setModalDataFiltered]);


  const chartOptions = useChart({
    colors: chartColors,
    labels: chart.series.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    tooltip: {
      y: {
        formatter: (value) => fNumber(value),
        title: { formatter: (seriesName) => `${seriesName}` },
      },
    },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
    chart: {
      sparkline: {
        enabled: true
      },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const {dataPointIndex} = config;
          const list = handleViewSublists(dataPointIndex);

          setModalTitle(
            dataPointIndex === 0 ? `SKUs Matched 100 %` :
              dataPointIndex === 1 ? `SKUs Matched between 90 % and 100 %` :
                dataPointIndex === 2 ? `SKUs Matched between 80 % and 90 %` :
                  dataPointIndex === 3 ? `SKUs Matched between 70 % and 80 %` :
                    dataPointIndex === 4 ? `SKUs Matched between 60 % and 70 %` :
                      dataPointIndex === 5 ? `SKUs Matched between 50 % and 60 %` : `SKUs Matched less than 50 %`
          );

          setModalButtonColor(
            dataPointIndex === 0 ? hexAlpha(theme.palette.success.main, 0.8) :
              dataPointIndex === 1 ? hexAlpha(theme.palette.success.dark, 0.8) :
                dataPointIndex === 2 ? hexAlpha(theme.palette.info.main, 0.8) :
                  dataPointIndex === 3 ? hexAlpha(theme.palette.info.dark, 0.8) :
                    dataPointIndex === 4 ? hexAlpha(theme.palette.warning.main, 0.8) :
                      dataPointIndex === 5 ? hexAlpha(theme.palette.warning.dark, 0.8) : hexAlpha(theme.palette.error.main, 0.8)
          );

          setHasIgnoredErrors(dataPointIndex !== 0);

          setModalDataFiltered(list);
          handleOpenModal('subListItems');
        },
      },
    },
    ...chart.options,
  });

  const handleViewSublists = (seriesIndex) => modalDataFiltered?.filter((item) =>
    seriesIndex === 0 ? parseInt(item.percentage, 10) === 100 :
      seriesIndex === 1 ? item.percentage >= 90 && item.percentage < 100 :
        seriesIndex === 2 ? item.percentage >= 80 && item.percentage < 90 :
          seriesIndex === 3 ? item.percentage >= 70 && item.percentage < 80 :
            seriesIndex === 4 ? item.percentage >= 60 && item.percentage < 70 :
              seriesIndex === 5 ? item.percentage >= 50 && item.percentage < 60 : item.percentage < 50
  );

  return (
    <>
      <Card {...other}>
        <CardHeader title={title} subheader={subheader} />

        <Chart
          type="donut"
          series={chartSeries}
          options={chartOptions}
          width={{ xs: 200, xl: 220 }}
          height={{ xs: 200, xl: 220 }}
          sx={{ my: 2.5, mx: 'auto' }}
        />

        <Divider sx={{ borderStyle: 'dashed' }} />

        <ChartLegends
          labels={chartOptions?.labels}
          colors={chartOptions?.colors}
          sx={{ p: 3, justifyContent: 'center' }}
        />
      </Card>
      
    </>
  );
}
