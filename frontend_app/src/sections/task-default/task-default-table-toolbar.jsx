import { useCallback, useContext, useEffect, useMemo } from 'react';

import Stack from '@mui/material/Stack';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { CONFIG } from 'src/config-global';
import axios from 'axios';
import { LoadingContext } from 'src/auth/context/loading-context';
import { Checkbox, FormControl, InputLabel, ListItemText, OutlinedInput, Select } from '@mui/material';
import { generatePrintablePDF } from 'src/utils/printable-pdf';
import ExportCSV from 'src/utils/export-csv';
import { Label } from 'src/components/label';
import { fDate } from 'src/utils/format-time';
import { height } from '@mui/system';

// ----------------------------------------------------------------------

export function TaskDefaultTableToolbar({ filters, onResetPage, options, dataFiltered, headersCSV, setUpdating, isListAll = true, title, setTitleLinearProgress }) {
  const popover = usePopover();
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { setLoading, setError, setComponent } = useContext(LoadingContext);

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
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

        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
            <TextField
              fullWidth
              value={filters.state.name}
              onChange={handleFilterName}
              placeholder="Search by task (NAME, DESCRIPTION, LINKED STATUS)..."
              // disabled={dataFiltered?.length === 0}
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
              // generatePrintablePDF({ data: dataFiltered, title });
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
