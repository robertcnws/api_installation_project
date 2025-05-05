import { parsePhoneNumber } from 'react-phone-number-input';
import { useRef, useMemo, useState, useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, Tooltip, ListItem, IconButton } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { listRolesAndSubroles } from 'src/utils/check-permissions';
import { filteredDescription } from 'src/utils/service-tasks-utils';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';


// ----------------------------------------------------------------------

export function MeasurementDetailsContentComponent({
  measurement,
  openDialogs,
  setOpenDialogs,
  isOverview = false,
  height = 200,
}) {

  const containerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  // const items = useMemo(() => measurement?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases'), [measurement]);
  const items = useMemo(() => measurement?.salesOrder?.line_items, [measurement]);

  const listItems = useMemo(() => items?.filter((product) => product.line_item_type === 'goods'), [items]);

  const measurementItems = useMemo(() => items?.filter((product) => product.line_item_type !== 'goods'), [items]);

  const issuedProducts = useMemo(() => measurement?.issuedProducts, [measurement]);

  const openMeasurementItems = useBoolean(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      setHasScroll(el.scrollHeight > el.clientHeight);
    }
  }, []);

  if (measurement === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <Typography variant="h6" color="text.secondary">
          Measurement not found!
        </Typography>
      </Box>
    );
  }

  return (
    <Card sx={{
      p: 3,
      gap: 1,
      display: 'flex',
      flexDirection: 'column',
      ml: isMobile && isOverview ? 5 : 0,
      maxHeight: !isMobile ? height : 'auto',
      minHeight: !isMobile ? height : 'auto',
      height: !isMobile ? height : 'auto',
      overflow: 'auto'
    }}>
      {[
        {
          label: 'SO Number',
          value: measurement?.salesOrder?.salesorder_number || 'No SO Number',
          icon: <Iconify
            icon="fluent:book-number-24-regular"
            sx={{ color: 'text.primary' }}
          />,
          hasValue: measurement?.salesOrder?.salesorder_number?.length > 0,
        },
        {
          label: 'REF Number',
          value: measurement?.salesOrder?.reference_number ? measurement?.salesOrder?.reference_number :
            measurement?.referenceNumber ? measurement?.referenceNumber : 'No REF Number',
          icon: <Iconify
            icon="carbon:term-reference"
            sx={{ color: 'text.primary' }}
          />,
          hasValue: measurement?.salesOrder?.reference_number?.length > 0 || measurement?.referenceNumber?.length > 0,
        },
        {
          label: 'Client',
          value: measurement?.salesOrder?.customer_name || measurement?.customer?.name,
          icon: <Iconify
            icon="ix:customer-filled"
            sx={{ color: 'text.primary' }}
          />,
          hasValue: measurement?.salesOrder?.customer_name?.length > 0 || measurement?.customer?.name?.length > 0,
        },
        {
          label: 'Address',
          value: measurement?.address,
          icon: <Iconify
            icon="hugeicons:address-book"
            sx={{ color: 'text.primary' }}
          />,
          hasValue: measurement?.address?.length > 0,
        },
        {
          label: 'Phone Number',
          value: (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone ||
            (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile ||
            measurement?.phone || measurement?.customer?.phone,
          icon: <Iconify
            icon="icon-park:phone"
            sx={{ color: 'text.primary' }}
          />,
          hasValue: (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone?.length > 0 ||
            (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile?.length > 0 ||
            measurement?.phone?.length > 0 || measurement?.customer?.phone?.length > 0,
        },
        {
          label: 'Order Date',
          value: fDate(measurement?.salesOrder?.date),
          icon: <Iconify
            icon="solar:calendar-date-bold"
            sx={{ color: 'text.primary' }}
          />,
          hasValue: measurement?.salesOrder?.date?.length > 0,
        },
        {
          label: `${items?.length > 0 ? items?.length : 0} Product(s), 
                        Total Qty: ${items?.length > 0 ? items?.reduce((total, product) => total + product.quantity, 0) : 0}`,
          icon: <Iconify
            icon="fluent-mdl2:product-list"
            sx={{ color: 'text.primary' }}
          />,
          value: (
            <>
              {listItems?.length > 0 ? (
                listItems?.map((product) => (
                  <ListItem key={product.line_item_id}>
                    <ListItemText
                      primary={`${product.name} ${issuedProducts?.find((i) => i.line_item_id === product.line_item_id) ? '(Issued)' : ''}`}
                      secondary={
                        <Stack direction="column" spacing={1}>
                          <Typography
                            variant="caption"
                            color={issuedProducts?.find((i) => i.line_item_id === product.line_item_id) ? 'error' : 'text.secondary'}
                            sx={{ mb: 1, whiteSpace: 'pre-line' }}
                          >
                            {`Qty: ${product.quantity}\n${filteredDescription(product.description)}`}
                          </Typography>
                        </Stack>
                      }
                      primaryTypographyProps={{
                        variant: 'subtitle2',
                        color: issuedProducts?.find((i) => i.line_item_id === product.line_item_id) ? 'error' : 'text.secondary',
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: issuedProducts?.find((i) => i.line_item_id === product.line_item_id) ? 'error' : 'text.secondary',
                      }}
                    />
                  </ListItem>
                ))) : (
                  <ListItem key='no-products'>
                    <ListItemText
                      primary='No Products Found'
                      secondary={
                        <Stack direction="column" spacing={1}>
                          <Typography
                            variant="caption"
                            color='text.secondary'
                            sx={{ mb: 1, whiteSpace: 'pre-line' }}
                          >
                            No Products Found
                          </Typography>
                        </Stack>
                      }
                      primaryTypographyProps={{
                        variant: 'subtitle2',
                        color: 'text.secondary',
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                      }}
                    />
                  </ListItem>
                )}
            </>
          ),
          hasValue: listItems?.length > 0,
        },
      ].map((item) => (
        <Stack key={item.label} spacing={1.5} direction="row">
          {item?.icon}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <ListItemText
              primary={item.label}
              secondary={
                item.label === 'Phone Number'
                  ? item.value
                    ? (() => {
                      const phoneNumberObj = parsePhoneNumber(item.value, 'US');
                      if (phoneNumberObj && phoneNumberObj.isValid()) {
                        const countryCode = phoneNumberObj.countryCallingCode;
                        const nsn = phoneNumberObj.nationalNumber;
                        if (nsn.length === 10) {
                          return `+${countryCode} (${nsn.slice(0, 3)}) ${nsn.slice(3, 6)} ${nsn.slice(6)}`;
                        }
                        return phoneNumberObj.formatInternational();
                      }
                      return item.value;
                    })()
                    : item.value
                  : item.value
              }
              primaryTypographyProps={{ typography: 'body2', color: 'text.secondary', mb: 0.5 }}
              secondaryTypographyProps={{
                component: 'span',
                color: 'text.secondary',
                typography: 'subtitle2',
              }}
            />
            {(item.label === 'Address' && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (
              <Tooltip title={measurement?.address ? "Edit Address" : "Add Address"} arrow>
                <IconButton variant="text" color={measurement?.address ? "primary" : "warning"} size="small" sx={{
                  ml: 1,
                  '&:hover': {
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  },
                }}
                  onClick={() => setOpenDialogs({ ...openDialogs, address: true })}
                >
                  <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
                </IconButton>
              </Tooltip>
            )}
            {(item.label === 'Phone Number' && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (
              <Tooltip title={(measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone ||
                (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile ||
                measurement?.phone || measurement?.customer?.phone ?
                "Edit Phone Number" : "Add Phone Number"} arrow>
                <IconButton
                  variant="text"
                  color={(measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.phone ||
                    (measurement?.salesOrder?.customer || measurement?.salesOrder?.contact_person_details)?.mobile ||
                    measurement?.phone || measurement?.customer?.phone ? "primary" : "warning"}
                  size="small"
                  sx={{
                    ml: 1,
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={() => setOpenDialogs({ ...openDialogs, phoneNumber: true })}
                >
                  <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Stack>
      ))}
    </Card >
  );
}
