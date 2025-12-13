import { useMemo, useState, useEffect, useContext, useRef } from 'react';
import { lighten, useTheme } from '@mui/material/styles';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { toast } from 'src/components/snackbar';
import { Box, Table, Button, TableRow, TableBody, TableCell, TableHead, TextField, IconButton, TableFooter, TableContainer, Tooltip, Autocomplete, Avatar } from '@mui/material';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fIsAfter } from 'src/utils/format-time';
import { listRolesAndSubroles } from 'src/utils/check-permissions';
import { generateInstallationGuideFormReport } from 'src/utils/generate-installation-guide-pdf';
import dayjs from 'dayjs';
import { useBoolean } from 'src/hooks/use-boolean';
import axios from 'axios';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ConfirmDialog } from 'src/components/custom-dialog';
import { TableNoData } from 'src/components/table';
import { getWorkOrderAssistants, getWorkOrderWorkers } from 'src/utils/project-tasks-utils';

import { ProjectEditModalNotesView } from './project-edit-modal-notes-view';
import { ProjectDetailsContentOverview } from '../project-details-content-overview';
import { ProjectEditModalWorkOrderView } from './project-edit-modal-work-order-view';
import { ProjectDetailsContentOverviewModalService } from '../project-details-content-overview-modal-service';


const MOCK_WORK_TYPES = [
  { id: 1, name: 'Installation' },
  { id: 2, name: 'Finish' },
  { id: 3, name: 'Inspection' },
  { id: 4, name: 'Service' },
  { id: 5, name: 'All' }
];

// ----------------------------------------------------------------------

export function ProjectDetailsWorkOrdersFormView({
  project,
  refetchProject,
  listPermissions,
  openDialogs,
  setOpenDialogs,
  isHidden,
}) {

  const theme = useTheme();

  const leftColRef = useRef(null);
  const [leftColHeight, setLeftColHeight] = useState(0);

  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(() => {
      setLeftColHeight(el.getBoundingClientRect().height);
    });

    ro.observe(el);
    setLeftColHeight(el.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    refetchProject?.();
  }, [refetchProject]);

  const toSortedWorkOrders = (orders = []) =>
    [...orders].sort((a, b) =>
      dayjs(b.start_date).isAfter(dayjs(a.start_date)) ? 1 : -1
    );

  const [workOrders, setWorkOrders] = useState(() =>
    toSortedWorkOrders(project?.workOrders)
  );

  useEffect(() => {
    setWorkOrders(toSortedWorkOrders(project?.workOrders));
  }, [project]);

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const openItems = useBoolean(false);

  const openNotes = useBoolean(false);

  const confirmDeleteWorkOrder = useBoolean(false);

  const confirmFinishWorkOrder = useBoolean(false);

  const [selectedWOType, setSelectedWOType] = useState({ id: 5, name: 'All' });

  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  const handleChangeWOType = (event, newValue) => {
    const woType = newValue || { id: 5, name: 'All' };
    setSelectedWOType(woType);
    if (woType.name === 'All') {
      setWorkOrders(toSortedWorkOrders(project?.workOrders));
    } else {
      setWorkOrders(toSortedWorkOrders(filterWorkOrdersByType(woType.name, project?.workOrders)));
    }
  }

  const handleOpenWorkOrder = (wo) => {
    setSelectedWorkOrder(wo);
    setOpenDialogs({ ...openDialogs, workOrder: true });
  };

  const handleDeleteWorkOrder = async (wo) => {
    try {
      await axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${project.id}/work-order/${wo.id}/`, {
        data: {
          userReporter: JSON.stringify(userLogged?.data)
        },
      });
      toast.success(`Delete ${wo.name} successfully!`);
      setWorkOrders((prev) => prev.filter((order) => order.id !== wo.id));
    }
    catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Delete work order failed!');
    }
  };

  const handleFinishWorkOrder = async (wo) => {
    const title = wo.is_finished ? 'Reopen' : 'Finish';
    try {
      await axios.post(`${CONFIG.apiUrl}/projects/finish/project/${project.id}/work-order/${wo.id}/`, {
        userReporter: JSON.stringify(userLogged?.data)
      });
      refetchProject?.();
      toast.success(`${title} ${wo.name} successfully!`);
      // setWorkOrders((prev) => prev.filter((order) => order.id !== wo.id));
    }
    catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || `${title} work order failed!`);
    }
  };

  const colorToWOType = (woTypeName) => {
    switch (woTypeName?.toLowerCase()) {
      case 'installation':
        return 'info';
      case 'finish':
        return 'success';
      case 'inspection':
        return 'warning';
      case 'service':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const renderContent = (
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', maxHeight: !isMobile ? 655 : 'auto', minHeight: !isMobile ? 655 : 'auto', overflow: 'auto' }}>

      {[
        {
          label: (
            <Stack spacing={1} direction="row">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'row', width: '100%' }}>
                  <Typography variant='subtitle2'>Work Orders</Typography>
                  <Tooltip title="Add Work Order" arrow>
                    <IconButton variant="text" color="primary" size="small" sx={{
                      // ml: -15, 
                      minWidth: 15,
                      mt: -1,
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                      },
                    }}
                      onClick={() => setOpenDialogs({ ...openDialogs, workOrder: true })}
                    >
                      <Iconify icon="icons8:plus" color="primary" width={25} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'row', width: '100%', gap: 2 }}>
                  <Autocomplete
                    size="small"
                    options={MOCK_WORK_TYPES}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    defaultValue={MOCK_WORK_TYPES[4]}
                    sx={{ width: '100%', mt: -1 }}
                    onChange={handleChangeWOType}
                    renderInput={(params) => <TextField {...params} label="Filter WO Type" />}
                  />
                </Box>
              </Box>
            </Stack>
          ),
          value: (
            <>
              <Stack spacing={1} direction="column">
                <TableContainer>
                  <Table dense="true">
                    <TableHead>
                      <TableRow>
                        {!isMobile ? (
                          <>
                            <TableCell>Info</TableCell>
                            <TableCell>WO Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Date & Duration</TableCell>
                            {/* <TableCell>Stage</TableCell> */}
                            <TableCell>Assignee(s)</TableCell>
                            <TableCell>Product(s)</TableCell>
                            <TableCell />
                          </>
                        ) : (
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Typography sx={{ mt: 0 }}>Work Orders</Typography>
                            </Box>
                          </TableCell>
                        )}
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workOrders.length === 0 && (
                        <TableNoData notFound />
                      )}
                      {workOrders.map((order, index) => (
                        <TableRow
                          key={`item-${order?.id}`}
                          sx={{ bgcolor: order?.is_finished ? lighten(theme.palette.error.lighter, 0.6) : 'inherit' }}
                        >
                          {!isMobile ? (
                            <>
                              <TableCell
                                sx={{ width: 350, cursor: 'pointer' }}
                                onClick={() => handleOpenWorkOrder(order)}
                              >
                                <Typography
                                  variant="body2"
                                >
                                  {order?.name || 'N/A'}

                                  {order?.is_finished && (
                                    <Label
                                      component="span"
                                      color="success"
                                      size="small"
                                      sx={{
                                        textTransform: 'uppercase',
                                        ml: 0.5,
                                        px: 0.4,
                                        py: 0,
                                        fontSize: '0.6rem',
                                        height: 16,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.25,
                                      }}
                                    >
                                      <Iconify icon="fluent-mdl2:completed" width={13} />
                                    </Label>
                                  )}
                                </Typography>
                              </TableCell>


                              <TableCell sx={{ width: 150, cursor: 'pointer' }} onClick={() => handleOpenWorkOrder(order)}>
                                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                  <Typography variant="body2">
                                    <Label
                                      color={colorToWOType(order?.work_type?.name)}
                                      sx={{
                                        bgcolor: `${colorToWOType(order?.work_type?.name)}.lighter`,
                                        textTransform: 'capitalize'
                                      }}
                                    >
                                      {order?.work_type?.name || 'N/A'}
                                    </Label>
                                  </Typography>
                                  {order?.work_type?.name?.toLowerCase() === 'inspection' && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {order?.inspection_type?.name || 'N/A'}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ width: 50 }}>
                                {order?.description ? (
                                  <Label
                                    color="warning"
                                    sx={{
                                      cursor: 'pointer',
                                      bgcolor: 'transparent',
                                      fontSize: 14
                                    }}
                                    onClick={() => {
                                      setSelectedWorkOrder(order);
                                      openNotes.onTrue();
                                    }}>
                                    See Description
                                  </Label>
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell sx={{ width: 200, cursor: 'pointer' }} onClick={() => handleOpenWorkOrder(order)}>
                                <Box display="flex" flexDirection="column">
                                  <Typography variant="body2">
                                    {fDate(order?.start_date) || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Duration: {order?.duration || 'N/A'} days
                                  </Typography>
                                </Box>
                              </TableCell>
                              {/* <TableCell sx={{ width: 100 }}>
                                <Typography variant="body2">
                                  {order?.project_stage?.name || 'N/A'}
                                </Typography>
                              </TableCell> */}
                              <TableCell sx={{ width: 200, cursor: 'pointer' }} onClick={() => handleOpenWorkOrder(order)}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', gap: 0 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                                      Installer(s):
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      {getWorkOrderWorkers(order).map((worker) => (
                                        <Label key={worker.id}>
                                          {worker.firstName || worker.first_name} {worker.lastName || worker.last_name}
                                        </Label>
                                      ))}
                                    </Box>
                                  </Box>
                                  {getWorkOrderAssistants(order).length > 0 && (
                                    <Box sx={{ display: 'flex', mt: 1, justifyContent: 'flex-start' }}>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                                        Assistant(s):
                                      </Typography>

                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {getWorkOrderAssistants(order).map((worker, index2) => (
                                          <Label key={`${worker.id}-${index2}`}>
                                            {worker.name}
                                          </Label>
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ width: 100 }}>
                                <Label
                                  color={order?.items?.length > 0 ? 'success' : 'default'}
                                  sx={{
                                    cursor: order?.items?.length > 0 ? 'pointer' : 'default',
                                    bgcolor: 'transparent',
                                    fontSize: 14
                                  }}
                                  onClick={() => {
                                    if (order?.items?.length > 0) {
                                      setSelectedWorkOrder(order);
                                      openItems.onTrue();
                                    }
                                  }}>
                                  {order?.items?.length > 0 ? `${order?.items?.length} Item(s)` : 'No Items'}
                                </Label>
                              </TableCell>
                            </>
                          ) : (
                            <TableCell align="left">
                              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Info: </Typography>
                                <Label color="default" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {order.name || 'N/A'}
                                </Label>
                                <br />
                                <Typography variant="h6">Description: </Typography>
                                {order?.description ? (
                                  <Label color="warning" sx={{ cursor: 'pointer' }} onClick={() => {
                                    setSelectedWorkOrder(order);
                                    openNotes.onTrue();
                                  }}>
                                    See Description
                                  </Label>
                                ) : 'N/A'}
                                <br />
                                <Typography variant="h6">Date: </Typography>
                                <Label color="default" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {fDate(order.start_date) || 'N/A'}
                                </Label>
                                <br />
                                <Typography variant="h6">Duration: </Typography>
                                <Label color="default" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {order.duration || 'N/A'}
                                </Label>
                                <br />
                                {/* <Typography variant="h6">Stage: </Typography>
                                <Label color="success" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {order.project_stage?.name || 'N/A'}
                                </Label>
                                <br /> */}
                                <Typography variant="h6">Assignee(s): </Typography>
                                {order.users_assignees?.length > 0 ? order.users_assignees.map((assignee) => (
                                  <Label key={assignee.id} color="default" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                    {`${assignee.firstName} ${assignee.lastName}`}
                                  </Label>
                                )) : 'N/A'}
                                <br />
                                <Typography variant="h6">Product(s): </Typography>
                                {order?.items?.length > 0 ? (
                                  <Label color="success" sx={{ cursor: 'pointer' }} onClick={() => {
                                    setSelectedWorkOrder(order);
                                    openItems.onTrue();
                                  }}>
                                    {order?.items?.length > 0 ? `${order?.items?.length} Item(s)` : 'No Items'}
                                  </Label>
                                ) : 'N/A'}
                              </Box>
                            </TableCell>
                          )}

                          <TableCell sx={{ verticalAlign: !isMobile ? 'none' : 'bottom' }} align="left">
                            <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', justifyContent: 'flex-end', gap: -1 }}>
                              {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                                <Box display="flex" flexDirection="row" alignItems="center">
                                  <Tooltip title={`Edit Work Order ${order?.name}`} arrow>
                                    <IconButton
                                      variant="outlined"
                                      color='default'
                                      onClick={() => handleOpenWorkOrder(order)}
                                      sx={{
                                        '&:hover': {
                                          boxShadow: 'none',
                                          backgroundColor: 'transparent',
                                        },
                                      }}>
                                      <Iconify icon="mdi:edit-circle-outline" sx={{ width: 27, height: 27 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip
                                    title={order?.is_finished ? `Reopen Work Order ${order?.name}` : `Finish Work Order ${order?.name}`}
                                    arrow
                                  >
                                    <IconButton
                                      variant="outlined"
                                      color={order?.is_finished ? 'secondary' : 'success'}
                                      onClick={() => {
                                        setSelectedWorkOrder(order);
                                        confirmFinishWorkOrder.onTrue();
                                      }}
                                      sx={{
                                        '&:hover': {
                                          boxShadow: 'none',
                                          backgroundColor: 'transparent',
                                        },
                                      }}>
                                      <Iconify
                                        icon={order?.is_finished ? "octicon:issue-reopened-16" : "fluent-mdl2:completed"}
                                        sx={{ width: 22, height: 22 }}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={`Delete Work Order ${order?.name}`} arrow>
                                    <IconButton
                                      variant="outlined"
                                      color='warning'
                                      onClick={() => {
                                        setSelectedWorkOrder(order);
                                        confirmDeleteWorkOrder.onTrue();
                                      }}
                                      sx={{
                                        '&:hover': {
                                          boxShadow: 'none',
                                          backgroundColor: 'transparent',
                                        },
                                      }}>
                                      <Iconify icon="lsicon:minus-outline" sx={{ width: 25, height: 25 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}

                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
              <br />
              <br />
            </>
          ),
          icon: <Iconify icon="fa7-solid:list-1-2" />,
        },
      ].map((item, index) => (
        <Stack key={`${index}-${item.label}`} spacing={1.5} direction="row">
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
          </Box>
        </Stack>
      ))}
    </Card >
  );

  const renderOverview = (
    <ProjectDetailsContentOverview
      project={project}
      listPermissions={listPermissions}
      openDialogs={openDialogs}
      setOpenDialogs={setOpenDialogs}
      isHidden={isHidden.value}
      onToggleHidden={isHidden.onToggle}
      maxHeight={leftColHeight}
    />
  );

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
      <Grid container spacing={2}>
        <Grid xs={12} md={isHidden.value ? 11 : 8} sx={{ display: 'flex' }}>
          <Box
            ref={leftColRef}
            sx={{
              alignSelf: 'flex-start',
              width: '100%',     // ✅ para que no se encoja
              minWidth: 0,       // ✅ evita overflow raro
            }}
          >
            {renderContent}
          </Box>
        </Grid>
        <Grid xs={12} md={isHidden.value ? 1 : 4} sx={{ display: 'flex' }}>
          <Box
            sx={{
              mb: 0,
              width: '100%',
              mt: 0,
              ml: 0,
              display: 'flex',
              height: '100%',      // ✅ importante
              minHeight: 0,        // ✅ importante para que overflow funcione
            }}
          >
            {renderOverview}
          </Box>
        </Grid>
      </Grid >
      <ProjectEditModalWorkOrderView
        open={openDialogs.workOrder}
        onClose={() => setOpenDialogs({ ...openDialogs, workOrder: false })}
        workOrder={selectedWorkOrder}
        setWorkerOrder={setSelectedWorkOrder}
        project={project}
        refetchProject={refetchProject}
      />
      <ProjectDetailsContentOverviewModalService
        project={project}
        items={selectedWorkOrder?.items || []}
        open={openItems.value}
        onClose={openItems.onFalse}
        title="Work Order Products"
        subtitle={`List of products associated with this work order ${selectedWorkOrder?.name} for sales order ${project?.name}`}
        iconTitle="mdi:package-variant-closed"
        isLong
      />
      <ProjectEditModalNotesView
        open={openNotes.value}
        onClose={openNotes.onFalse}
        item={selectedWorkOrder}
        type="Work Order"
      />
      <ConfirmDialog
        open={confirmDeleteWorkOrder.value}
        onClose={() => {
          confirmDeleteWorkOrder.onFalse();
        }}
        title={`Delete Work Order ${selectedWorkOrder?.name}`}
        maxWidth="xs"
        content={
          `Are you sure you want to delete the work order ${selectedWorkOrder?.name}? This action cannot be undone.`
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              await handleDeleteWorkOrder(selectedWorkOrder);
              confirmDeleteWorkOrder.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
      <ConfirmDialog
        open={confirmFinishWorkOrder.value}
        onClose={() => {
          confirmFinishWorkOrder.onFalse();
        }}
        title={`${selectedWorkOrder?.is_finished ? 'Reopen' : 'Finish'} Work Order ${selectedWorkOrder?.name}`}
        maxWidth="xs"
        content={
          `Are you sure you want to ${selectedWorkOrder?.is_finished ? 'reopen' : 'finish'} the work order ${selectedWorkOrder?.name}?`
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              await handleFinishWorkOrder(selectedWorkOrder);
              confirmFinishWorkOrder.onFalse();
            }}
          >
            {selectedWorkOrder?.is_finished ? 'Reopen' : 'Finish'}
          </Button>
        }
      />
    </>
  );
}

function filterWorkOrdersByType(type, workOrders = []) {
  if (!type) return workOrders;
  if (type.toLowerCase() === 'all') return workOrders;
  return workOrders.filter((wo) => wo.work_type?.name?.toLowerCase() === type?.toLowerCase());
}
