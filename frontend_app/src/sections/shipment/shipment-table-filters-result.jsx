import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import dayjs from 'dayjs';

// ----------------------------------------------------------------------

export function ShipmentTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ shipmentNumber: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    const date = localStorage.getItem('endDate') || dayjs().toISOString();
    filters.setState({ endDate: dayjs(date), startDate: dayjs(date).subtract(1, 'day') });
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    const date = localStorage.getItem('endDate') || dayjs().toISOString();
    filters.setState({ endDate: dayjs(date), startDate: dayjs(date).subtract(1, 'day') });
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
    const date = localStorage.getItem('endDate') || dayjs().toISOString();
    filters.setState({ endDate: dayjs(date), startDate: dayjs(date).subtract(1, 'day') });
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Date:"
        isShow={Boolean(filters.state.endDate)}
      >
        <Chip
          {...chipProps}
          label={fDateShortLabel(filters.state.endDate)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.shipmentNumber}>
        <Chip {...chipProps} label={filters.state.shipmentNumber} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
