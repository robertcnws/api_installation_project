import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function MeasurementFiltersResult({ filters, onResetPage, totalResults, sx }) {

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
    localStorage.removeItem('measurementFilterName');
  }, [filters, onResetPage]);

  const handleRemoveCheckDate = useCallback(() => {
    onResetPage();
    filters.setState({ startCheckDate: null, endCheckDate: null });
    localStorage.removeItem('measurementFilterStartCheckDate');
    localStorage.removeItem('measurementFilterEndCheckDate');
  }, [filters, onResetPage]);

  const handleRemoveCheckAssignee = useCallback(() => {
    onResetPage();
    filters.setState({ checkAssignee: { id: null, name: null } });
    localStorage.removeItem('measurementFilterCheckAssignee');
  }, [filters, onResetPage]);


  const handleReset = useCallback(() => {
    onResetPage();
    localStorage.removeItem('measurementFilterName');
    localStorage.removeItem('measurementFilterStartCheckDate');
    localStorage.removeItem('measurementFilterEndCheckDate');
    localStorage.removeItem('measurementFilterCheckAssignee');
    filters.setState({
      name: '',
      startCheckDate: null,
      endCheckDate: null,
      checkAssignee: { id: null, name: null }
    });
  }, [filters, onResetPage]);


  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock
        label="Check Date:"
        isShow={Boolean(filters.state.startCheckDate && filters.state.endCheckDate)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.startCheckDate, filters.state.endCheckDate)}
          onDelete={handleRemoveCheckDate}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Check Assignee:"
        isShow={Boolean(filters.state.checkAssignee.id)}
      >
        <Chip
          {...chipProps}
          label={filters.state.checkAssignee.name}
          onDelete={handleRemoveCheckAssignee}
        />
      </FiltersBlock>

    </FiltersResult>
  );
}