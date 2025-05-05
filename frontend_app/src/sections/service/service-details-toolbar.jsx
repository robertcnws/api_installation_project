import axios from 'axios';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { Link, MenuItem, MenuList, TextField, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

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
  onGenerateMeasurements,
  sx,
  ...other
}) {

  const {
    loadedUsers,
    loadedMeasurements,
    refetchMeasurements,
  } = useDataContext();

  const router = useRouter();

  const share = useBoolean();

  const confirmDelete = useBoolean();

  const confirmGenerateMeasurements = useBoolean();

  const popoverServiceList = usePopover();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const cleanLoadedUsers = useMemo(() => loadedUsers.map(({ __typename, ...rest }) => rest), [loadedUsers]);

  const filteredUsers = useMemo(() => cleanLoadedUsers.filter(user => user.id !== service?.userManager?.id), [cleanLoadedUsers, service]);

  const [associatedMeasurement, setAssociatedMeasurement] = useState(loadedMeasurements?.find(measurement => measurement.service?.id === service?.id) || null);

  const [serviceFilteredList, setServiceFilteredList] = useState([]);

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('serviceFilteredList');
    if (raw) {
      try {
        setServiceFilteredList(JSON.parse(raw));
      } catch (e) {
        console.error('Error parseando serviceFilteredList desde localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (loadedMeasurements?.length > 0) {
      const measurement = loadedMeasurements.find(m => m.service?.id === service?.id);
      setAssociatedMeasurement(measurement);
    }
  }, [loadedMeasurements, service]);

  const indexInServiceFilteredList = useMemo(() => {
    if (serviceFilteredList.length > 0) {
      return serviceFilteredList.findIndex(installation => installation.id === service?.id);
    }
    return -1;
  }, [serviceFilteredList, service]);

  const searchedServiceFilteredList = useMemo(() => {
    const lower = searchText.toLowerCase();
    return serviceFilteredList.filter(inst =>
      inst.name.toLowerCase().includes(lower) ||
      String(inst.number).toLowerCase().includes(lower)
    );
  }, [serviceFilteredList, searchText]);

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
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left' }}>
            {indexInServiceFilteredList - 1 >= 0 && (
              <Tooltip title={`Previous service: ${serviceFilteredList?.[indexInServiceFilteredList - 1]?.name}`} arrow>
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={() => {
                    const id = serviceFilteredList?.[indexInServiceFilteredList - 1]?.id;
                    localStorage.setItem('serviceId', id);
                    localStorage.setItem('backFromServiceDetails', 'services');
                    router.push(paths.dashboard.service.details(id));
                  }} color='default'>
                  <Iconify icon="mdi-light:skip-previous" />
                </IconButton>
              </Tooltip>
            )}
            {indexInServiceFilteredList + 1 < serviceFilteredList?.length && (
              <Tooltip title={`Next service: ${serviceFilteredList?.[indexInServiceFilteredList + 1]?.name}`} arrow>
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={() => {
                    const id = serviceFilteredList?.[indexInServiceFilteredList + 1]?.id;
                    localStorage.setItem('serviceId', id);
                    localStorage.setItem('backFromServiceDetails', 'services');
                    router.push(paths.dashboard.service.details(id));
                  }} color='default'>
                  <Iconify icon="mdi-light:skip-next" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='List services' arrow>
              <IconButton
                sx={{
                  '&:hover': {
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  },
                }}
                onClick={popoverServiceList.onOpen}
                color='default'>
                <Iconify icon="pepicons-pencil:next-track" />
              </IconButton>
            </Tooltip>
            <CustomPopover
              open={popoverServiceList.open}
              anchorEl={popoverServiceList.anchorEl}
              onClose={popoverServiceList.onClose}
              slotProps={{ arrow: { placement: 'left-top' } }}
              PaperProps={{
                style: {
                  maxHeight: 300,
                }
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by name or #"
                  size="small"
                  fullWidth
                />
              </Box>
              <MenuList sx={{
                maxHeight: 300,
                overflowY: 'auto'
              }}>
                {searchedServiceFilteredList.length > 0 ? (
                  searchedServiceFilteredList?.map((serv) => (
                    <MenuItem
                      key={serv?.id}
                      onClick={() => {
                        popoverServiceList.onClose();
                        const id = serv?.id;
                        localStorage.setItem('serviceId', id);
                        localStorage.setItem('backFromServiceDetails', 'services');
                        router.push(paths.dashboard.service.details(id));
                      }}
                    >
                      <Tooltip
                        title={
                          <>
                            <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                              Service: {serv?.name}
                            </Typography>
                            <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                              Start date: {fDate(serv?.startDate) || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                              Version: {serv?.version || 'N/A'}
                            </Typography>
                          </>
                        }
                        placement="right"
                        arrow
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left', gap: 2 }}>
                          <Iconify icon="carbon:user-service" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {serv?.name} (v{serv?.version})
                          </Typography>
                        </Box>
                      </Tooltip>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No matches</MenuItem>
                )}
              </MenuList>
            </CustomPopover>
          </Box>
        </Box>
        <Box sx={{ flexGrow: 1 }} />

        {(type === 'service' || type === 'tasks') && (
          <>
            {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff) ||
              listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.projectManager)) && (
                <Tooltip title='Generate Measurements' arrow>
                  <IconButton
                    sx={{
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                      },
                    }}
                    onClick={confirmGenerateMeasurements.onTrue}
                    color='default'>
                    <Iconify icon="tdesign:measurement-1" />
                  </IconButton>
                </Tooltip>
              )}
            {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
              <Tooltip title='Refetch Sales Order' arrow>
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={handleRefetchSalesOrder}
                  color='default'>
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
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={confirmDelete.onTrue}
                  color="error">
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
            sx={{
              ml: 0,
              borderRadius: 10,
              maxWidth: 1,
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: 'transparent',
              },
            }}
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

      <ConfirmDialog
        open={confirmGenerateMeasurements.value}
        onClose={confirmGenerateMeasurements.onFalse}
        title="Genenerate Measurements"
        content={
          <>
            {associatedMeasurement && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                This service already has{' '}
                <Link
                  component={RouterLink}
                  to={paths.dashboard.measurement.details(associatedMeasurement.id)}
                  variant="body2"
                  underline="hover"
                  color="default"
                  sx={{ mx: 0.5 }}
                  onClick={() => {
                    confirmGenerateMeasurements.onFalse();
                    localStorage.setItem('measurementId', associatedMeasurement?.id);
                    localStorage.setItem('backFromMeasurementDetails', 'service');
                    localStorage.setItem('backFromMeasurementDetailsProjectId', '');
                    localStorage.setItem('backFromMeasurementDetailsServiceId', service?.id);
                  }}
                >
                  measurements
                </Link>
                associated
              </Typography>
            )}
            Are you sure want to generate new measurements for <strong> {service?.name} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
              const newMeas = await onGenerateMeasurements();
              await refetchMeasurements();
              confirmGenerateMeasurements.onFalse();
              if (newMeas?.data?.id) {
                localStorage.setItem('measurementId', newMeas?.data?.id);
                localStorage.setItem('backFromMeasurementDetails', 'service');
                localStorage.setItem('backFromMeasurementDetailsProjectId', '');
                localStorage.setItem('backFromMeasurementDetailsServiceId', service?.id);
                router.push(paths.dashboard.measurement.details(newMeas?.data?.id));
              }
            }}
          >
            Generate
          </Button>
        }
      />
    </>
  );
}
