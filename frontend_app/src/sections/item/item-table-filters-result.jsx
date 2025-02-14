import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function ItemTableFiltersResult({ filters, onResetPage, totalResults, hasNotAll=true, sx }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: hasNotAll ? 'synced' : 'all' });
  }, [filters, onResetPage, hasNotAll]);

  const handleRemoveSynced = useCallback(
    (inputValue) => {
      const value = inputValue === 'Tracked Inventory' ? 'synced' : inputValue === 'Not Tracked Inventory' ? 'not_synced' : inputValue;
      const newValue = filters.state.syncedWithSenitron.filter((item) => item !== value);

      onResetPage();
      filters.setState({ syncedWithSenitron: newValue });
    },
    [filters, onResetPage]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
    filters.setState({ status: hasNotAll ? 'synced' : 'all' });
  }, [filters, onResetPage, hasNotAll]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.status === 'synced' ? 'Tracked Inventory' : filters.state.status === 'not_synced' ? 'Not Tracked Inventory' : filters.state.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Tracked Inventory:" isShow={!!filters.state.syncedWithSenitron?.length}>
        {filters.state.syncedWithSenitron?.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveSynced(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
