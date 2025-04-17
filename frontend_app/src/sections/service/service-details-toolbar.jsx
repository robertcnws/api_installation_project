import axios from 'axios';
import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { ServiceShareDialog } from 'src/sections/service/service-share-dialog';

import { useDataContext } from 'src/auth/context/data/data-context';





// ----------------------------------------------------------------------

export function ServiceDetailsToolbar({
  service,
  backLink,
  editLink,
  openEdit,
  setOpenEdit,
  type,
  onDelete,
  listPermissions,
  sx,
  ...other
}) {

  const {
    loadedUsers,
  } = useDataContext();

  const share = useBoolean();

  const confirmDelete = useBoolean();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const cleanLoadedUsers = useMemo(() => loadedUsers.map(({ __typename, ...rest }) => rest), [loadedUsers]);

  const filteredUsers = useMemo(() => cleanLoadedUsers.filter(user => user.id !== service?.userManager?.id), [cleanLoadedUsers, service]);

  const handleAddResetUsersAssignees = useCallback(
    async (users) => {
      let updatedUsers = users;
      if (service?.usersAssignees.length > 0) {
        updatedUsers = [
          ...service.usersAssignees,
          ...users.filter((user) => !service?.usersAssignees.some((u) => u.id === user.id)),
        ];
      }
      try {
        const promise = axios.post(`${CONFIG.apiUrl}/services/add/service/${service?.id}/users/`, {
          usersAssignees: updatedUsers,
          userReporter: userLogged?.data,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [service, userLogged]
  );

  const handleRefetchSalesOrder = useCallback(
    async () => {
      try {
        const promise = axios.get(`${CONFIG.apiUrl}/integration/refetch_salesorder_service/${service?.id}/`);

        toast.promise(promise, {
          loading: 'Loading...',
          success: `Sales Order refetched!`,
          error: `Sales Order error in refetching!`,
        });

      } catch (error) {
        console.error(error);
      }
    },
    [service]
  );

  return (
    <>
      {/* <Divider sx={{ borderStyle: 'dashed', mb: 1 }} /> */}
      <Stack spacing={1} direction="row" sx={{ mb: { xs: 1, md: 1 }, ...sx }} {...other}>
        {/* <Button
          component={RouterLink}
          href={backLink}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={12} />}
          sx={{ mr: -3 }}
        /> */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">SERVICE {service?.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {service?.createdBy?.first_name ? 
            `Created by ${service?.createdBy?.first_name || service?.createdBy?.firstName} ${service?.createdBy?.last_name || service?.createdBy?.lastName}` :
              `Created by ${service?.createdBy?.first_name || service?.userReporter?.firstName} ${service?.createdBy?.last_name || service?.userReporter?.lastName}`}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />

        {(type === 'service' || type === 'tasks') && (
          <>
            {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
              <Tooltip title='Refetch Sales Order' arrow>
                <IconButton onClick={handleRefetchSalesOrder} color='default'>
                  <Iconify icon="codicon:repo-fetch" />
                </IconButton>
              </Tooltip>
            )}
            {/* {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                <Tooltip title='Add users to service' arrow>
                  <IconButton onClick={share.onTrue} color={service?.usersAssignees?.length > 0 ? 'default' : 'warning'}>
                    <Iconify icon="tdesign:usergroup-add-filled" />
                  </IconButton>
                </Tooltip>
              )} */}
            {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
              <Tooltip title="Delete service" arrow>
                <IconButton onClick={confirmDelete.onTrue} color="error">
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
        <Tooltip title='Close service' arrow>
          <Button
            component={RouterLink}
            href={backLink}
            startIcon={<Iconify icon="mingcute:close-fill" />}
            sx={{ ml: 0, borderRadius: 10, maxWidth: 1 }}
          />
        </Tooltip>

        {/* <LoadingButton
          color="inherit"
          variant="contained"
          loading={!publish}
          loadingIndicator="Loading…"
          endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
          onClick={popover.onOpen}
          sx={{ textTransform: 'capitalize' }}
        >
          {publish}
        </LoadingButton> */}
      </Stack>

      <ServiceShareDialog
        open={share.value}
        shared={service?.shared}
        loadedUsers={filteredUsers}
        serviceData={service}
        handleAddUsersAssignees={handleAddResetUsersAssignees}
        onClose={() => {
          share.onFalse();
        }}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete service <strong> {service?.name} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmDelete.onFalse();
              onDelete();
            }}
          >
            Delete
          </Button>
        }
      />

      {/* <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          {publishOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === publish}
              onClick={() => {
                popover.onClose();
                onChangePublish(option.value);
              }}
            >
              {option.value === 'published' && <Iconify icon="eva:cloud-upload-fill" />}
              {option.value === 'draft' && <Iconify icon="solar:file-text-bold" />}
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover> */}
    </>
  );
}
