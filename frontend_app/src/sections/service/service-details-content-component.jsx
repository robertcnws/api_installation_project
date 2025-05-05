import { parsePhoneNumber } from 'react-phone-number-input';
import { useRef, useMemo, useState, useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, Tooltip, ListItem, IconButton } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { filteredDescription } from 'src/utils/service-tasks-utils';
import { isInstaller, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ServiceDetailsContentOverviewModalService } from './service-details-content-overview-modal-service';


// ----------------------------------------------------------------------

export function ServiceDetailsContentComponent({
  service,
  openDialogs,
  setOpenDialogs,
  isOverview = false,
}) {

  const containerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  // const items = useMemo(() => service?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases'), [service]);
  const items = useMemo(() => service?.salesOrder?.line_items, [service]);

  const listItems = useMemo(() => items?.filter((product) => product.line_item_type === 'goods'), [items]);

  const serviceItems = useMemo(() => items?.filter((product) => product.line_item_type !== 'goods'), [items]);

  const issuedProducts = useMemo(() => service?.issuedProducts, [service]);

  const openServiceItems = useBoolean(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      setHasScroll(el.scrollHeight > el.clientHeight);
    }
  }, []);

  if (service === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Service not found!
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
        ml: isMobile && isOverview ? 5 : 0,
        maxHeight: !isMobile ? 662 : 'auto',
        minHeight: !isMobile ? 662 : 'auto',
        overflow: 'auto'
      }}>
        {[
          {
            label: 'SO Number',
            value: service?.salesOrder?.salesorder_number,
            icon: <Iconify
              icon="fluent:book-number-24-regular"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: service?.salesOrder?.salesorder_number?.length > 0,
          },
          {
            label: 'REF Number',
            value: service?.salesOrder?.reference_number ? service?.salesOrder?.reference_number :
              service?.referenceNumber ? service?.referenceNumber : 'No REF Number',
            icon: <Iconify
              icon="carbon:term-reference"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: service?.salesOrder?.reference_number?.length > 0 || service?.referenceNumber?.length > 0,
          },
          {
            label: 'Client',
            value: service?.salesOrder?.customer_name,
            icon: <Iconify
              icon="ix:customer-filled"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: service?.salesOrder?.customer_name?.length > 0,
          },
          ...(!isOverview && service?.servicePlace?.name?.toLowerCase().indexOf('on site') !== -1) ? [{
            label: 'Address',
            value: service?.address,
            icon: <Iconify
              icon="hugeicons:address-book"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: service?.address?.length > 0,
          }] : [],
          {
            label: 'Phone Number',
            value: (service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.phone ||
              (service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.mobile || service?.phone,
            icon: <Iconify
              icon="icon-park:phone"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: (service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.phone?.length > 0 ||
              (service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.mobile?.length > 0 || service?.phone?.length > 0,
          },
          {
            label: 'Order Date',
            value: fDate(service?.salesOrder?.date),
            icon: <Iconify
              icon="solar:calendar-date-bold"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: service?.salesOrder?.date?.length > 0,
          },
          ...(!isInstaller(userLogged?.data?.user_role?.name)) ? [{
            label: `${items?.length} Product(s), 
                        Total Qty: ${items?.reduce((total, product) => total + product.quantity, 0)}`,
            icon: <Iconify
              icon="fluent-mdl2:product-list"
              sx={{ color: 'text.primary' }}
            />,
            hasValue: items?.length > 0,
            value: (
              <>
                {listItems?.map((product) => (
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
                ))}
                {serviceItems?.length > 0 && (
                  <Label
                    color="default"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      openServiceItems.onTrue();
                    }}
                  >
                    See {serviceItems?.length} service(s) items
                  </Label>
                )}
              </>
            ),
          }] : [],
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
              {(item.label === 'Address' && service?.servicePlace?.name?.toLowerCase().indexOf('on site') !== -1 &&
                (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <Tooltip title={service?.address ? "Edit Address" : "Add Address"} arrow>
                    <IconButton variant="text" color={service?.address ? "primary" : "warning"} size="small" sx={{
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
              {(item.label === 'REF Number' &&
                (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <Tooltip title={service?.salesOrder?.reference_number || service?.referenceNumber ? "Edit REF Number" : "Add REF Number"} arrow>
                    <IconButton
                      variant="text"
                      color={service?.salesOrder?.reference_number || service?.referenceNumber ? "primary" : "warning"}
                      size="small" sx={{
                        ml: 1,
                        '&:hover': {
                          boxShadow: 'none',
                          backgroundColor: 'transparent',
                        },
                      }}
                      onClick={() => setOpenDialogs({ ...openDialogs, refNumber: true })}
                    >
                      <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
                    </IconButton>
                  </Tooltip>
                )}
              {(item.label === 'Phone Number' &&
                (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <Tooltip title={((service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.phone ||
                    (service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.mobile || service?.phone) ? "Edit Phone Number" : "Add Phone Number"} arrow>
                    <IconButton
                      variant="text"
                      color={((service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.phone ||
                        (service?.salesOrder?.customer || service?.salesOrder?.contact_person_details)?.mobile || service?.phone) ? "primary" : "warning"}
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
      <ServiceDetailsContentOverviewModalService service={service} items={serviceItems} open={openServiceItems.value} onClose={openServiceItems.onFalse} />
    </>
  );
}
