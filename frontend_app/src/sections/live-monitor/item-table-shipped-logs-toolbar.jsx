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
import ExportCSV from 'src/utils/export-csv';
import { fDate } from 'src/utils/format-time';
import { generateItemShipmentLogsPrintablePDF, generatePrintablePDF } from 'src/utils/printable-pdf';


// ----------------------------------------------------------------------

export function ItemTableShippedLogsToolbar({ 
  filters, 
  onResetPage, 
  options, 
  dataFiltered, 
  headersCSV, 
  setUpdating, 
  isListAll = true, 
  globalDateFilters,
  title, 
  setTitleLinearProgress 
}) {
  const popover = usePopover();

  const { setLoading, setError, setComponent } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);


  useEffect(() => {
    setComponent('sales orders');
  }, [setComponent]);

  useEffect(() => {
    if (localStorage.getItem('startDate')) filters.setState({ startDate: dayjs(localStorage.getItem('startDate')) });
    if (localStorage.getItem('endDate')) filters.setState({ endDate: dayjs(localStorage.getItem('endDate')) });
    const today = dayjs();
    if (!filters.state.startDate && !filters.state.endDate) {
      filters.setState({
        startDate: today.subtract(1, 'day'),
        endDate: today,
      });
      globalDateFilters.setState({
        startDate: today.subtract(1, 'day'),
        endDate: today,
      });
    }
  }, [filters, globalDateFilters]);

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      onResetPage();
      const isoString = newValue.toISOString();
      localStorage.setItem('endDate', isoString);
      filters.setState({ endDate: dayjs(isoString) });
      localStorage.setItem('startDate', dayjs(isoString).subtract(1, 'day').toISOString());
      filters.setState({ startDate: dayjs(isoString).subtract(1, 'day') });
      globalDateFilters.setState({
        startDate: dayjs(isoString).subtract(1, 'day'),
        endDate: dayjs(isoString),
      });
    },
    [filters, globalDateFilters, onResetPage]
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
          label="Date"
          value={filters.state.endDate}
          onChange={handleFilterEndDate}
          slotProps={{
            textField: {
              fullWidth: true,
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
            value={filters.state.name}
            onChange={handleFilterName}
            placeholder={isListAll ? "Search by item (NAME, SKU, ID or STOCK ON HAND)..." : "Search by item SKU..."}
            // disabled={dataFiltered?.length === 0}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          {/* )} */}

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
              generateItemShipmentLogsPrintablePDF({ 
                data: dataFiltered, 
                title: filters.state.status === 'all' ? 'All Shipped Items' : 
                filters.state.status === 'lost' ? 'Lost Shipped Items' : 
                filters.state.status === 'not_matched' ? 'Shipped Items to Reconcile' : 'Matched Shipped Items' });
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>
          {!isListAll && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                setUpdating(true);
                setTitleLinearProgress('Fetching updates shipments from Zoho...');
                const date = fDate(filters.state.endDate, 'YYYY-MM-DD');
                axios
                  .post(`${CONFIG.apiUrl}/api_zoho/load/inventory_shipments/`, {
                    start_date: date,
                    username: userLogged?.data.username,
                  })
                  .then(() => {
                    console.log('Inventory shipments and packages fetched');
                  })
                  .catch((err) => {
                    console.error('Error fetching inventory shipments and packages:', err);
                    setError('There was an error fetching the inventory shipments and packages.');
                  })
                  .finally(() => {
                    // setLoading(false);
                    setUpdating(false);
                  });
              }}
            >
              <Iconify icon="mdi:update" />
              {`Fetch Updates from Zoho (${fDate(filters.state.endDate, 'YYYY-MM-DD')})`}
            </MenuItem>
          )}
          {isListAll && (
            <>
              <MenuItem
                onClick={() => {
                  popover.onClose();
                }}
              >
                {/* <Iconify icon="solar:export-bold" />
            Export CSV */}
                <ExportCSV data={dataFiltered} headers={headersCSV} buttonText="Export CSV" docName={title} />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  popover.onClose();
                  setUpdating(true);
                  setTitleLinearProgress('Fetching Item Updates from Zoho...');
                  axios
                    .post(`${CONFIG.apiUrl}/api_zoho/load/inventory_items/`, {
                      username: userLogged?.data.username,
                    })
                    .then(() => {
                      console.log('Inventory items fetched');
                    })
                    .catch((err) => {
                      console.error('Error fetching inventory items:', err);
                      setError('There was an error fetching the inventory items.');
                    })
                    .finally(() => {
                      setUpdating(false);
                    });
                }}
              >
                <Iconify icon="mdi:update" />
                Fetch Updates from Zoho
              </MenuItem>
              <MenuItem
                onClick={() => {
                  popover.onClose();
                  setUpdating(true);
                  setTitleLinearProgress('Fetching Item Updates from Senitron...');
                  axios
                    .post(`${CONFIG.apiUrl}/api_senitron/load/senitron_inventory_item_assets/`, {
                      username: userLogged?.data.username,
                    })
                    .then(() => {
                      console.log('Zoho Inventory items fetched');
                      console.log('Senitron Inventory items fetched');
                    })
                    .catch((err) => {
                      console.error('Error fetching senitron inventory items assets:', err);
                      setError('There was an error fetching senitron inventory items assets.');
                    })
                    .finally(() => {
                      // setLoading(false);
                      setUpdating(false);
                    });
                }}
              >
                <Iconify icon="mdi:sync" />
                Sync with Senitron
              </MenuItem>
            </>
          )}
        </MenuList>
      </CustomPopover>
    </>
  );
}
