import { useCallback, useEffect, useContext, useMemo } from 'react';

import dayjs from 'dayjs';
import axios from 'axios';

import Stack from '@mui/material/Stack';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';
import { CONFIG } from 'src/config-global';


// ----------------------------------------------------------------------

export function OrderTableToolbar({ filters, onResetPage, dateError }) {
  const popover = usePopover();
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { setLoading, setError, setComponent } = useContext(LoadingContext);
  

  useEffect(() => {
    setComponent('sales orders');
  }, [setComponent]);

  useEffect(() => {
    if (localStorage.getItem('startDate')) filters.setState({ startDate: dayjs(localStorage.getItem('startDate')) });
    if (localStorage.getItem('endDate')) filters.setState({ endDate: dayjs(localStorage.getItem('endDate')) });
    const today = dayjs();
    if (!filters.state.startDate && !filters.state.endDate) {
      filters.setState({
        startDate: today.subtract(7, 'day'),
        endDate: today,
      });
    }
  }, [filters]);

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ salesorderNumber: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleFilterStartDate = useCallback(
    (newValue) => {
      onResetPage();
      const isoString = newValue.toISOString();
      localStorage.setItem('startDate', isoString);
      filters.setState({ startDate: dayjs(isoString) });
    },
    [filters, onResetPage]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      onResetPage();
      const isoString = newValue.toISOString();
      localStorage.setItem('endDate', isoString);
      filters.setState({ endDate: dayjs(isoString) });
    },
    [filters, onResetPage]
  );

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
      >
        <DatePicker
          label="Start date"
          value={filters.state.startDate}
          onChange={handleFilterStartDate}
          slotProps={{ textField: { fullWidth: true } }}
          sx={{ maxWidth: { md: 200 } }}
          format='YYYY-MM-DD'
        />

        <DatePicker
          label="End date"
          value={filters.state.endDate}
          onChange={handleFilterEndDate}
          slotProps={{
            textField: {
              fullWidth: true,
              error: dateError,
              helperText: dateError ? 'End date must be later than start date' : null,
            },
          }}
          sx={{
            maxWidth: { md: 200 },
            [`& .${formHelperTextClasses.root}`]: {
              position: { md: 'absolute' },
              bottom: { md: -40 },
            },
          }}
          format='YYYY-MM-DD'
        />

        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={filters.state.salesorderNumber}
            onChange={handleFilterName}
            placeholder="Search sales order (NUMBER, ID, item NAME, item SKU or item ID)..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:import-bold" />
            Import
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:export-bold" />
            Export
          </MenuItem>
          <MenuItem
            onClick={() => {
              popover.onClose();
              setLoading(true);
              axios
                .post(`${CONFIG.apiUrl}/api_zoho/load/inventory_sales_orders/`, {
                  start_date: filters.state.startDate.format('YYYY-MM-DD'),
                  end_date: filters.state.endDate.format('YYYY-MM-DD'),
                  username: userLogged?.data.username,
                })
                .then(() => {
                  console.log('Inventory sales orders fetched');
                })
                .catch((err) => {
                  console.error('Error fetching inventory sales orders:', err);
                  setError('There was an error fetching the inventory sales orders.');
                })
                .finally(() => {
                  setLoading(false);
                });
            }}
          >
            <Iconify icon="mdi:update" />
            Fetch Updates from Zoho
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
