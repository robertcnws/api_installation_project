import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';


// ----------------------------------------------------------------------

export function ServiceFiltersResult({ filters, onResetPage, totalResults, sx }) {

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
    localStorage.removeItem('serviceFilterName');
  }, [filters, onResetPage]);

  const handleRemoveTypes = useCallback(
    (inputValue) => {
      const newValue = filters.state.type.filter((item) => item !== inputValue);
      onResetPage();
      filters.setState({ type: newValue });
      localStorage.setItem('serviceFilterType', JSON.stringify(newValue));
    },
    [filters, onResetPage]
  );

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ startDate: null, endDate: null });
    localStorage.removeItem('serviceFilterStartDate');
    localStorage.removeItem('serviceFilterEndDate');
  }, [filters, onResetPage]);

  const handleRemoveByFactory = useCallback(() => {
    onResetPage();
    filters.setState({ byFactory: false });
    localStorage.removeItem('serviceFilterByFactory');
  }, [filters, onResetPage]);

  const handleRemoveNotByFactory = useCallback(() => {
    onResetPage();
    filters.setState({ notByFactory: false });
    localStorage.removeItem('serviceFilterNotByFactory');
  }, [filters, onResetPage]);

  const handleRemoveInstaller = useCallback(() => {
    onResetPage();
    filters.setState({ installer: { id: null, name: null } });
    localStorage.removeItem('serviceFilterInstaller');
  }, [filters, onResetPage]);

  const handleRemoveCustom = useCallback(
    (customType) => {
      onResetPage();
      if (customType === 'hasComments') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, hasComments: false }
        }));
        localStorage.setItem('serviceFilterCustom', JSON.stringify({ ...filters.state.custom, hasComments: false }));
      }
      else if (customType === 'isPreparation') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isPreparation: { value: false, name: 'preparation' } }
        }));
        localStorage.setItem('serviceFilterCustom', JSON.stringify({ ...filters.state.custom, isPreparation: { value: false, name: 'preparation' } }));
      }
      else if (customType === 'isRepair') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isRepair: { value: false, name: 'repair' } }
        }));
        localStorage.setItem('serviceFilterCustom', JSON.stringify({ ...filters.state.custom, isRepair: { value: false, name: 'repair' } }));
      }
      else if (customType === 'isClosing') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isClosing: { value: false, name: 'closing' } }
        }));
        localStorage.setItem('serviceFilterCustom', JSON.stringify({ ...filters.state.custom, isClosing: { value: false, name: 'closing' } }));
      }
    }, [filters, onResetPage]);


  const handleReset = useCallback(() => {
    onResetPage();
    localStorage.removeItem('serviceFilterName');
    localStorage.removeItem('serviceFilterType');
    localStorage.removeItem('serviceFilterStartDate');
    localStorage.removeItem('serviceFilterEndDate');
    localStorage.removeItem('serviceFilterInstaller');
    localStorage.removeItem('serviceFilterCustom');
    localStorage.removeItem('serviceFilterByFactory');
    localStorage.removeItem('serviceFilterNotByFactory');
    filters.setState({
      name: '',
      type: [],
      startDate: null,
      endDate: null,
      installer: { id: null, name: null },
      byFactory: false,
      notByFactory: false,
      custom: {
        hasPermission: false,
        isPreparation: { name: 'preparation', value: false },
        isRepair: { name: 'repair', value: false },
        isClosing: { name: 'closing', value: false },
        hasComments: false
      }
    });
  }, [filters, onResetPage]);


  return (
    <FiltersResult totalResults={totalResults} onReset={() => handleReset()} sx={sx}>
      <FiltersBlock label="Status:" isShow={!!filters.state.type.length}>
        {filters.state.type.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={item === 'active' ? 'Open' : 'Closed'}
            onDelete={() => handleRemoveTypes(item)}
            sx={{ textTransform: 'capitalize' }}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock
        label="Installation Date:"
        isShow={Boolean(filters.state.startDate && filters.state.endDate)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.startDate, filters.state.endDate)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Service Team:"
        isShow={Boolean(filters.state.installer.id)}
      >
        <Chip
          {...chipProps}
          label={filters.state.installer.name}
          onDelete={handleRemoveInstaller}
        />
      </FiltersBlock>

      <FiltersBlock label="By Factory?:" isShow={Boolean(filters.state.byFactory)}>
        <Chip {...chipProps} label='Yes' onDelete={() => handleRemoveByFactory()} />
      </FiltersBlock>

      <FiltersBlock label="Not by Factory?:" isShow={Boolean(filters.state.notByFactory)}>
        <Chip {...chipProps} label='Yes' onDelete={() => handleRemoveNotByFactory()} />
      </FiltersBlock>

      <FiltersBlock label="Has Comment(s):" isShow={Boolean(filters.state.custom.hasComments)}>
        <Chip {...chipProps} label='Yes' onDelete={() => handleRemoveCustom('hasComments')} />
      </FiltersBlock>

      <FiltersBlock label="Stage(s):" isShow={
        Boolean(filters.state.custom.isPreparation.value ||
          filters.state.custom.isRepair.value ||
          filters.state.custom.isClosing.value)
      }>
        {filters.state.custom.isPreparation.value && (
          <Chip {...chipProps} label='Preparation' onDelete={() => handleRemoveCustom('isPreparation')} />
        )}
        {filters.state.custom.isRepair.value && (
          <Chip {...chipProps} label='Repair' onDelete={() => handleRemoveCustom('isRepair')} />
        )}
        {filters.state.custom.isClosing.value && (
          <Chip {...chipProps} label='Closing' onDelete={() => handleRemoveCustom('isClosing')} />
        )}
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}

// export function ServiceFiltersResult({ filters, onResetPage, totalResults, sx }) {
//   return (
//     <div>Hi</div>
//   )
// }