import dayjs from 'dayjs';
import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function ShipmentTableFiltersResultListBySku({ filters, totalResults, onResetPage, sx }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ sku: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    const date = localStorage.getItem('endDate') || dayjs().toISOString();
    filters.setState({ endDate: dayjs(date), startDate: dayjs(date).subtract(1, 'day') });
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

      <FiltersBlock label="Keyword:" isShow={!!filters.state.sku}>
        <Chip {...chipProps} label={filters.state.sku} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
