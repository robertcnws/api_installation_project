import { useRef, useMemo, useState, useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, ListItem, IconButton } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { filteredDescription } from 'src/utils/project-tasks-utils';
import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectDetailsContentOverviewModalService } from './project-details-content-overview-modal-service';

// ----------------------------------------------------------------------

export function ProjectDetailsContentOverview({
  project,
  listPermissions,
  openDialogs,
  setOpenDialogs,
  isOverview = false,
}) {

  const containerRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  // const items = useMemo(() => project?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases'), [project]);
  const items = useMemo(() => project?.salesOrder?.line_items, [project]);

  const listItems = useMemo(() => items?.filter((product) => product.line_item_type === 'goods'), [items]);

  const serviceItems = useMemo(() => items?.filter((product) => product.line_item_type !== 'goods'), [items]);

  const openServiceItems = useBoolean(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      setHasScroll(el.scrollHeight > el.clientHeight);
    }
  }, []);

  if (project === null) {
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
        ml: isMobile && isOverview ? 5 : 0,
        maxHeight: !isMobile ? (isOverview ? (project?.userManager?.name && !project?.hasPermission ? 696 : (project?.userManager?.name && project?.hasPermission ? 740 : 652)) : 652) : 'auto',
        minHeight: !isMobile ? (isOverview ? (project?.userManager?.name && !project?.hasPermission ? 696 : (project?.userManager?.name && project?.hasPermission ? 740 : 652)) : 652) : 'auto',
        overflow: 'auto'
      }}>
        {[
          {
            label: 'Client',
            value: project?.salesOrder?.customer_name,
            icon: <Iconify icon="ix:customer-filled" />,
          },
          {
            label: 'Address',
            value: project?.address,
            icon: <Iconify icon="hugeicons:address-book" />,
          },
          {
            label: 'Phone Number',
            value: project?.salesOrder?.customer.phone,
            icon: <Iconify icon="icon-park:phone" />,
          },
          {
            label: 'Email',
            value: project?.salesOrder?.customer?.email,
            icon: <Iconify icon="mage:email-fill" />,
          },
          {
            label: 'Order Date',
            value: fDate(project?.salesOrder?.date),
            icon: <Iconify icon="solar:calendar-date-bold" />,
          },
          {
            label: `${items?.length} Product(s), 
              Total Qty: ${items?.reduce((total, product) => total + product.quantity, 0)}`,
            value: (
              <>
                {listItems?.map((product) => (
                  <ListItem key={product.line_item_id}>
                    <ListItemText
                      primary={product.name}
                      secondary={
                        <Stack direction="column" spacing={1}>
                          <Typography
                            variant="caption"
                            color="text.primary"
                            sx={{ mb: 1, whiteSpace: 'pre-line' }}
                          >
                            {`Qty: ${product.quantity}\n${filteredDescription(product.description)}`}
                          </Typography>
                        </Stack>
                      }
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.primary',
                      }}
                    />
                  </ListItem>
                ))}
                <Label
                  color="default"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    openServiceItems.onTrue();
                  }}
                >
                  See {serviceItems?.length} service(s) items
                </Label>
              </>
            ),
            icon: <Iconify icon="fluent-mdl2:product-list" />,
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
                  color: 'text.primary',
                  typography: 'subtitle2',
                }}
              />
              {(item.label === 'Address' && (verifyPermissions(
                listPermissions,
                CONFIG.permissions.system,
                CONFIG.permissions.moduleProjects,
                CONFIG.permissions.operationEditAddress
              ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <IconButton variant="text" color="primary" size="small" sx={{ ml: 1 }}
                    onClick={() => setOpenDialogs({ ...openDialogs, address: true })}
                  >
                    <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
                  </IconButton>
                )}
            </Box>
          </Stack>
        ))}
      </Card >
      <ProjectDetailsContentOverviewModalService project={project} items={serviceItems} open={openServiceItems.value} onClose={openServiceItems.onFalse} />
    </>
  );
}
