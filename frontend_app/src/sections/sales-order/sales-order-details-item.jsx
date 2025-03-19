import React, { useMemo, useState, useEffect, useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import { Grid, Table, TableRow, TableBody, TableCell, TableHead, TableContainer, TextareaAutosize } from '@mui/material';

import { Label } from 'src/components/label';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function SalesOrderDetailsItems({ salesOrder, setSalesOrder, setUpdating, isMobile }) {
  const { setLoading, setError, setComponent } = useContext(LoadingContext);
  const [currentSalesOrder, setCurrentSalesOrder] = useState(null);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);


  useEffect(() => {
    if (salesOrder) setCurrentSalesOrder(salesOrder);

  }, [salesOrder]);


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
        {/* {salesOrder && salesOrder?.salesorder_id && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>ID: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {salesOrder?.salesorder_id || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )} */}
        {salesOrder && salesOrder?.customer_name && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Customer: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default">{salesOrder.customer_name || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {salesOrder && salesOrder?.customer && (
          <>
            <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Customer Email: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default">{salesOrder?.customer?.email || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Customer Phone: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default">{salesOrder?.customer?.phone || salesOrder?.customer?.mobile || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
        {salesOrder && salesOrder?.salesperson_name && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Sales Person: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default">{salesOrder.salesperson_name || '-'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {salesOrder && salesOrder?.total && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Total Amount: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> $ {parseFloat(salesOrder.total).toFixed(2) || '0.00'} </Label>
                </Box>
              </Grid>
            </Grid>
        )}
        {salesOrder && salesOrder?.line_items && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Items: </Box>
              </Grid>
              <Grid item xs={9}>
                <TableContainer sx={{ maxHeight: '330px' }}>
                  <Table stickyHeader>
                    <TableHead>
                      {!isMobile ? (
                        <TableRow sx={{ p: 0 }}>
                          <TableCell>Item</TableCell>
                          <TableCell>Qty</TableCell>
                        </TableRow>
                      ) : (
                        <TableRow sx={{ p: 0 }}>
                          <TableCell>INFO</TableCell>
                        </TableRow>
                      )}
                    </TableHead>
                    <TableBody>
                      {salesOrder?.line_items.map((asset, index) => (
                          !isMobile ? (
                            <TableRow key={`${asset.line_item_id}-${index}-${asset.item_id}`}>
                              <TableCell>
                                {asset.description || asset.name || asset.group_name}
                              </TableCell>
                              <TableCell>
                                {asset.quantity}
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow key={`${asset.line_item_id}-${index}-${asset.item_id}`}>
                              <TableCell>
                                <TextareaAutosize
                                  aria-label="minimum height"
                                  minRows={3}
                                  placeholder="Minimum 3 rows"
                                  value={
                                    `Item: ${asset.description || asset.name || asset.group_name}
                                    Qty: ${asset.quantity}`
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
        title="Sales Order Details"
      />
      {renderTotal}
    </Card>
  );
}
