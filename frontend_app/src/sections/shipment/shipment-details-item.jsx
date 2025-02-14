import React, { useEffect, useState, useCallback } from 'react';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import { Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

export function ShipmentDetailsItems({ shipment }) {

  const router = useRouter();

  const parseLineItems = (lineItems) => {
    if (typeof lineItems === 'string') {
      try {
        return JSON.parse(lineItems).filter(item => item.item_id);
      } catch (error) {
        console.error('Error al parsear lineItems:', error);
        return [];
      }
    } else {
      return (lineItems || []).filter(item => item.item_id);
    }
  }

  const parsePackages = (packages) => {
    if (typeof packages === 'string') {
      try {
        return JSON.parse(packages).filter(item => item.package_id);
      } catch (error) {
        console.error('Error al parsear lineItems:', error);
        return [];
      }
    } else {
      return (packages || []).filter(item => item.package_id);
    }
  }

  const [lineItems, setLineItems] = useState(null);

  const [packages, setPackages] = useState(null);


  useEffect(() => {
    const items = shipment.lineItems;
    setLineItems(parseLineItems(items));
  }, [shipment.lineItems]);

  useEffect(() => {
    const pckgs = shipment.packages;
    setPackages(parsePackages(pckgs));
  }, [shipment.packages]);


  const handleViewItemRow = useCallback(
    (id) => {
      localStorage.removeItem('routeByAnalytics');
      localStorage.removeItem('routeByOrder');
      localStorage.removeItem('routeByShipmentBySku');
      localStorage.setItem('routeByShipment', id);
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
                <TableCell>Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems && lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
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

const renderPackages =
<Stack direction="row" alignItems="center" justifyContent="space-between">
  <Stack direction="row" alignItems="center" spacing={2}>
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Pkg Number</TableCell>
            <TableCell>Quantity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {packages && packages.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.package_number}</TableCell>
              <TableCell>{item.package_quantity}</TableCell>
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
        {shipment.shipmentId && (
          <>
            <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>ID: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {shipment.shipmentId || '-'} </Label>
                </Box>
              </Grid>

            </Grid>
          </>
        )}
        {shipment.shipmentNumber && (
          <>
            <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Number: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {shipment.shipmentNumber || '-'} </Label>
                </Box>
              </Grid>

            </Grid>
          </>
        )}
        {shipment.customerName && (
          <>
            <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Customer: </Box>
              </Grid>
              <Grid item xs={9}>
                <Box sx={{ typography: 'subtitle2' }}>
                  <Label color="default"> {shipment.customerName || '-'} </Label>
                </Box>
              </Grid>

            </Grid>
          </>
        )}
        {shipment.total && (
          <>
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
                        <Label color="default"> {parseFloat(shipment.subTotal).toFixed(2) || '-'} </Label>
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ color: 'text.secondary' }}>Total: </Box>
                    </Grid>
                    <Grid item xs={1}>
                      <Box alignItems="flex-end" sx={{ p: 0, textAlign: 'right', typography: 'body2' }}>
                        <Label color="default"> {parseFloat(shipment.total).toFixed(2) || '-'} </Label>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

            </Grid>
          </>
        )}
        {lineItems && lineItems.length > 0 && (
          <>
            <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Items (Products): </Box>
              </Grid>
              <Grid item xs={9}>
                {renderItems}
              </Grid>

            </Grid>
          </>
        )}
        {packages && packages.length > 0 && (
          <>
            <Grid container item xs={12}>
              <Grid item xs={3}>
                <Box sx={{ color: 'text.secondary' }}>Packages: </Box>
              </Grid>
              <Grid item xs={9}>
                {renderPackages}
              </Grid>

            </Grid>
          </>
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
