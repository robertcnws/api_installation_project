import React, { useEffect } from 'react';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart, ChartLegends } from 'src/components/chart';

// ----------------------------------------------------------------------

export function ProjectDetailsChartProject({
  chart,
  ...other
}) {
  const theme = useTheme();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors = chart.colors ?? [
    hexAlpha(theme.palette.success.main, 0.8),
    hexAlpha(theme.palette.error.main, 0.8),
  ];


  const chartOptions = useChart({
    colors: chartColors,
    labels: chart.series.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: true } },
    tooltip: {
      y: {
        formatter: (value) => value,
        title: { formatter: (seriesName) => `${seriesName}` },
      },
    },
    plotOptions: { pie: { donut: { labels: { show: true } } } },
    chart: {
      sparkline: {
        enabled: true
      },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const dataPointIndex = config.dataPointIndex;
        },
      },
    },
    ...chart.options,
  });

  return (
    <>
      <Card sx={{ width: '100%'}} {...other}>
        <CardHeader title={chart?.title} subheader={chart?.subheader} />

        <Chart
          type="radialBar"
          series={chartSeries}
          options={chartOptions}
        //   width={{ xs: 200, xl: 220 }}
        //   height={{ xs: 200, xl: 220 }}
          sx={{ my: 1,  }}
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
