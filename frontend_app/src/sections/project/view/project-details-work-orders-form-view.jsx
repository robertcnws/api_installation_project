import { useMemo, useState, useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { toast } from 'src/components/snackbar';
import { Box, Table, Button, TableRow, TableBody, TableCell, TableHead, TextField, IconButton, TableFooter, TableContainer, Tooltip } from '@mui/material';

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

import { ProjectEditModalNotesView } from './project-edit-modal-notes-view';
import { ProjectDetailsContentOverview } from '../project-details-content-overview';
import { ProjectEditModalWorkOrderView } from './project-edit-modal-work-order-view';
import { ProjectDetailsContentOverviewModalService } from '../project-details-content-overview-modal-service';

// ----------------------------------------------------------------------

export function ProjectDetailsWorkOrdersFormView({
  project,
  refetchProject,
  listPermissions,
  openDialogs,
  setOpenDialogs,
}) {

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

  const confirmDeleteWorkOrder = useBoolean(false);

  const confirmFinishWorkOrder = useBoolean(false);

  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  const handleOpenNotes = () => { };

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
    try {
      await axios.post(`${CONFIG.apiUrl}/projects/finish/project/${project.id}/work-order/${wo.id}/`, {
          userReporter: JSON.stringify(userLogged?.data)
      });
      toast.success(`Finish ${wo.name} successfully!`);
      setWorkOrders((prev) => prev.filter((order) => order.id !== wo.id));
    }
    catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Finish work order failed!');
    }
  };

  const renderContent = (
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', maxHeight: !isMobile ? 655 : 'auto', minHeight: !isMobile ? 655 : 'auto', overflow: 'auto' }}>

      {[
        {
          label: (
            <Stack spacing={1} direction="row">
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
                            <TableCell>Description</TableCell>
                            <TableCell>Date & Duration</TableCell>
                            <TableCell>Stage</TableCell>
                            <TableCell>Assignee</TableCell>
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
                      {workOrders.map((order, index) => (
                        <TableRow key={`item-${order?.id}`}>
                          {!isMobile ? (
                            <>
                              <TableCell sx={{ width: 150 }}>
                                <Typography variant="body2">{order?.name || 'N/A'}</Typography>
                              </TableCell>
                              <TableCell sx={{ width: 50 }}>
                                {order?.description ? (
                                  <Label color="warning" sx={{ cursor: 'pointer' }} onClick={() => {
                                    handleOpenNotes(order)
                                  }}>
                                    See Description
                                  </Label>
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell sx={{ width: 200 }}>
                                <Box display="flex" flexDirection="column">
                                  <Typography variant="body2">
                                    {fDate(order?.start_date) || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Duration: {order?.duration || 'N/A'} days
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ width: 100 }}>
                                <Typography variant="body2">
                                  {order?.project_stage?.name || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ width: 200 }}>
                                <Typography variant="body2">
                                  {`${order?.user_assignee?.firstName} ${order?.user_assignee?.lastName}` || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ width: 100 }}>
                                <Label color={order?.items?.length > 0 ? 'success' : 'default'} sx={{ cursor: order?.items?.length > 0 ? 'pointer' : 'default' }} onClick={() => {
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
                                    handleOpenNotes(order)
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
                                <Typography variant="h6">Stage: </Typography>
                                <Label color="success" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {order.project_stage?.name || 'N/A'}
                                </Label>
                                <br />
                                <Typography variant="h6">Assignee: </Typography>
                                <Label color="success" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {order.user_assignee?.firstName || 'N/A'}
                                </Label>
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
                                  <Tooltip title={`Finish Work Order ${order?.name}`} arrow>
                                    <IconButton
                                      variant="outlined"
                                      color='success'
                                      onClick={() => handleOpenWorkOrder(order)}
                                      sx={{
                                        '&:hover': {
                                          boxShadow: 'none',
                                          backgroundColor: 'transparent',
                                        },
                                      }}>
                                      <Iconify icon="fluent-mdl2:completed" sx={{ width: 22, height: 22 }} />
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
        <Grid xs={12} md={8}>
          {renderContent}
        </Grid>
        <Grid xs={12} md={4}>
          {renderOverview}
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
        open={confirmFinishorkOrder.value}
        onClose={() => {
          confirmFinishWorkOrder.onFalse();
        }}
        title={`Finish Work Order ${selectedWorkOrder?.name}`}
        maxWidth="xs"
        content={
          `Are you sure you want to finish the work order ${selectedWorkOrder?.name}?`
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
    </>
  );
}
