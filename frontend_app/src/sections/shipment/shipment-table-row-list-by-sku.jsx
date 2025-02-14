import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { LoadingContext } from 'src/auth/context/loading-context';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { usePackagesQuery } from 'src/_mock/_package';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid';
import { useBoolean } from 'src/hooks/use-boolean';
import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Table, TableBody, TableContainer, TableHead, Typography } from '@mui/material';

export function ShipmentTableRowListBySku({ row, selected, onViewRow, onSelectRow, onDeleteRow }) {
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
      localStorage.removeItem('routeByShipment');
      localStorage.setItem('routeByShipmentBySku', id);
      router.push(paths.dashboard.item.details(id));
    },
    [router]
  );

  const handleViewShipment = useCallback(
    (id) => {
      localStorage.setItem('routeShipmentByLiveMonitor', id);
      router.push(paths.dashboard.shipment.details(id));
    },
    [router]
  );

  const renderPrimary = !isMobile ? (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={onSelectRow}
          inputProps={{ id: `row-checkbox-${row.itemId}`, 'aria-label': `Row checkbox` }}
        />
      </TableCell>

      <TableCell>
        <Link color="inherit" onClick={onViewRow} underline="always" sx={{ cursor: 'pointer' }}>
          {row.sku}
        </Link>
      </TableCell>

      <TableCell>
        <ListItemText
          primary={fDate(row.date)}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </TableCell>

      <TableCell>
        <ListItemText
          primary={row.itemTotalQty}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </TableCell>

      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        {row.linePackages?.length > 0 ? (
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
            No Data
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
          inputProps={{ id: `row-checkbox-${row.itemId}`, 'aria-label': `Row checkbox` }}
        />
      </TableCell>
      <TableCell>
        <Link color="inherit" onClick={onViewRow} underline="always" sx={{ cursor: 'pointer' }}>
          {row.sku}
        </Link>
        <ListItemText
          primary={`Date: ${fDate(row.date)}`}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
        <ListItemText
          primary={`Qty: ${row.itemTotalQty}`}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
        <ListItemText
          secondary={
            <>
              {row.linePackages?.length > 0 ? (
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
                  No Data
                </Label>
              )}
            </>
          }
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
          <Paper sx={{ m: 1.5 }} key='renderSecondary'>
            {row.linePackages?.map((item, index) => (
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
                        secondary={
                          <>
                            <Grid container spacing={1}>
                              <Grid item xs={!isMobile ? 3 : 7.9}>
                                # Shipment: <strong> </strong>
                                <Link color="inherit" onClick={() => handleViewShipment(item.shipmentId)} underline="always" sx={{ cursor: 'pointer' }}>
                                  <strong>{item.shipmentNumber}</strong>
                                </Link>
                              </Grid>
                              <Grid item xs={!isMobile ? 3 : 3.1}>
                                <Typography variant="body2">
                                  # Pkg: <strong>{item.packageNumber}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={!isMobile ? 2 : 1}>
                                <Typography variant="body2">
                                  PkgQty: <strong>{parseInt(item.quantity, 10)}</strong>
                                </Typography>
                              </Grid>
                            </Grid>
                          </>
                        }
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{
                          component: 'span',
                          color: 'text.disabled',
                          mt: 0.5,
                          ml: 0.5,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
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
            View Item
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Item
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
