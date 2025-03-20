import { parsePhoneNumber } from 'react-phone-number-input';
import { useRef, useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, Tooltip, ListItem, IconButton, Table, TableContainer, TableHead, TableCell, TableBody, TableRow, Switch, Select, TextField, Autocomplete, Chip, List } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { filteredDescription, filteredSomeDescription } from 'src/utils/project-tasks-utils';
import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useDataContext } from 'src/auth/context/data/data-context';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ServiceDetailsContentOverviewModalService } from './service-details-content-overview-modal-service';
import { ServiceDetailsContentOverviewTableIssues } from './service-details-content-overview-table-issues';



// ----------------------------------------------------------------------

export function ServiceDetailsContentOverview({
  salesOrder,
  setSomeItemsSelected,
  setAllIssuesCompleted,
}) {

  const {
    loadedServiceIssues
  } = useDataContext();

  const containerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const items = useMemo(() => salesOrder?.line_items, [salesOrder]);

  const listItems = useMemo(() => items?.filter((product) => product.line_item_type === 'goods'), [items]);

  const serviceItems = useMemo(() => items?.filter((product) => product.line_item_type !== 'goods'), [items]);

  const [selectedListItems, setSelectedListItems] = useState(
    listItems?.map((product) => ({
      ...product,
      selected: false,
      issues: [],
      notes: '',
    }))
  );

  const addIssue = (product) => {
    console.log('product', product.issues);
    const lastIndex = product.issues.length;
    setSelectedListItems((prev) =>
      prev.map((item) =>
        item.line_item_id === product.line_item_id
          ? {
            ...item, issues: [...item.issues, {
              id: lastIndex + 1,
              issue: null,
              quantity: 1,
              color: 'error.main',
            }]
          }
          : item
      )
    );
  };

  const removeIssue = (product, issue) => {
    setSelectedListItems((prev) =>
      prev.map((item) =>
        item.line_item_id === product.line_item_id
          ? {
            ...item, issues: item.issues.filter((i) => i.id !== issue.id)
          }
          : item
      )
    );
  };

  const canAddIssue = useCallback((product) => {
    if (!product) return false;
    const emptyIssues = product.issues ? product.issues.filter(issue => !issue.issue || issue.quantity < 1) : [];
    return emptyIssues.length === 0;
  }, []);

  const changeQuantity = (product, issue, operation) => {
    let newQuantity = 0;
    if (operation === 'add') {
      newQuantity = product.quantity >= Number(issue.quantity) + 1 ? Number(issue.quantity) + 1 : Number(issue.quantity);
    } else {
      newQuantity = Number(issue.quantity) - 1 < 1 ? 1 : Number(issue.quantity) - 1;
    }
    setSelectedListItems((prev) =>
      prev.map((item) =>
          item.line_item_id === product.line_item_id
              ? {
                  ...item, issues: item.issues.map((i) =>
                      i.id === issue.id
                          ? { 
                              ...i, 
                              quantity: newQuantity
                          }
                          : i
                  )
              }
              : item
      )
  );
  }


  useEffect(() => {
    setSomeItemsSelected(selectedListItems.some((product) => product.selected));
    setAllIssuesCompleted(selectedListItems.every(canAddIssue));
  }, [selectedListItems, setSomeItemsSelected, setAllIssuesCompleted, canAddIssue]);

  const openServiceItems = useBoolean(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      setHasScroll(el.scrollHeight > el.clientHeight);
    }
  }, []);

  if (salesOrder === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Project not found!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Card sx={{
        p: 3,
        gap: 1,
        display: 'flex',
        flexDirection: 'column',
        ml: isMobile ? 5 : 0,
        overflow: 'auto'
      }}>
        {[
          {
            label: 'SO Number',
            value: salesOrder?.salesorder_number,
            icon: <Iconify
              icon="fluent:book-number-24-regular"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: salesOrder?.salesorder_number?.length > 0,
          },
          {
            label: 'REF Number',
            value: salesOrder?.reference_number ? salesOrder?.reference_number : 'No REF Number',
            icon: <Iconify
              icon="carbon:term-reference"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: salesOrder?.reference_number?.length > 0,
          },
          {
            label: 'Order Date',
            value: fDate(salesOrder?.date),
            icon: <Iconify
              icon="solar:calendar-date-bold"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: salesOrder?.date?.length > 0,
          },
          {
            label: `${items?.length} Product(s), 
              Total Qty: ${items?.reduce((total, product) => total + product.quantity, 0)}`,
            icon: <Iconify
              icon="fluent-mdl2:product-list"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: items?.length > 0,
            value: (
              !isMobile && (
                <ServiceDetailsContentOverviewTableIssues
                  serviceItems={serviceItems}
                  selectedListItems={selectedListItems}
                  setSelectedListItems={setSelectedListItems}
                  containerRef={containerRef}
                  loadedServiceIssues={loadedServiceIssues}
                  openServiceItems={openServiceItems}
                  addIssue={addIssue}
                  removeIssue={removeIssue}
                  canAddIssue={canAddIssue}
                  changeQuantity={changeQuantity}
                />
              )
            ),

          },
        ].map((item) => (
          <Stack key={item.label} spacing={1.5} direction="row">
            {item?.icon}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <ListItemText
                primary={item.label}
                secondary={item.value}
                primaryTypographyProps={{ typography: 'body2', color: 'text.secondary', mb: 0.5 }}
                secondaryTypographyProps={{
                  component: 'span',
                  color: 'text.secondary',
                  typography: 'subtitle2',
                }}
              />
            </Box>
          </Stack>
        ))}
      </Card >
      <ServiceDetailsContentOverviewModalService salesOrder={salesOrder} items={serviceItems} open={openServiceItems.value} onClose={openServiceItems.onFalse} />
    </>
  );
}
