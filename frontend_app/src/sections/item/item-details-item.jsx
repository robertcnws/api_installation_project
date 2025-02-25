import axios from 'axios';
import React, { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import { Grid, Table, Tooltip, TableRow, TableBody, TableCell, TableHead, TableContainer, TextareaAutosize } from '@mui/material';

import { fDateTime } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function ItemDetailsItems({ item, senitronItem, setItem, setSenitronItem, setUpdating, isMobile }) {
  const { setLoading, setError, setComponent } = useContext(LoadingContext);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentSenitronItem, setCurrentSenitronItem] = useState(null);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);


  useEffect(() => {
    if (item) setCurrentItem(item);
    if (senitronItem) setCurrentSenitronItem(senitronItem);

  }, [item, senitronItem]);


  // useEffect(() => {
  //   const socket = new WebSocket(`wss://${CONFIG.apiHost}/${CONFIG.apiDomain}/ws/senitron_inventory_items_assets/`);
  //   socket.onmessage = (event) => {
  //     const message = JSON.parse(event.data);
  //     if (message.type === 'created' || message.type === 'updated') {
  //       setCurrentSenitronItem((prevItem) => {
  //         if (message.item.itemNumber === prevItem?.itemNumber) {
  //           return message.item;
  //         }
  //         return prevItem;
  //       });
  //     }
  //   };
  //   return () => {
  //     socket.close();
  //   };
  // }, []);


  const renderTotal = (
    <Stack spacing={1} alignItems="flex-start" sx={{ p: 3, textAlign: 'left', typography: 'body2' }}>
      <Grid container spacing={2}>
        {currentItem && currentItem?.itemId && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>ID: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {currentItem?.itemId || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentItem && currentItem?.name && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Name: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default">{currentItem.name || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentItem && currentItem?.rate && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Rate: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> $ {parseFloat(currentItem.rate).toFixed(2) || '0.00'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentItem && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>On Hand: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default">{parseInt(currentItem?.stockOnHand, 10) || '0'}</Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentSenitronItem && currentSenitronItem?.count && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>RFID Count: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {parseInt(currentSenitronItem?.count, 10) || '0'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentItem && currentSenitronItem && currentItem?.stockOnHand && currentSenitronItem?.count && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Difference: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color={
                    (parseInt(currentSenitronItem?.count, 10) - parseInt(currentItem?.stockOnHand, 10) === 0 ? 'success' :
                      (parseInt(currentSenitronItem?.count, 10) - parseInt(currentItem?.stockOnHand, 10) > 0 ? 'warning' : 'error'))
                  }>
                    {(parseInt(currentSenitronItem?.count, 10) - parseInt(currentItem?.stockOnHand, 10)) || '0'}
                  </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {currentSenitronItem && currentSenitronItem?.assets && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Info Assets: </Box>
              </Grid>
              <Grid item xs={9}>
                <TableContainer sx={{ height: '400px' }}>
                  <Table stickyHeader>
                    <TableHead>
                      {!isMobile ? (
                        <TableRow sx={{ p: 0 }}>
                          <TableCell>Antenna</TableCell>
                          <TableCell>Serial</TableCell>
                          <TableCell>Last Zone</TableCell>
                          <TableCell>Info</TableCell>
                          <TableCell>Last Seen</TableCell>
                        </TableRow>
                      ) : (
                        <TableRow sx={{ p: 0 }}>
                          <TableCell>INFO</TableCell>
                        </TableRow>
                      )}
                    </TableHead>
                    <TableBody>
                      {currentSenitronItem?.assets.filter((asset) => asset.lastSeenAntenna && asset.lastZone && asset.text3)
                        .map((asset, index) => (
                          !isMobile ? (
                            <TableRow key={`${asset.id}-${index}-${asset.serialNumber}`}>
                              <TableCell>
                                {asset.lastSeenAntenna}
                              </TableCell>
                              <TableCell>
                                {asset.serialNumber}
                              </TableCell>
                              <TableCell>
                                {asset.lastZone}
                              </TableCell>
                              <TableCell>
                                {asset.text3}
                              </TableCell>
                              <TableCell>
                                {asset.lastSeen ? fDateTime(asset.lastSeen) : `Updated:  ${fDateTime(asset.updatedAt)}`}
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow key={`${asset.id}-${index}-${asset.serialNumber}`}>
                              <TableCell>
                                <TextareaAutosize
                                  aria-label="minimum height"
                                  minRows={3}
                                  placeholder="Minimum 3 rows"
                                  value={
                                    `Antenna: ${asset.lastSeenAntenna}
                                    Serial: ${asset.serialNumber}
                                    Last Zone: ${asset.lastZone}
                                    Description: ${asset.text3}
                                    Last Seen: ${asset.lastSeen ? fDateTime(asset.lastSeen) : `Updated:  ${fDateTime(asset.updatedAt)}`}`
                                  }
                                  style={{ width: '100%', fontSize: '0.75rem' }}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
        )}
      </Grid>
    </Stack>
  );

  return (
    <Card>
      <CardHeader
        title="Item Details"
        action={
          <Tooltip
            title="Update from APIs"
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
              onClick={() => {
                const payload = {
                  item_number: currentItem?.itemId,
                  username: userLogged?.data.username,
                };
                // setComponent(`inventory item (SKU: ${currentItem?.sku}, ID: ${currentItem?.itemId}) details`);
                // setLoading(true);
                setUpdating(true);
                axios
                  .post(`${CONFIG.apiUrl}/api_zoho/load/inventory_items/`, payload)
                  .then(() => {
                    axios
                      .post(`${CONFIG.apiUrl}/api_senitron/load/senitron_inventory_item_assets/`, payload)
                      .then(() => {
                        setSenitronItem(currentSenitronItem);
                        console.log('Zoho Inventory item fetched');
                        console.log('Senitron Inventory item fetched');
                      })
                      .catch((err) => {
                        console.error('Error fetching senitron inventory item asset:', err);
                        setError('There was an error fetching senitron inventory item asset.');
                      })
                      .finally(() => {
                        // setLoading(false);
                        setUpdating(false);
                      });
                  })
                  .catch((err) => {
                    console.error('Error fetching inventory item:', err);
                    setError('There was an error fetching the inventory item.');
                  })
              }}
            >
              <Iconify icon="mdi:update" />
            </IconButton>
          </Tooltip>
        }
      />
      {renderTotal}
    </Card>
  );
}
