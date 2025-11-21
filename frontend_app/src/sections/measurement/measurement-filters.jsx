import { useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { Button, Tooltip, MenuItem, MenuList, IconButton, Typography } from '@mui/material';

import { isInstaller } from 'src/utils/check-permissions';
import { fDateRangeShortLabel } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { CustomDateRangePicker } from 'src/components/custom-date-range-picker';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

export function MeasurementFilters({
  filters,
  loadedUsers,
  onResetPage,
  openDateRange,
  onOpenDateRange,
  onCloseDateRange,
  openCheckAssigneeFilter,
  onOpenCheckAssigneeFilter,
  onCloseCheckAssigneeFilter,
}) {

  const { isMobile } = useContext(LoadingContext)

  const popoverCustom = usePopover();

  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const createCustomFilterName = useCallback(() => {
    const name = 'Measurements';
    const active = [];
    if (filters.state.startCheckDate && filters.state.endCheckDate)
      active.push(fDateRangeShortLabel(filters.state.startCheckDate, filters.state.endCheckDate));
    if (filters.state.name) active.push(`Matches: ${filters.state.name}`);
    if (filters.state.checkAssignee.id) active.push(`Check Assignee: ${filters.state.checkAssignee.name}`);
    return active.length > 0 ? `${name} (${active.join(', ')})` : `${name}`;
  }, [
    filters.state.name,
    filters.state.startCheckDate,
    filters.state.endCheckDate,
    filters.state.checkAssignee.id,
    filters.state.checkAssignee.name
  ]);

  const [customFilterName, setCustomFilterName] = useState(() => createCustomFilterName());

  useEffect(() => {
    setCustomFilterName(createCustomFilterName());
  }, [createCustomFilterName]);


  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
      localStorage.setItem('measurementFilterName', event.target.value);
    },
    [filters, onResetPage]
  );

  const handleFilterCheckAssignee = useCallback(
    (event) => {
      const id = event.target.value;
      onResetPage();
      const user = loadedUsers.find((u) => u.id === id);
      filters.setState({
        checkAssignee: {
          id,
          name: user?.name || ''
        }
      });
      localStorage.setItem('measurementFilterCheckAssignee', JSON.stringify({ id, name: user?.name || '' }));
    },
    [loadedUsers, filters, onResetPage]
  );

  const handleFilterStartCheckDate = useCallback(
    (newValue) => {
      onResetPage();
      filters.setState({ startCheckDate: newValue });
      localStorage.setItem('measurementFilterStartCheckDate', newValue);
    },
    [filters, onResetPage]
  );

  const handleFilterEndCheckDate = useCallback(
    (newValue) => {
      filters.setState({ endCheckDate: newValue });
      localStorage.setItem('measurementFilterEndCheckDate', newValue);
    },
    [filters]
  );

  const renderCustomFilters = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 100, p: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
          p: 0.5,
          gap: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 'fontWeightBold' }} >
          {customFilterName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2, ml: 1 }}>
          <IconButton
            sx={{
              ml: -4,
              color: 'default.lighter',
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: 'transparent',
              },
            }}
            variant="text"
            onClick={
              (e) => {
                popoverCustom.onOpen(e);
                setIsCustomOpen((prev) => !prev);
              }
            }
          >
            <Iconify icon={isCustomOpen ? 'lsicon:filter-filled' : 'uil:filter'} sx={{ mr: 1 }} />
          </IconButton>
        </Box>
      </Box>
      <CustomPopover
        open={popoverCustom.open}
        anchorEl={popoverCustom.anchorEl}
        onClose={(e) => {
          popoverCustom.onClose(e);
          setIsCustomOpen(false);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{ paper: { sx: { p: 0, width: 502, ml: !isMobile ? -5 : 0 } } }}
        sx={{ maxHeight: 800, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <Stack spacing={0} sx={{ py: -1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: 500, p: 0 }}>
            <MenuList sx={{ p: 0 }}>
              <MenuItem sx={{ p: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0, mt: 1, ml: 1 }}>
                  <Tooltip title="Search measurement(s) by NUMBER, CUSTOMER, INSTALLATION OR ADDRESS...">
                    <TextField
                      value={filters.state.name}
                      onChange={handleFilterName}
                      placeholder="Search measurement(s) by NUMBER, CUSTOMER, INSTALLATION OR ADDRESS..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                onResetPage();
                                filters.setState({ name: '' });
                              }}
                              variant='text'
                              sx={{ color: 'text.disabled' }}
                            >
                              <Iconify icon="eva:close-circle-fill" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: '100%', minWidth: 482, maxWidth: 482 }}
                    />
                  </Tooltip>
                </Box>
              </MenuItem>
              <MenuItem sx={{ py: 0, mb: 1 }} />
            </MenuList>
          </Box>
        </Stack>
      </CustomPopover>
    </Box>
  )

  const renderFilterCheckAssignee = (
    <>
      <Button
        color="inherit"
        onClick={onOpenCheckAssigneeFilter}
        endIcon={
          <Iconify
            icon={openCheckAssigneeFilter ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            sx={{ ml: -0.5 }}
          />
        }
      >
        {!!filters.state.checkAssignee.id && !!filters.state.checkAssignee.name
          ? `Check Assignee: ${filters.state.checkAssignee.name}`
          : 'Select Check Assignee'}
      </Button>

      <ConfirmDialog
        open={openCheckAssigneeFilter}
        onClose={onCloseCheckAssigneeFilter}
        title="Select check assignee"
        content={
          <TextField
            select
            value={filters.state.checkAssignee.id || ''}
            onChange={handleFilterCheckAssignee}
            placeholder="Select check assignee"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: '100%' }}
          >
            {loadedUsers.filter((user) => isInstaller(user.userRole.name)).map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </TextField>
        }
        action={
          <Button
            variant="contained"
            onClick={() => {
              // onCloseCheckAssigneeFilter();
              filters.setState({ checkAssignee: { id: null, name: null } });
              localStorage.removeItem('measurementFilterCheckAssignee');
            }}
            color='warning'
          >
            Clear
          </Button>
        }
      />
    </>
  );

  const renderFilterDate = (isRenderCustom = false) => (
    <>
      <Button
        color="inherit"
        onClick={onOpenDateRange}
        startIcon={isRenderCustom ? <Iconify icon="eva:calendar-outline" /> : null}
        endIcon={
          <Iconify
            icon={!isRenderCustom ? openDateRange ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill' : null}
            sx={{ ml: -0.5 }}
          />
        }
      >
        {!!filters.state.startCheckDate && !!filters.state.endCheckDate
          ? fDateRangeShortLabel(filters.state.startCheckDate, filters.state.endCheckDate)
          : 'Select check date'}
      </Button>

      <CustomDateRangePicker
        variant="calendar"
        title="Select check date range"
        startDate={filters.state.startCheckDate}
        endDate={filters.state.endCheckDate}
        onChangeStartDate={handleFilterStartCheckDate}
        onChangeEndDate={handleFilterEndCheckDate}
        open={openDateRange}
        onClose={onCloseDateRange}
        selected={!!filters.state.startCheckDate && !!filters.state.endCheckDate}
        error={!filters.state.startCheckDate || !filters.state.endCheckDate}
      />
    </>
  );

  return (
    <Stack
      spacing={1}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      sx={{ width: 1, mb: 0 }}
    >
      {renderCustomFilters}
      <Stack spacing={1} direction="row" alignItems="center" justifyContent="flex-end" flexGrow={1}>
        {renderFilterCheckAssignee}
        {renderFilterDate()}
      </Stack>
    </Stack>
  );
}

