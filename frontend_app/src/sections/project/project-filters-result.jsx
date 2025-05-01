import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function ProjectFiltersResult({ filters, onResetPage, totalResults, sx }) {

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveTypes = useCallback(
    (inputValue) => {
      const newValue = filters.state.type.filter((item) => item !== inputValue);
      onResetPage();
      filters.setState({ type: newValue });
    },
    [filters, onResetPage]
  );

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ startDate: null, endDate: null });
  }, [filters, onResetPage]);

  const handleRemoveInstaller = useCallback(() => {
    onResetPage();
    filters.setState({ installer: { id: null, name: null } });
  }, [filters, onResetPage]);

  const handleRemoveCustom = useCallback(
    (customType) => {
      onResetPage();
      if (customType === 'hasPermission') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, hasPermission: false }
        }));
      }
      else if (customType === 'hasComments') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, hasComments: false }
        }));
      }
      else if (customType === 'isPreparation') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isPreparation: { value: false, name: 'preparation' } }
        }));
      }
      else if (customType === 'isCoordination') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isCoordination: { value: false, name: 'coordination' } }
        }));
      }
      else if (customType === 'isPermission') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isPermission: { value: false, name: 'permission' } }
        }));
      }
      else if (customType === 'isInstallation') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isInstallation: { value: false, name: 'installation' } }
        }));
      }
      else if (customType === 'isClosing') {
        filters.setState((prevState) => ({
          custom: { ...prevState.custom, isClosing: { value: false, name: 'closing' } }
        }));
      }
    }, [filters, onResetPage]);


  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
  }, [filters, onResetPage]);


  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
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
        label="Installer:"
        isShow={Boolean(filters.state.installer.id)}
      >
        <Chip
          {...chipProps}
          label={filters.state.installer.name}
          onDelete={handleRemoveInstaller}
        />
      </FiltersBlock>

      <FiltersBlock label="Need Permission:" isShow={Boolean(filters.state.custom.hasPermission)}>
        <Chip {...chipProps} label='Yes' onDelete={() => handleRemoveCustom('hasPermission')} />
      </FiltersBlock>

      <FiltersBlock label="Has Comment(s):" isShow={Boolean(filters.state.custom.hasComments)}>
        <Chip {...chipProps} label='Yes' onDelete={() => handleRemoveCustom('hasComments')} />
      </FiltersBlock>

      <FiltersBlock label="Stage(s):" isShow={
        Boolean(filters.state.custom.isPreparation.value ||
          filters.state.custom.isCoordination.value ||
          filters.state.custom.isPermission.value ||
          filters.state.custom.isInstallation.value ||
          filters.state.custom.isClosing.value)
      }>
        {filters.state.custom.isPreparation.value && (
          <Chip {...chipProps} label='Preparation' onDelete={() => handleRemoveCustom('isPreparation')} />
        )}
        {filters.state.custom.isCoordination.value && (
          <Chip {...chipProps} label='Coordination' onDelete={() => handleRemoveCustom('isCoordination')} />
        )}
        {filters.state.custom.isInstallation.value && (
          <Chip {...chipProps} label='Installation' onDelete={() => handleRemoveCustom('isInstallation')} />
        )}
        {filters.state.custom.isPermission.value && (
          <Chip {...chipProps} label='Permission' onDelete={() => handleRemoveCustom('isPermission')} />
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
