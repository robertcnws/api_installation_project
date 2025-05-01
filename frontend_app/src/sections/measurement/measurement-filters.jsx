import { useMemo, useState, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { Tooltip, MenuItem, MenuList, IconButton, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

export function MeasurementFilters({
  filters,
  onResetPage,
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext)

  const popoverCustom = usePopover();

  const [isCustomOpen, setIsCustomOpen] = useState(false);


  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleResetType = useCallback(() => {
    popoverCustom.onClose();
    filters.setState({ type: [] });
  }, [filters, popoverCustom]);

  const renderFilterName = (
    <TextField
      value={filters.state.name}
      onChange={handleFilterName}
      placeholder="Search service(s) by NAME, NUMBER, CUSTOMER..."
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
          </InputAdornment>
        ),
      }}
      sx={{ width: { xs: 1, md: '100%' } }}
    />
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
        }}
      >
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 'fontWeightBold' }} >
          Measurements
        </Typography>
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
        slotProps={{ paper: { sx: { p: 0, width: 302, ml: !isMobile ? -5 : 0 } } }}
        sx={{ maxHeight: 800, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <Stack spacing={0} sx={{ py: -1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: 500, p: 0 }}>
            <MenuList sx={{ p: 0 }}>
              <MenuItem sx={{ p: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0, mt: 1, ml: 1 }}>
                  <Tooltip title="Search measurement(s) by CUSTOMER, PROJECT, SERVICE OR SALES ORDER...">
                    <TextField
                      value={filters.state.name}
                      onChange={handleFilterName}
                      placeholder="Search measurement(s) by CUSTOMER, PROJECT, SERVICE OR SALES ORDER..."
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
                      sx={{ width: '100%' }}
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

  return (
    <Stack
      spacing={1}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      sx={{ width: 1, mb: 0 }}
    >
      {renderCustomFilters}
      {/* {renderFilterName} */}
    </Stack>
  );
}

