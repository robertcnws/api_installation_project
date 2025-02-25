import axios from 'axios';
import React, { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import { Grid, Table, Tooltip, TableBody, TableContainer } from '@mui/material';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { TableNoData } from 'src/components/table';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function ItemDetailsSenitronItems({ item }) {

  const { setLoading, setError, setComponent } = useContext(LoadingContext);
  const [currentItem, setCurrentItem] = useState(item);
  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/${CONFIG.apiDomain}/ws/senitron_inventory_items_assets/`);
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
        setCurrentItem((prevItem) => {
          if (message.item.itemNumber === prevItem.itemNumber) {
            return message.item;
          }
          return prevItem;
        });
      }
    };
    return () => {
      socket.close();
    };
  }, []);



  const renderTotal = (
    <Stack spacing={1} alignItems="flex-start" sx={{ p: 3, textAlign: 'left', typography: 'body2' }}>
      <Grid container spacing={2}>
        {currentItem?.itemNumber && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Item Number: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {currentItem?.itemNumber || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentItem?.handheldReader && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Hand Held Reader: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {currentItem?.handheldReader || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentItem?.senitronItem?.tagsCount && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Tags Count: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default">{parseInt(currentItem?.senitronItem?.tagsCount, 10) || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentItem?.senitronItem?.qty && (
          <Grid container item xs={12}>
            <Grid item xs={3}>
              <Box sx={{ color: 'text.secondary' }}>Quantity: </Box>
            </Grid>
            <Grid item xs={9}>
              <Box sx={{ typography: 'subtitle2' }}>
                <Label color="default"> {parseInt(currentItem?.senitronItem?.qty, 10) || '-'} </Label>
              </Box>
            </Grid>
          </Grid>
        )}
        {currentItem?.text3 && (
          <Grid container item xs={12}>
            <Grid item xs={3}>
              <Box sx={{ color: 'text.secondary' }}>Info: </Box>
            </Grid>
            <Grid item xs={9}>
              <Box sx={{ typography: 'subtitle2' }}>
                <Label color="default"> {currentItem?.text3 || '-'} </Label>
              </Box>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Stack >
  );

  return (
    <Card>
      <CardHeader
        title="Details from Senitron"
        action={currentItem &&
          <Tooltip
            title="Update from Senitron"
            arrow
            sx={{
              '& .MuiTooltip-tooltip': {
                backgroundColor: '#000000',
                color: 'white',
                fontSize: '0.875rem',
              },
            }}
          >
            <IconButton
              onClick={() =>  {
                setComponent(`senitron inventory item (ID: ${currentItem.itemNumber}) details`);
                setLoading(true);
                axios
                  .post(`${CONFIG.apiUrl}/api_senitron/load/senitron_inventory_items/`, {
                    username: userLogged?.data.username,
                  })
                  .then(() => {
                    axios
                      .post(`${CONFIG.apiUrl}/api_senitron/load/senitron_inventory_item_assets/`, {
                        username: userLogged?.data.username,
                      })
                      .then(() => {
                        console.log('Senitron Inventory items fetched');
                      })
                      .catch((err) => {
                        console.error('Error fetching senitron inventory items assets:', err);
                        setError('There was an error fetching senitron inventory items assets.');
                      })
                      .finally(() => {
                        setLoading(false);
                      });
                  })
                  .catch((err) => {
                    console.error('Error fetching senitron inventory items:', err);
                    setError('There was an error fetching senitron inventory items.');
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
            >
              <Iconify icon="mdi:update" />
            </IconButton>
          </Tooltip>
        }
      />
      {item ? renderTotal :
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table size='medium' sx={{ minWidth: 960 }} stickyHeader>
            <TableBody>
              <TableNoData notFound={!item} />
            </TableBody>
          </Table>
        </TableContainer>
      }
    </Card>
  );
}
