import axios from 'axios';
import dayjs from 'dayjs';
import React, { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Chip, Table, Radio, Button, Switch, Tooltip, TableRow, ListItem, TableBody, TableCell, TableHead, TextField, IconButton, RadioGroup, Autocomplete, TableContainer, FormControlLabel } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate, fIsAfter, fDuration, fDateTime } from 'src/utils/format-time';
import { getServiceInstaller } from 'src/utils/service-tasks-utils';
import { filteredDescriptionJson } from 'src/utils/project-tasks-utils';
import { isInstaller, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useTable, TableNoData } from 'src/components/table';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { ServiceEditModalDatesView } from 'src/sections/service/service-edit-modal-dates-view';
import { ServiceDetailsStageStepper } from 'src/sections/service/service-details-stage-stepper';
import { ServiceDetailsContentComponent } from 'src/sections/service/service-details-content-component';
import { ServiceEditModalUserManagerView } from 'src/sections/service/service-edit-modal-user-manager-view';
import { ServiceEditModalInstallationTeamView } from 'src/sections/service/service-edit-modal-installation-team-view';
import { ServiceDetailsContentOverviewInstaller } from 'src/sections/service/service-details-content-overview-installer';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { ServiceEditModalIssue } from '../service-edit-modal-issue';
import { ServiceAddModalIssue } from '../service-add-modal-issue copy';


const SERVICE_PLACE_OPTIONS = [
  { id: 1, name: 'On Site' },
  { id: 2, name: 'On Warehouse' },
]


// ----------------------------------------------------------------------

export function ServiceDetailsContent({
  service,
  refetchService,
  setOpenEdit,
  openDialogs,
  setOpenDialogs,
  openSalesOrderModal,
  handleChangeProperties,
}) {

  const theme = useTheme();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const table = useTable({ defaultDense: true });

  const { dense } = table

  const {
    loadedServiceStages,
    loadedUsers,
  } = useDataContext();

  const [totalTasks, setTotalTasks] = useState(0);
  const [totalInProgressTasks, setTotalInProgressTasks] = useState(0);
  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0);
  const [totalNotStartedTasks, setTotalNotStartedTasks] = useState(0);

  const [selectedItem, setSelectedItem] = useState(null);

  const [selectedIssue, setSelectedIssue] = useState(null);

  const confirmDelete = useBoolean();

  const [isStartDate, setIsStartDate] = useState(false);

  const [isInspectionDate, setIsInspectionDate] = useState(false);

  const [totalsByIssues, setTotalsByIssues] = useState({});

  const [selectedServicePlace, setSelectedServicePlace] = useState(null);

  const [selectedServiceType, setSelectedServiceType] = useState(null);

  const [selectedHasToPay, setSelectedHasToPay] = useState(false);
  const [selectedPaid, setSelectedPaid] = useState(false);
  const [selectedByFactory, setSelectedByFactory] = useState(false);
  const [selectedRepaired, setSelectedRepaired] = useState(false);

  const possibleItems = useMemo(() =>
    service ?
      service?.salesOrder?.line_items.filter(
        (item) => !service?.issuedProducts?.some((issuedProduct) => issuedProduct.line_item_id === item.line_item_id)
      ) :
      service?.salesOrder?.line_items,
    [service]);

  const possibleLineItems = useMemo(() => possibleItems?.filter((product) => product.line_item_type === 'goods'), [possibleItems]);

  useEffect(() => {
    setSelectedServicePlace(
      service && service.servicePlace && service.servicePlace.name
        ? service.servicePlace
        : null
    );
  }, [service]);

  useEffect(() => {
    setSelectedServiceType(
      service && service.serviceType
        ? service.serviceType
        : null
    );
  }, [service]);

  useEffect(() => {
    if (service) {
      setTotalTasks(
        service?.hasPermission ? service?.serviceDefaultTasks?.length :
          service?.serviceDefaultTasks?.filter((task) => task.service_default_task.service_stage.name !== CONFIG.stages.permission).length
      );
      setTotalInProgressTasks(
        service?.hasPermission ? service?.serviceDefaultTasks?.filter((task) => task.status === 'in progress').length :
          service?.serviceDefaultTasks?.filter((task) => task.status === 'in progress' && task.service_default_task.service_stage.name !== CONFIG.stages.permission).length
      );
      setTotalCompletedTasks(
        service?.hasPermission ? service?.serviceDefaultTasks?.filter((task) => task.status === 'finished').length :
          service?.serviceDefaultTasks?.filter((task) => task.status === 'finished' && task.service_default_task.service_stage.name !== CONFIG.stages.permission).length
      );
      setTotalNotStartedTasks(
        service?.hasPermission ? service?.serviceDefaultTasks?.filter((task) => task.status === CONFIG.taskStatus.notStarted).length :
          service?.serviceDefaultTasks?.filter((task) => task.status === CONFIG.taskStatus.notStarted && task.service_default_task.service_stage.name !== CONFIG.stages.permission).length
      );
      setSelectedHasToPay(service?.hasToPay);
      setSelectedPaid(service?.paid);
      setSelectedByFactory(service?.byFactory);
      setSelectedRepaired(service?.repaired);
    }
  }, [service]);

  useEffect(() => {
    if (service) {
      const totals = service?.issuedProducts?.reduce((acc, product) => {
        product?.issues?.forEach((issue) => {
          if (acc[issue.issue.name]) {
            acc[issue.issue.name] += issue.quantity;
          } else {
            acc[issue.issue.name] = issue.quantity;
          }
        });
        return acc;
      }, {});
      setTotalsByIssues(totals);
    }
  }, [service]);

  const items = useMemo(() => service?.salesOrder?.line_items, [service]);



  const issuedProducts = useMemo(() =>
    service?.issuedProducts
      ? [...service.issuedProducts].sort((a, b) =>
        a?.line_item_id.localeCompare(b?.line_item_id)
      ).filter((product) => product?.issues?.length > 0)
      : [],
    [service]
  );

  const handleSwitch = (event, property) => {
    const newVal = event.target.checked;
    if (property === 'hasToPay') {
      setSelectedHasToPay(newVal);
      handleChangeProperties('hasToPay', newVal);
    } else if (property === 'paid') {
      setSelectedPaid(newVal);
      handleChangeProperties('paid', newVal);
    } else if (property === 'byFactory') {
      setSelectedByFactory(newVal);
      handleChangeProperties('byFactory', newVal);
    } else if (property === 'repaired') {
      setSelectedRepaired(newVal);
      handleChangeProperties('repaired', newVal);
    }
  }

  const handleDeleteIssue = useCallback(async () => {
    const formData = new FormData();
    formData.append('userReporter', JSON.stringify(userLogged?.data));

    const url = `${CONFIG.apiUrl}/services/update/service/${service?.id}/delete-issue/${selectedItem?.line_item_id}/${selectedIssue?.id}/`;

    const promise = axios.delete(url, {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    try {
      toast.promise(promise, {
        loading: 'Loading...',
        success: `Update Service (${service.name}) success!`,
        error: `Update Service (${service.name}) error!`,
      });

      const response = await promise;

      if (!response.data) {
        return;
      }

      confirmDelete.onFalse();
      setSelectedItem(null);
      setSelectedIssue(null);

      refetchService?.();

    } catch (error) {
      console.error(error);
    }
  }, [service, selectedItem, selectedIssue, userLogged, refetchService, confirmDelete]);


  const handleSetServicePlace = useCallback(async () => {
    const formData = new FormData();
    formData.append('userReporter', JSON.stringify(userLogged?.data));
    formData.append('servicePlace', JSON.stringify(selectedServicePlace));

    const url = `${CONFIG.apiUrl}/services/update/service/${service?.id}/set-place/`;

    const promise = axios.post(url, formData);

    try {
      toast.promise(promise, {
        loading: 'Loading...',
        success: `Update Service (${service.name}) success!`,
        error: `Update Service (${service.name}) error!`,
      });

      const response = await promise;

      if (!response.data) {
        return;
      }

      refetchService?.();

    } catch (error) {
      console.error(error);
    }
  }, [service, selectedServicePlace, userLogged, refetchService]);


  const handleChangeServiceType = useCallback(async (value) => {
    const formData = new FormData();
    formData.append('userReporter', JSON.stringify(userLogged?.data));
    formData.append('serviceType', value);

    const url = `${CONFIG.apiUrl}/services/update/service/${service?.id}/change-type/`;

    const promise = axios.post(url, formData);

    try {
      toast.promise(promise, {
        loading: 'Loading...',
        success: `Update Service (${service.name}) success!`,
        error: `Update Service (${service.name}) error!`,
      });

      const response = await promise;

      if (!response.data) {
        return;
      }

      refetchService?.();

    } catch (error) {
      console.error(error);
    }
  }, [service, userLogged, refetchService]);


  const renderMainContent = (
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Number:</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" color="text.primary"><b>{`${service?.number}-${service?.version}`}</b></Typography>
            </TableCell>
            <TableCell />
          </TableRow>

          {!isInstaller(userLogged?.data?.user_role?.name) && (

            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" color="text.secondary">Responsible:</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                  <Avatar alt={service?.userManager?.name} src={service?.userManager?.avatarUrl} sx={{ width: 24, height: 24, mr: 1 }} />
                  <Typography variant="body2" color="text.primary">
                    <b>{service?.userManager?.name ? service?.userManager?.name : ''}</b>
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                {(service?.userManager?.name &&
                  (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (

                    <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, userManager: true })}
                    >
                      <Iconify icon="la:user-edit" color="primary" width={22} />
                    </IconButton>

                  )}
                {(!service?.userManager?.name &&
                  (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                    <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, userManager: true })}
                    >
                      <Iconify icon="tdesign:user-add-filled" color="warning" width={20} />
                    </IconButton>
                  )}
              </TableCell>
            </TableRow>

          )}

          {service?.userManager?.name && (

            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" color="text.secondary">Service Team:</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                  <Avatar
                    alt={getServiceInstaller(service, CONFIG)?.name}
                    src={getServiceInstaller(service, CONFIG)?.avatarUrl}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  />
                  <Typography variant="body2" color="text.primary">
                    <b>
                      {getServiceInstaller(service, CONFIG)?.name ?
                        getServiceInstaller(service, CONFIG)?.name : ''}
                    </b>
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                {(getServiceInstaller(service, CONFIG)?.name &&
                  (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (

                    <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, installationTeam: true })}
                    >
                      <Iconify icon="la:user-edit" color="primary" width={22} />
                    </IconButton>

                  )}
                {(!getServiceInstaller(service, CONFIG)?.name &&
                  (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                    <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, installationTeam: true })}
                    >
                      <Iconify icon="tdesign:user-add-filled" color="warning" width={20} />
                    </IconButton>
                  )}
              </TableCell>
            </TableRow>

          )}

          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Estimated Start Date:</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                {service?.startDate ? (
                  <Typography
                    variant="subtitle2"
                    color={
                      service?.endDate
                        ? (
                          (fIsAfter(dayjs(new Date()), dayjs(service?.endDate).format('YYYY-MM-DD')) &&
                            (
                              service?.currentStage?.name.toLowerCase().includes(CONFIG.stages.preparation.toLowerCase()) ||
                              service?.currentStage?.name.toLowerCase().includes('repair')
                            )
                          )
                            ? 'error.main'
                            : 'text.primary'
                        )
                        : 'text.primary'
                    }
                    sx={{
                      fontWeight: service?.endDate ? (
                        (fIsAfter(dayjs(new Date()), dayjs(service?.endDate).format('YYYY-MM-DD')) &&
                          (
                            service?.currentStage?.name.toLowerCase().includes(CONFIG.stages.preparation.toLowerCase()) ||
                            service?.currentStage?.name.toLowerCase().includes('repair')
                          )
                        )
                          ? 'bold'
                          : 'normal'
                      ) : 'normal'
                    }}
                  >
                    {fDate(service?.startDate)} <b>({fDuration(service?.startDate, service?.endDate)})</b> <br />
                    <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
                      {service?.isPartDays ? 'Part Days' : 'Full Days'}
                    </Label>
                  </Typography>
                ) : (
                  <Iconify icon="fluent-mdl2:date-time" color="warning" width={20} sx={{ ml: 0.5, mt: 0.5 }} />
                )}

              </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
              {(service?.startDate &&
                (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                    onClick={() => {
                      setIsStartDate(true)
                      setIsInspectionDate(false)
                      setOpenDialogs({ ...openDialogs, date: true })
                    }}
                  >
                    <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                  </IconButton>
                )}
              {(!service?.startDate &&
                (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                    onClick={() => {
                      setIsStartDate(true)
                      setIsInspectionDate(false)
                      setOpenDialogs({ ...openDialogs, date: true })
                    }}
                  >
                    <Iconify icon="zondicons:date-add" color="warning" width={20} />
                  </IconButton>
                )}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell colSpan={3}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: 0, justifyContent: 'space-between', p: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1,
                    justifyContent: 'flex-start',
                    p: 0,
                    width: service?.hasToPay ? '50%' : '100%'
                  }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ width: 80 }}
                  ><b>Has to pay?</b>
                  </Typography>
                  <Iconify icon={service?.hasToPay ? 'ep:success-filled' : 'icon-park-solid:close-one'}
                    color={service?.hasToPay ? 'success.main' : 'error.main'}
                    width={20}
                  />
                  {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 1,
                        maxWidth: '30px',
                        mt: -1,
                        mb: -3
                      }}>
                      <Switch
                        checked={!!(service && selectedHasToPay)}
                        onChange={(e) => handleSwitch(e, 'hasToPay')}
                        sx={{ maxWidth: 56 }}
                      />
                    </Box>
                  )}
                </Box>
                {service?.hasToPay && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 1,
                      justifyContent: 'flex-end',
                      p: 0,
                      width: '50%'
                    }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ width: 60 }}
                    >
                      <b>Paid?</b>
                    </Typography>
                    <Iconify icon={service?.paid ? 'ep:success-filled' : 'icon-park-solid:close-one'}
                      color={service?.paid ? 'success.main' : 'error.main'}
                      width={20}
                    />
                    {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, maxWidth: '30px', mt: -1, mb: -3 }}>
                        <Switch
                          checked={!!(service && selectedPaid)}
                          onChange={(e) => handleSwitch(e, 'paid')}
                          sx={{ maxWidth: 56 }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell colSpan={3}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: 0, justifyContent: 'space-between', p: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1,
                    justifyContent: 'flex-start',
                    p: 0,
                    width: service?.byFactory ? '50%' : '100%'
                  }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ width: 80 }}
                  >
                    <b>By Factory?</b>
                  </Typography>
                  <Iconify icon={service?.byFactory ? 'ep:success-filled' : 'icon-park-solid:close-one'}
                    color={service?.byFactory ? 'success.main' : 'error.main'}
                    width={20}
                  />
                  {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, maxWidth: '30px', mt: -1, mb: -3 }}>
                      <Switch
                        checked={!!(service && selectedByFactory)}
                        onChange={(e) => handleSwitch(e, 'byFactory')}
                        sx={{ maxWidth: 56 }}
                      />
                    </Box>
                  )}
                </Box>
                {service?.byFactory && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 1,
                      justifyContent: 'flex-end',
                      p: 0,
                      width: '50%'
                    }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ width: 60 }}
                    >
                      <b>Repaired?</b>
                    </Typography>
                    <Iconify icon={service?.repaired ? 'ep:success-filled' : 'icon-park-solid:close-one'}
                      color={service?.repaired ? 'success.main' : 'error.main'}
                      width={20}
                    />
                    {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, maxWidth: '30px', mt: -1, mb: -3 }}>
                        <Switch
                          checked={!!(service && selectedRepaired)}
                          onChange={(e) => handleSwitch(e, 'repaired')}
                          sx={{ maxWidth: 56 }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

            </TableCell>
          </TableRow>

        </TableBody>

      </Table>
    </Card >
  );

  const renderDescription = (
    <Card sx={{ p: 3, gap: 1.5, display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* {service?.description?.split('&').map((line, index) => (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: 0 }} key={`box-${index}`}>
          <Typography
            key={`typo-${index}`}
            variant="caption"
            color="text.primary"
            sx={{
              mb: 0.5,
              textAlign: 'justify',
              fontWeight: index === 0 ? 'bold' : 'normal',
            }}>
            {line}
          </Typography>
        </Box>
      ))}
      {service?.salesOrder?.custom_fields?.map((field, index) => (
        field.label.length < 20 && field.value && field.value !== 'null' && field.value !== 'undefined' && field.value.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              mt: 0,
              mb: 0,
              textAlign: 'right',
              justifyContent: 'flex-start'
            }}
            key={`box-${index}`}
          >
            <Typography
              variant="subtitle2"
              color="text.primary"
              key={`typo-${index}`}
              sx={{
                maxWidth: 130,
                width: 130,
                minWidth: 130,
                textAlign: 'left',
              }}
            >
              <b>{field.label}:</b>
            </Typography>
            <Label
              variant="filled"
              sx={{
                bgcolor: field.value.toLowerCase() === 'stock' ? 'success.lighter' :
                  field.value.toLowerCase() === 'mixed' ? 'warning.lighter' : 'whitesmoke',
                color: field.value.toLowerCase() === 'stock' ? 'success.main' :
                  field.value.toLowerCase() === 'mixed' ? 'warning.main' : 'text.primary',

              }}
              key={`label-${index}`}
            >
              {field.value}
            </Label>
          </Box>
        )))} */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          mt: 0,
          mb: 0,
          textAlign: 'right',
          justifyContent: 'space-between'
        }}
        key='box-place'
      >
        <Typography
          variant="subtitle2"
          color="text.primary"
          key='typo-place'
          sx={{
            mt: 1,
            maxWidth: 130,
            width: 130,
            minWidth: 130,
            textAlign: 'left',
          }}
        >
          <b>Service Place:</b>
        </Typography>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            gap: 4,
            mt: 0,
            mb: 0,
            textAlign: 'right',
            justifyContent: 'space-between'
          }}
        >
          <Autocomplete
            disabled={!listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)}
            sx={{ width: '100%' }}
            value={selectedServicePlace || null}
            onChange={(e, newValue) => {
              setSelectedServicePlace(newValue);
            }}
            options={SERVICE_PLACE_OPTIONS}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, i) => (
              <ListItem {...props} key={`${i.id}-option`}>
                {i.name}
              </ListItem>
            )}
            renderTags={(selected, getTagProps) =>
              selected.map((p, i) => (
                <Chip
                  {...getTagProps({ i })}
                  key={p.id}
                  size="small"
                  variant="soft"
                  label={p.name}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Place"
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    height: '37px',
                    '& input': {
                      padding: '0 8px',
                      height: '37px',
                      lineHeight: '37px'
                    }
                  }
                }}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    top: '-10px',
                    transform: 'translate(14px, 0px) scale(0.75)'
                  }
                }}
              />
            )}
          />
          {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
            <Tooltip title={`Set service place to ${service?.name}`} arrow>
              <span>
                <IconButton
                  variant="text"
                  color="primary"
                  size="small"
                  sx={{ ml: 0, minWidth: 15 }}
                  disabled={!selectedServicePlace || selectedServicePlace?.id === service?.servicePlace?.id}
                  onClick={handleSetServicePlace}
                >
                  <Iconify icon="gg:check-o" color="primary" width={22} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

      </Box>
      {selectedServicePlace?.id === 1 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            mt: 0,
            mb: 0,
            textAlign: 'right',
            justifyContent: 'space-between'
          }}
          key='box-address'
        >
          <Typography
            variant="subtitle2"
            color="text.primary"
            key='typo-address'
            sx={{
              maxWidth: 130,
              width: 130,
              minWidth: 130,
              textAlign: 'left',
            }}
          >
            <b>Service Address:</b>
          </Typography>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              gap: 4,
              mt: 0,
              mb: 0,
              textAlign: 'right',
              justifyContent: 'space-between'
            }}
          >
            <Typography
              variant="caption"
              color="text.primary"
              sx={{
                mt: 0.5,
                width: '100%',
                bgcolor: 'whitesmoke',
                borderRadius: 1,
                p: 0.5,
              }}
              textAlign='left'
            >
              {service?.address || 'No address assigned'}
            </Typography>

            {(service?.servicePlace?.id === 1 && listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (

              <Tooltip title={`Change address for service ${service?.name}`} arrow>
                <IconButton variant="text" color={service?.address ? "primary" : "warning"} size="small" sx={{
                  // ml: -15, 
                  minWidth: 15,
                  mt: -0.5,
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
          </Box>
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          mt: 0,
          mb: 0,
          textAlign: 'right',
          justifyContent: listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ? 'space-between' : 'flex-start'
        }}
        key='box-type'
      >
        <Typography
          variant="subtitle2"
          color="text.primary"
          key='typo-type'
          sx={{
            maxWidth: 130,
            width: 130,
            minWidth: 130,
            textAlign: 'left',
          }}
        >
          <b>Installed By Us:</b>
        </Typography>
        {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ? (
          <RadioGroup
            name="serviceType"
            value={selectedServiceType || 'retail'}
            onChange={(e) => {
              setSelectedServiceType(e.target.value);
              handleChangeServiceType(e.target.value);
            }}
            sx={{
              width: '100%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: !isMobile ? 'row' : 'column',
                justifyContent: 'flex-start',
                // gap: !isMobile ? 5 : 1,
                mt: -1,
              }}
            >
              <FormControlLabel
                value="installed_by_us"
                control={<Radio />}
                label="YES"
              />
              <FormControlLabel
                value="retail"
                control={<Radio />}
                label="NO"
              />

            </Box>
          </RadioGroup>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              mt: 0,
              mb: 0,
              textAlign: 'left',
              justifyContent: 'flex-start'
            }}
          >
            <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: selectedServiceType === 'retail' ? 'error.main' : 'success.main' }}>
              {selectedServiceType === 'retail' ? 'NO' : 'YES'}
            </Label>
          </Box>
        )}
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        mt: 0,
        mb: 0,
        // textAlign: 'right'
      }}>
        <Typography
          variant="subtitle2"
          color="text.primary"
          key='typo-type'
          sx={{
            maxWidth: 130,
            width: 130,
            minWidth: 130,
            textAlign: 'left',
          }}
        >
          <b>Notes:</b>
        </Typography>
        <Typography
          variant="caption"
          color="text.primary"
          sx={{
            mt: 0.3,
            width: '100%',
            maxHeight: 100,
            overflowY: 'auto',
            bgcolor: 'whitesmoke',
            borderRadius: 1, p: 0.5
          }}
          textAlign='left'
        >
          {service?.serviceNotes ? service?.serviceNotes : 'No notes assigned'}
        </Typography>
        {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff)) && (

          <Tooltip title={`${service?.serviceNotes ? 'Edit' : 'Add'} notes to service ${service?.name}`} arrow>
            <IconButton variant="text" color={service?.serviceNotes ? "primary" : "warning"} size="small" sx={{
              // ml: -15, 
              minWidth: 15,
              mt: -0.5,
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: 'transparent',
              },
            }}
              onClick={() => setOpenDialogs({ ...openDialogs, editNotes: true })}
            >
              <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        mt: 0,
        mb: 0,
        // textAlign: 'right'
      }}>
        <Typography
          variant="subtitle2"
          color="text.primary"
          key='typo-type'
          sx={{
            maxWidth: 130,
            width: 130,
            minWidth: 130,
            textAlign: 'left',
          }}
        >
          <b>Attachments:</b>
        </Typography>
        <Label
          variant="filled"
          sx={{
            bgcolor: 'whitesmoke',
            color: service?.serviceAttachments?.length > 0 ? 'success.main' : 'warning.main',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'text.lighter',
              color: service?.serviceAttachments?.length > 0 ? 'success.main' : 'warning.main',
            },
          }}
          onClick={() => {
            setOpenDialogs({ ...openDialogs, editAttachments: true });
          }}
        >
          {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ? service?.serviceAttachments?.length > 0 ? 'Edit' : 'Add' : ''} Files
        </Label>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: -1, textAlign: 'right' }}>
          <Typography variant="caption" color="text.primary" sx={{ mt: 0.3 }}>
            Created:
          </Typography>
          <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
            {fDateTime(service?.createdTime)}
          </Label>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: -1, textAlign: 'right' }}>
          <Typography variant="caption" color="text.primary" sx={{ mt: 0.3 }}>
            Updated:
          </Typography>
          <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
            {fDateTime(service?.lastModifiedTime)}
          </Label>
        </Box>
      </Box>
    </Card>
  );

  const renderStages = (
    <Card sx={{ p: 1, gap: 1, display: 'flex', flexDirection: 'column' }}>
      <ServiceDetailsStageStepper stages={loadedServiceStages} currentStageId={service?.currentStage?.id} service={service} />
    </Card>
  )

  const chart = useMemo(() => ({
    title: '',
    subheader: 'Total tasks',
    series: [
      { label: 'Not Started', value: totalNotStartedTasks || 0 },
      { label: 'In Progress', value: totalInProgressTasks || 0 },
      { label: 'Completed', value: totalCompletedTasks || 0 },
    ],
    data: [
      {
        name: 'Tasks',
        totalTasks,
        totalCompletedTasks,
        icon: <Box component="img" src={`${CONFIG.assetsDir}/assets/icons/files/ic-folder.svg`} />,
      },
    ],
    type: 'pie',
  }), [totalNotStartedTasks, totalInProgressTasks, totalCompletedTasks, totalTasks]);


  const dynamicHeight = useMemo(() => {
    let height = 290

    if (!service?.userManager?.name) {
      height += 40
    }

    if (service?.usersServiceTeam?.length > 0) {
      height -= 5
    }
    if (service?.startDate) {
      height -= 15
    }
    // if (!service?.hasToPay && !service?.byFactory) {
    //   height -= 45
    // }
    // if (service?.hasToPay || service?.byFactory) {
    //   height -= 10
    // }
    return height
  }, [service]);


  const renderIssuedProducts = (
    <Card sx={{
      p: 3,
      gap: 1,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minHeight: dynamicHeight,
    }}>
      <TableContainer
        sx={{ maxHeight: 300 }}
      >
        <Table size="small" sx={{ maxHeight: 300 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell colSpan={3} width={350}>Issued Product</TableCell>
              <TableCell width={100}>Issue</TableCell>
              <TableCell width={50}>Qty</TableCell>
              <TableCell width={200}>Notes</TableCell>
              {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                <TableCell width={50}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0, justifyContent: 'space-between' }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{
                        mt: (possibleLineItems?.length > 0 || issuedProducts?.length === 0) ? 1.5 : 0,
                      }}
                    >
                      Actions
                    </Typography>
                    {(possibleLineItems?.length > 0 || issuedProducts?.length === 0) && (
                      <Tooltip title={`Add new issued product to ${service?.name}`} arrow>
                        <IconButton variant="outlined" color='success' onClick={openSalesOrderModal.onTrue} disabled={false} sx={{
                          '&:hover': {
                            boxShadow: 'none',
                            backgroundColor: 'transparent',
                          },
                        }}>
                          <Iconify icon="lets-icons:arhive-alt-small-add" sx={{ width: 30, height: 30 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {issuedProducts?.length > 0 ? (
              issuedProducts?.map((product, index1) => (
                <React.Fragment key={index1}>
                  <TableRow key={`${product.line_item_id}-${index1}`}>
                    <TableCell width={50} rowSpan={product?.issues?.length}>
                      {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                        <Tooltip title={`Add new issue to ${product.name}`} arrow>
                          <IconButton variant="outlined" color='success' onClick={() => {
                            setSelectedItem(product);
                            setOpenDialogs({ ...openDialogs, newIssue: true });
                          }} disabled={false} sx={{
                            '&:hover': {
                              boxShadow: 'none',
                              backgroundColor: 'transparent',
                            },
                          }}>
                            <Iconify icon="lets-icons:add-duotone" sx={{ width: 30, height: 30 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell width={100} rowSpan={product?.issues?.length}>
                      {filteredDescriptionJson(product?.description)?.SKU || product?.sku}
                    </TableCell>
                    <TableCell width={200} rowSpan={product?.issues?.length}>{product.name}</TableCell>
                    <TableCell width={100}>{product.issues[0].issue.name}</TableCell>
                    <TableCell width={50}>{product.issues[0].quantity}</TableCell>
                    <TableCell width={200}>{product.issues[0].notes}</TableCell>
                    {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                      <TableCell width={50}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0, justifyContent: 'space-between' }}>
                          <Tooltip title={`Edit ${product.issues[0].issue.name} quantity`} arrow>
                            <IconButton variant="text" color="warning" size="small" sx={{
                              ml: 1,
                              '&:hover': {
                                boxShadow: 'none',
                                backgroundColor: 'transparent',
                              },
                            }}
                              onClick={() => {
                                setSelectedIssue(product.issues[0]);
                                setSelectedItem(product);
                                setOpenDialogs({ ...openDialogs, editIssue: true });
                              }}
                            >
                              <Iconify icon="fluent:slide-text-edit-20-regular" color="warning" width={22} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={`Delete ${product.issues[0].issue.name}`} arrow>
                            <IconButton variant="text" color="error" size="small" sx={{
                              ml: 1,
                              '&:hover': {
                                boxShadow: 'none',
                                backgroundColor: 'transparent',
                              },
                            }}
                              onClick={() => {
                                setSelectedIssue(product.issues[0]);
                                setSelectedItem(product);
                                confirmDelete.onTrue();
                              }}
                            >
                              <Iconify icon="fluent:delete-12-filled" color="warning" width={22} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                  {product?.issues?.map((issue, index2) => (
                    index2 > 0 && (
                      <TableRow
                        key={`${product.line_item_id}-${index1}-${index2}`}
                        sx={{
                          "& > .MuiTableCell-root": {
                            borderBottom: index2 === product.issues.length - 1
                              ? (t) => `1px solid ${t.palette.divider} !important`
                              : undefined,
                          },
                        }}
                      >
                        <TableCell>{issue.issue.name}</TableCell>
                        <TableCell>{issue.quantity}</TableCell>
                        <TableCell>{issue.notes}</TableCell>
                        {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                          <TableCell width={50}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0, justifyContent: 'space-between' }}>
                              <Tooltip title={`Edit ${issue.issue.name} quantity`} arrow>
                                <IconButton variant="text" color="warning" size="small" sx={{
                                  ml: 1,
                                  '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'transparent',
                                  },
                                }}
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setSelectedItem(product);
                                    setOpenDialogs({ ...openDialogs, editIssue: true });
                                  }}
                                >
                                  <Iconify icon="fluent:slide-text-edit-20-regular" color="warning" width={22} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={`Delete ${product.issues[0].issue.name}`} arrow>
                                <IconButton variant="text" color="error" size="small" sx={{
                                  ml: 1,
                                  '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'transparent',
                                  },
                                }}
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setSelectedItem(product);
                                    confirmDelete.onTrue();
                                  }}
                                >
                                  <Iconify icon="fluent:delete-12-filled" color="warning" width={22} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    )))}
                </React.Fragment>
              ))) : (
              <TableNoData notFound colSpan={7} message="No issued products found" sx={{ maxHeight: 190 }} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );


  const renderOverview = (
    <ServiceDetailsContentComponent
      service={service}
      openDialogs={openDialogs}
      setOpenDialogs={setOpenDialogs}
      isOverview={!!service}
    />
  );

  const renderOverviewInstaller = (
    <ServiceDetailsContentOverviewInstaller
      service={service}
      openDialogs={openDialogs}
      setOpenDialogs={setOpenDialogs}
      isOverview={!!service}
      loadedUsers={loadedUsers}
    />
  );

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
      <Grid container spacing={3}>
        {/* {!isInstaller(userLogged?.data?.user_role?.name) && ( */}
        <>
          <Grid xs={12} md={8}>
            {!isInstaller(userLogged?.data?.user_role?.name) && (
              <Grid xs={12} md={12}>
                <Box sx={{ mb: 1, width: '100%', mt: -4 }}>
                  {renderStages}
                </Box>
              </Grid>
            )}
            <Grid xs={12} md={12}>
              <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 1, mb: 1, mt: -3 }}>
                {renderMainContent}
                {renderDescription}
              </Box>
            </Grid>
            <Grid xs={12} md={12}>
              <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 1, mb: 1, mt: -3, width: '100%' }}>
                {renderIssuedProducts}
              </Box>
            </Grid>

          </Grid>
          <Grid xs={12} md={4}>
            <Box sx={{ mb: 1, width: '100%', mt: -2.5, ml: -3 }}>
              {renderOverview}
            </Box>
          </Grid>
        </>
        {/* )} */}

      </Grid >
      <ServiceEditModalUserManagerView
        isEdit={service?.userManager?.name}
        serviceId={service.id}
        open={openDialogs.userManager}
        onClose={() => setOpenDialogs({ ...openDialogs, userManager: false })}
      />
      <ServiceEditModalInstallationTeamView
        isEdit={getServiceInstaller(service, CONFIG)?.name}
        service={service}
        open={openDialogs.installationTeam}
        onClose={() => setOpenDialogs({ ...openDialogs, installationTeam: false })}
      />
      <ServiceEditModalDatesView
        isEdit={isStartDate ? service?.startDate : isInspectionDate ? service?.inspectionDate : service?.endDate}
        isStartDate={isStartDate}
        isInspectionDate={isInspectionDate}
        service={service}
        refetchService={refetchService}
        open={openDialogs.date}
        onClose={() => setOpenDialogs({ ...openDialogs, date: false })}
      />
      <ServiceAddModalIssue
        service={service}
        item={selectedItem}
        open={openDialogs.newIssue}
        onClose={() => setOpenDialogs({ ...openDialogs, newIssue: false })}
      />

      <ServiceEditModalIssue
        service={service}
        item={selectedItem}
        issue={selectedIssue}
        open={openDialogs.editIssue}
        onClose={() => setOpenDialogs({ ...openDialogs, editIssue: false })}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete Issue"
        content={
          <Typography variant="body2" color="text.primary">
            Are you sure want to delete issue <b>{selectedIssue?.issue?.name}</b>  in product <b>{selectedItem?.name}</b>?
          </Typography>
        }
        action={
          <Button variant="contained" color="error" onClick={handleDeleteIssue}>
            Delete
          </Button>
        }
      />

    </>
  );
}
