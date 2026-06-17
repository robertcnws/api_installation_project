import React, { useEffect } from 'react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function AnalyticsWebsiteVisits({
  title,
  subheader,
  element,
  chart,
  openModal,
  setOpenModal,
  modalTitle,
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
  table,
  ...other
}) {

  const theme = useTheme();

  useEffect(() => {
    if (zohoItems.length > 0 && senitronItems.length > 0) {
      const newData = [];
      const sItemMap = new Map();
      senitronItems.forEach((sItem) => {
        sItemMap.set(sItem.itemNumber, sItem);
      });
      zohoItems.forEach((zItem) => {
        const sItem = sItemMap.get(zItem.itemId);
        if (sItem) {
          const max = Math.max(zItem.stockOnHand, sItem.count);
          const min = Math.min(zItem.stockOnHand, sItem.count);
          const match = (min / max) * 100;
          newData.push({
            itemId: zItem.itemId,
            name: zItem.name,
            sku: zItem.sku,
            percentage: match,
          });
        }
      });
      setModalDataFiltered(newData);
    }
  }, [zohoItems, senitronItems, setModalDataFiltered]);

  const chartColors = chart.colors ?? [
    hexAlpha(theme.palette.success.main, 0.8),
    hexAlpha(theme.palette.success.dark, 0.8),
    hexAlpha(theme.palette.info.main, 0.8),
    hexAlpha(theme.palette.info.dark, 0.8),
    hexAlpha(theme.palette.warning.main, 0.8),
    hexAlpha(theme.palette.warning.dark, 0.8),
    hexAlpha(theme.palette.error.main, 0.8),
  ];

  const chartOptions = useChart({
    colors: chartColors,
    stroke: {
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chart.categories,
      show: true,
    },
    legend: {
      show: true,
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} ${element || 'visits'}<br>(Click to see details)`,
        show: true,
      },
      useHTML: true,
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#F9F9F9'],
      }
    },
    chart: {
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const {seriesIndex} = config;
          const list = handleViewSublists(seriesIndex);
          setModalTitle(
            seriesIndex === 0 ? `${list.length} Items (Quantity Matched 100 %)` :
              seriesIndex === 1 ? `${list.length} Items (Quantity Matched between 90 % and 100 %)` :
                seriesIndex === 2 ? `${list.length} Items (Quantity Matched between 80 % and 90 %)` :
                  seriesIndex === 3 ? `${list.length} Items (Quantity Matched between 70 % and 80 %)` :
                    seriesIndex === 4 ? `${list.length} Items (Quantity Matched between 60 % and 70 %)` :
                      seriesIndex === 5 ? `${list.length} Items (Quantity Matched between 50 % and 60 %)` : `${list.length} Items (Quantity Matched less than 50 %)`
          )
          setModalButtonColor(
            seriesIndex === 0 ? hexAlpha(theme.palette.success.main, 0.8) :
              seriesIndex === 1 ? hexAlpha(theme.palette.success.dark, 0.8) :
                seriesIndex === 2 ? hexAlpha(theme.palette.info.main, 0.8) :
                  seriesIndex === 3 ? hexAlpha(theme.palette.info.dark, 0.8) :
                    seriesIndex === 4 ? hexAlpha(theme.palette.warning.main, 0.8) :
                      seriesIndex === 5 ? hexAlpha(theme.palette.warning.dark, 0.8) : hexAlpha(theme.palette.error.main, 0.8)
          )
          setModalDataFiltered(list);
          setOpenModal(true);
        },
      },
    },
    ...chart.options,
  });

  const handleViewSublists = (seriesIndex) => modalDataFiltered.filter((item) =>
    seriesIndex === 0 ? item.percentage >= 100 :
      seriesIndex === 1 ? item.percentage >= 90 && item.percentage < 100 :
        seriesIndex === 2 ? item.percentage >= 80 && item.percentage < 90 :
          seriesIndex === 3 ? item.percentage >= 70 && item.percentage < 80 :
            seriesIndex === 4 ? item.percentage >= 60 && item.percentage < 70 :
              seriesIndex === 5 ? item.percentage >= 50 && item.percentage < 60 : item.percentage < 50
  );

  return (
    <Card {...other}>
        <CardHeader title={title} subheader={subheader} />
        <Chart
          type="donut"
          series={chart.series}
          options={chartOptions}
          height={364}
          sx={{ py: 2.5, pl: 1, pr: 2.5 }}
        />
      </Card>
  );
}
