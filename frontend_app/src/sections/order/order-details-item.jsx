import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import { Grid, Table, TableRow, TableBody, TableCell, TableHead, IconButton, TableContainer } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

export function OrderDetailsItems({ order }) {

  const router = useRouter();

  const parseLineItems = (lineItems) => {
    if (typeof lineItems === 'string') {
      try {
        return JSON.parse(lineItems).filter(item => item.sku);
      } catch (error) {
        console.error('Error al parsear lineItems:', error);
        return [];
      }
    } else {
      return (lineItems || []).filter(item => item.sku);
    }
  }

  const [lineItems, setLineItems] = useState(null);


  useEffect(() => {
    const items = order.lineItems;
    setLineItems(parseLineItems(items));
  }, [order.lineItems]);


  const handleViewItemRow = useCallback(
    (id) => {
      localStorage.removeItem('routeByAnalytics');
      localStorage.removeItem('routeByShipment');
      localStorage.removeItem('routeByShipmentBySku');
      localStorage.setItem('routeByOrder', id);
      router.push(paths.dashboard.item.details(id));
    },
    [router]
  );


  const renderItems =
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems && lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity_shipped}</TableCell>
                  <TableCell>
                    <IconButton
                      color='default'
                      onClick={() => handleViewItemRow(item.item_id)}
                      value={item.item_id}
                    >
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>


  const renderTotal = (
    <Stack spacing={2} alignItems="flex-start" sx={{ p: 3, textAlign: 'left', typography: 'body2' }}>
      <Grid container spacing={2}>
        {order.salesorderId && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>ID: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {order.salesorderId || '-'} </Label>
                </Box>
              </Grid>

            </Grid>
        )}
        {order.customerName && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Customer: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {order.customerName || '-'} </Label>
                </Box>
              </Grid>

            </Grid>
        )}
        {order.totalQuantity && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Total Quantity: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {order.totalQuantity || '-'} </Label>
                </Box>
              </Grid>

            </Grid>
        )}
        {order.total && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Totals: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ color: 'text.secondary' }}>Subtotal: </Box>
                    </Grid>
                    <Grid item xs={1}>
                      <Box alignItems="flex-end" sx={{ p: 0, textAlign: 'right', typography: 'body2' }}>
                        <Label color="default"> {parseFloat(order.subTotal).toFixed(2) || '-'} </Label>
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ color: 'text.secondary' }}>Tax Total: </Box>
                    </Grid>
                    <Grid item xs={1}>
                      <Box alignItems="flex-end" sx={{ p: 0, textAlign: 'right', typography: 'body2' }}>
                        <Label color="default"> {parseFloat(order.taxTotal).toFixed(2) || '-'} </Label>
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ color: 'text.secondary' }}>Total: </Box>
                    </Grid>
                    <Grid item xs={1}>
                      <Box alignItems="flex-end" sx={{ p: 0, textAlign: 'right', typography: 'body2' }}>
                        <Label color="default"> {parseFloat(order.total).toFixed(2) || '-'} </Label>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

            </Grid>
        )}
        {lineItems && lineItems.length > 0 && (
          <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Items (Products): </Box>
              </Grid>
              <Grid item xs={9}>
                {renderItems}
              </Grid>

            </Grid>
        )}
      </Grid>
    </Stack>
  );


  return (
    <Card>
      <CardHeader
        title="Details"
      // action={
      //   <IconButton>
      //     <Iconify icon="solar:pen-bold" />
      //   </IconButton>
      // }
      />

      {renderTotal}
    </Card>
  );
}
