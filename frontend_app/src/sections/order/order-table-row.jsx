import React, { useEffect, useState, useContext, useCallback } from 'react';
import { LoadingContext } from 'src/auth/context/loading-context';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
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
import { Typography } from '@mui/material';

export function OrderTableRow({ row, selected, onViewRow, onSelectRow, onDeleteRow }) {
  const router = useRouter();
  const { isMobile } = useContext(LoadingContext);
  const [idItemRow, setIdItemRow] = useState(null);
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

  const confirm = useBoolean();
  const collapse = useBoolean();
  const popover = usePopover();
  const popoverChild = usePopover();
  const [dataRow, setDataRow] = useState(parseLineItems(row.lineItems));

  useEffect(() => {
    const items = parseLineItems(row.lineItems);
    setDataRow(items);
  }, [row.lineItems]);

  const handleSelectItemRow = useCallback((value) => {
    setIdItemRow(value);
  }, []);

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

  const renderPrimary = (
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
          {row.salesorderNumber}
        </Link>
      </TableCell>

      <TableCell>
        <ListItemText
          primary={fDate(row.date)}
          secondary={fTime(row.date)}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            variant: 'caption',
          }}
        />
      </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (row.status === 'fulfilled' && 'success') ||
            (row.status === 'partially_shipped' && 'warning') ||
            (row.status === 'draft' && 'error') ||
            'default'
          }
        >
          {row.status}
        </Label>
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
            No items
          </Label>
        )}

        <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
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
        >
          <Paper sx={{ m: 1.5 }}>
            {dataRow.map((item, index) => (
              <Stack
                key={`${item.item_id}-${index}`}
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
                  <Grid item xs={6}>
                    <ListItemText
                      primary={
                        <b>{item.name}</b>
                      }
                      secondary={
                        <>
                          SKU: {item.sku}
                          <Typography variant="caption" color="text.secondary" display="block">
                            ID: {item.item_id}
                          </Typography>
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

                  <Grid item xs={5}>
                    <ListItemText
                      primary="Quantity Shipped"
                      secondary={item.quantity_shipped}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{
                        component: 'span',
                        color: 'text.disabled',
                        mt: 0.5,
                      }}
                    />
                  </Grid>

                  <Grid item xs={1} textAlign="right">
                    <IconButton 
                    color={popoverChild.open ? 'inherit' : 'default'} 
                    onClick={(e) => {
                      popoverChild.onOpen(e);
                      handleSelectItemRow(item.item_id)
                    }}
                    value={item.itemId}
                    >
                      <Iconify icon="mdi:dots-vertical" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Stack>
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
            View Order
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete Order
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
