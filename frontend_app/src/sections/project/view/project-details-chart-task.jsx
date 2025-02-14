import React, { useEffect } from 'react';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart, ChartLegends } from 'src/components/chart';

// ----------------------------------------------------------------------

export function ProjectDetailsChartTask({
  chart,
  ...other
}) {
  const theme = useTheme();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors = chart.colors ?? [
    hexAlpha(theme.palette.warning.dark, 0.8),
    hexAlpha(theme.palette.info.main, 0.8),
    hexAlpha(theme.palette.success.main, 0.8),
    hexAlpha(theme.palette.success.dark, 0.8),
    hexAlpha(theme.palette.info.dark, 0.8),
    hexAlpha(theme.palette.warning.main, 0.8),
    hexAlpha(theme.palette.error.main, 0.8),
  ];

  const baseOptions = {
    chart: {
      type: 'pie',
      sparkline: { enabled: true },
      events: {
        dataPointSelection: (event, chartContext, config) => {
        }
      }
    },
    colors: chartColors,
    labels: chart.series.map(item => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    tooltip: {
      y: {
        formatter: value => fNumber(value),
        title: { formatter: seriesName => seriesName }
      }
    },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
  };
  
  const extraOptions = chart.options || {};
  const mergedChart = { ...baseOptions.chart, ...(extraOptions.chart || {}), type: 'pie' };
  const finalOptions = { ...baseOptions, ...extraOptions, chart: mergedChart };
  
  const chartOptions = useChart(finalOptions);

  return (
    <>
      <Card sx={{ width: '100%' }} {...other}>
        <CardHeader title={chart?.title} subheader={chart?.subheader} />

        <Chart
          type="pie"
          series={chartSeries}
          options={chartOptions}
          //   width={{ xs: 200, xl: 220 }}
          //   height={{ xs: 200, xl: 220 }}
          sx={{ my: 1, }}
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
