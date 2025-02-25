import React, { useMemo, useState, useContext, useCallback } from 'react';

import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import { Table, TableBody, TableContainer } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';

import { usePackagesQuery } from 'src/_mock/_package';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

export function ShipmentTableRow({ row, selected, onViewRow, onSelectRow, onDeleteRow }) {
  const router = useRouter();
  const { isMobile } = useContext(LoadingContext);
  const [idItemRow, setIdItemRow] = useState(null);

  const parseLineItems = (lineItems) => {
    if (typeof lineItems === 'string') {
      try {
        return JSON.parse(lineItems).filter(item => item.sku);
      } catch (err) {
        console.error('Error al parsear lineItems:', err);
        return [];
      }
    } else {
      return (lineItems || []).filter(item => item.sku);
    }
  }

  const parsePackages = (packages) => {
    if (typeof packages === 'string') {
      try {
        return JSON.parse(packages).filter(pkg => pkg.package_id);
      } catch (err) {
        console.error('Error al parsear packages:', err);
        return [];
      }
    } else {
      return (packages || []).filter(pkg => pkg.package_id);
    }
  }

  const confirm = useBoolean();
  const collapse = useBoolean();
  const collapseChild = useBoolean();
  const popover = usePopover();
  const popoverChild = usePopover();
  const popoverSubchild = usePopover();

  const packages = parsePackages(row.packages);

  const { data } = usePackagesQuery(null, null, packages.map(pkg => pkg.package_id));

  const dataRow = useMemo(() => packages, [packages]);

  const dataRowChild = useMemo(() => {
    if (data) {
      const items = data.map(pkg => ({
        package_id: pkg.packageId,
        items: parseLineItems(pkg.lineItems) || [],
      }));
      // console.log('dataRowChild:', items);
      return items;
    }
    return [];
  }, [data]);

  const handleSelectItemRow = useCallback((value) => {
    setIdItemRow(value);
  }, []);

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

  const renderPrimary = !isMobile ? (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={onSelectRow}
          inputProps={{ id: `row-checkbox-${row.id}`, 'aria-label': `Row checkbox` }}
        />
      </TableCell>

      <TableCell>
        <Link color="inherit" onClick={onViewRow} underline="always" sx={{ cursor: 'pointer' }}>
          {row.shipmentNumber}
        </Link>
      </TableCell>

      <TableCell>
        <ListItemText
          primary={fDate(row.date)}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (row.status === 'delivered' && 'success') ||
            (row.status === 'partially_shipped' && 'warning') ||
            'default'
          }
        >
          {row.status}
        </Label>
      </TableCell>

      <TableCell>
        <ListItemText
          primary={dataRow.length}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </TableCell>

      <TableCell>
        <ListItemText
          primary={parseInt(dataRow.reduce((acc, current) => {
            const quantity = Number(current.package_quantity) || 0;
            return acc + quantity;
          }, 0), 10)}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </TableCell>

      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        {dataRow.length > 0 ? (
          <IconButton
            color={collapse.value ? 'inherit' : 'default'}
            onClick={collapse.onToggle}
            sx={{ ...(collapse.value && { bgcolor: 'action.hover' }) }}
          >
            <Iconify icon={collapse.value ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
          </IconButton>
        ) : (
          <Label
            variant="soft"
            color="warning"
          >
            No Packages
          </Label>
        )}

        <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>
    </TableRow>
  ) : (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={onSelectRow}
          inputProps={{ id: `row-checkbox-${row.id}`, 'aria-label': `Row checkbox` }}
        />
      </TableCell>

      <TableCell>
        <Link color="inherit" onClick={onViewRow} underline="always" sx={{ cursor: 'pointer' }}>
          {row.shipmentNumber}
        </Link>
        <ListItemText
          primary={`Date: ${fDate(row.date)}`}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
        <Label
          variant="soft"
          color={
            (row.status === 'delivered' && 'success') ||
            (row.status === 'partially_shipped' && 'warning') ||
            'default'
          }
        >
          {row.status}
        </Label>
        <ListItemText
          secondary={
            <>
              {dataRow.length > 0 ? (
                <IconButton
                  color={collapse.value ? 'inherit' : 'default'}
                  onClick={collapse.onToggle}
                  sx={{ ...(collapse.value && { bgcolor: 'action.hover' }), fontSize: 'small' }}
                >
                  Details <Iconify icon={collapse.value ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                </IconButton>
              ) : (
                <Label
                  variant="soft"
                  color="warning"
                >
                  No Packages
                </Label>
              )}
            </>
          }
        />
      </TableCell>
      <TableCell>
        <ListItemText
          primary={dataRow.length}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </TableCell>

      <TableCell>
        <ListItemText
          primary={parseInt(dataRow.reduce((acc, current) => {
            const quantity = Number(current.package_quantity) || 0;
            return acc + quantity;
          }, 0), 10)}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </TableCell>
    </TableRow>
  );

  const renderSecondary = (
    <TableRow>
      <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
        <Collapse
          in={collapse.value}
          timeout="auto"
          unmountOnExit
          sx={{ bgcolor: 'background.neutral' }}
          key={`${row.id}-collapse`}
        >
          <Paper sx={{ m: 1.5, xs: 1 }} key='renderSecondary'>
            {dataRow.map((item, index) => (
              <React.Fragment key={`${item.package_id}-${index}`}>
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    p: (theme) => theme.spacing(1.5, 2, 1.5, 1.5),
                    '&:not(:last-of-type)': {
                      borderBottom: (theme) => `solid 2px ${theme.vars.palette.background.neutral}`,
                    },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={11}>
                      <ListItemText
                        sx={{ cursor: 'pointer' }}
                        primary={
                          <b>#: {item.package_number}</b>
                        }
                        secondary={
                          <>
                            Shipment: <b>{row.shipmentNumber}</b><br />
                            Pkg Qty: <b>{parseInt(item.package_quantity, 10)}</b>
                          </>
                        }
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{
                          component: 'span',
                          color: 'text.disabled',
                          mt: 0.5,
                          ml: 0.5,
                        }}
                        onClick={collapseChild.onToggle}
                      />
                      {isMobile && (
                        <ListItemText
                          secondary={
                            <IconButton
                                color={collapseChild.value ? 'inherit' : 'default'}
                                onClick={collapseChild.onToggle}
                                value={item.package_id}
                                sx={{ fontSize: 'small' }}
                              >
                                More Details <Iconify icon={collapseChild.value ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                              </IconButton>
                          }
                        />
                      )}
                    </Grid>
                    {!isMobile && (
                      <Grid item xs={1} textAlign="left">
                        <IconButton
                          color={collapseChild.value ? 'inherit' : 'default'}
                          onClick={collapseChild.onToggle}
                          value={item.package_id}
                        >
                          <Iconify icon={collapseChild.value ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                        </IconButton>
                      </Grid>
                    )}
                  </Grid>
                </Stack>

                <Collapse
                  in={collapseChild.value}
                  timeout="auto"
                  unmountOnExit
                  sx={{ bgcolor: 'background.neutral' }}
                >

                  <Paper sx={{ mt: 1, p: 2, bgcolor: '#F2F2F2' }} key='renderTerciary'>
                    <Grid container spacing={1} alignItems="center">
                      <TableContainer sx={{ bgcolor: 'background.paper' }}>
                        <Table>
                          <TableBody>
                            {dataRowChild?.filter(it => it.package_id === item.package_id).map((it, index2) => (
                              it.items.map((it2, index3) => (
                                !isMobile ? (
                                  <TableRow key={`${it.package_id}-${index2}-${it2.sku}-${index3}`}>
                                    <TableCell>SKU: <b>{it2.sku}</b></TableCell>
                                    <TableCell>Qty: <b>{it2.quantity}</b></TableCell>
                                    <TableCell>Pkg #: <b>{item.package_number}</b></TableCell>
                                    <TableCell>Shipment: <b>{row.shipmentNumber}</b></TableCell>
                                    <TableCell>
                                      <IconButton
                                        color={popoverChild.open ? 'inherit' : 'default'}
                                        onClick={(e) => {
                                          popoverChild.onOpen(e);
                                          handleSelectItemRow(it2.item_id)
                                        }}
                                      >
                                        <Iconify icon="eva:more-vertical-fill" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <TableRow key={`${it.package_id}-${index2}-${it2.sku}-${index3}`}>
                                    <TableCell>
                                      SKU: <b>{it2.sku}</b><br />
                                      Qty: <b>{it2.quantity}</b><br />
                                      Pkg #: <b>{item.package_number}</b><br />
                                      Shipment: <b>{row.shipmentNumber}</b>
                                    </TableCell>
                                    <TableCell>
                                      <IconButton
                                        color={popoverChild.open ? 'inherit' : 'default'}
                                        onClick={(e) => {
                                          popoverChild.onOpen(e);
                                          handleSelectItemRow(it2.item_id)
                                        }}
                                      >
                                        <Iconify icon="eva:more-vertical-fill" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                )
                              ))
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Paper>

                </Collapse>
              </React.Fragment>
            ))}
          </Paper>
        </Collapse>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {renderPrimary}
      {renderSecondary}
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            View Shipment
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Shipment
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <CustomPopover
        open={popoverChild.open}
        anchorEl={popoverChild.anchorEl}
        onClose={popoverChild.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popoverChild.onClose();
              handleViewItemRow(idItemRow);
            }}
          >
            <Iconify icon="solar:eye-bold" />
            View Item
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
