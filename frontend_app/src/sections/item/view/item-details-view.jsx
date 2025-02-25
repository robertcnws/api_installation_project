import { useState, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LinearProgress } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ItemDetailsInfo } from '../item-details-info';
import { ItemDetailsItems } from '../item-details-item';
import { ItemDetailsToolbar } from '../item-details-toolbar';



// ----------------------------------------------------------------------

export function ItemDetailsView({ item, senitronItem, setItem, setSenitronItem }) {

  const { isMobile } = useContext(LoadingContext);

  const [status, setStatus] = useState(item?.status);

  const [updating, setUpdating] = useState(false);

  const handleChangeStatus = useCallback((newValue) => {
    setStatus(newValue);
  }, []);

  if (updating) {
    return (
      <DashboardContent>
        <Box
          sx={{
            width: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            margin: 'auto'
          }}
        >
          <LinearProgress
            key="error"
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'black',
              },
              backgroundColor: '#e0e0e0',
            }}
          />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <ItemDetailsToolbar
        item={item}
        senitronItem={senitronItem}
        backLink={
          localStorage.getItem('routeByOrder') ? paths.dashboard.order.root :
            (localStorage.getItem('routeByAnalytics') ? paths.dashboard.general.analytics : paths.dashboard.item.root)
        }
        status={status}
        isMobile={isMobile}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <ItemDetailsItems
              item={item}
              senitronItem={senitronItem}
              setItem={setItem}
              setSenitronItem={setSenitronItem}
              setUpdating={setUpdating}
              isMobile={isMobile}
            />
            {/* <ItemDetailsSenitronItems item={senitronItem} /> */}

            {/* <ItemDetailsHistory history={item?.history} /> */}
          </Stack>
        </Grid>

        <Grid xs={12} md={4}>
          <ItemDetailsInfo
            item={item}
            senitronItem={senitronItem}
            setItem={setItem}
            setSenitronItem={setSenitronItem}
            isMobile={isMobile}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
