import axios from 'axios';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, Table, Switch, ListItem, TableRow, TableBody, TableCell, TextField, IconButton } from '@mui/material';

import { fDate, fDateTime } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectDetailsChartTask } from './view/project-details-chart-task';
import { ProjectEditModalDatesView } from './view/project-edit-modal-dates-view';
import { ProjectDetailsStageStepper } from './view/project-details-stage-stepper';
import { ProjectDetailsChartProject } from './view/project-details-chart-project';
import { ProjectEditModalAddressView } from './view/project-edit-modal-address-view';
import { ProjectEditModalUserManagerView } from './view/project-edit-modal-user-manager-view';
import { ProjectDetailsChartSemicircleProject } from './view/project-details-chart-semicircle-project';


// ----------------------------------------------------------------------

export function ProjectDetailsContent({ project, refetchProject, setOpenEdit }) {

  const theme = useTheme();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const { loadedStages } = useDataContext();

  const [totalTasks, setTotalTasks] = useState(0);
  const [totalInProgressTasks, setTotalInProgressTasks] = useState(0);
  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0);
  const [totalNotStartedTasks, setTotalNotStartedTasks] = useState(0);

  const [selectedPermission, setSelectedPermission] = useState(false);

  useEffect(() => {
    if (project) {
      setSelectedPermission(project?.hasPermission);
    }
  }, [project]);

  const [openDialogs, setOpenDialogs] = useState({
    userManager: false,
    date: false,
    address: false,
  });

  const [isStartDate, setIsStartDate] = useState(false);

  useEffect(() => {
    if (project) {
      setTotalTasks(
        project?.hasPermission ? project?.projectDefaultTasks?.length :
          project?.projectDefaultTasks?.filter((task) => task.project_default_task.project_stage.name !== CONFIG.stages.permission).length
      );
      setTotalInProgressTasks(
        project?.hasPermission ? project?.projectDefaultTasks?.filter((task) => task.status === 'in progress').length :
          project?.projectDefaultTasks?.filter((task) => task.status === 'in progress' && task.project_default_task.project_stage.name !== CONFIG.stages.permission).length
      );
      setTotalCompletedTasks(
        project?.hasPermission ? project?.projectDefaultTasks?.filter((task) => task.status === 'finished').length :
          project?.projectDefaultTasks?.filter((task) => task.status === 'finished' && task.project_default_task.project_stage.name !== CONFIG.stages.permission).length
      );
      setTotalNotStartedTasks(
        project?.hasPermission ? project?.projectDefaultTasks?.filter((task) => task.status === CONFIG.taskStatus.notStarted).length :
          project?.projectDefaultTasks?.filter((task) => task.status === CONFIG.taskStatus.notStarted && task.project_default_task.project_stage.name !== CONFIG.stages.permission).length
      );
    }
  }, [project]);

  const handleChangePermission = useCallback(async (newPermission) => {
    const formData = new FormData();
    formData.append('userReporter', JSON.stringify(userLogged?.data));
    formData.append('hasPermission', newPermission);

    const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project?.id}/change-permission/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    try {
      toast.promise(promise, {
        loading: 'Loading...',
        success: `Update Project (${project.name}) success!`,
        error: `Update Project (${project.name}) error!`,
      });

      const response = await promise;

      if (!response.data) {
        return;
      }

      refetchProject?.();

    } catch (error) {
      console.error(error);
    }
  }, [refetchProject, userLogged, project]);
  

  const handleSwitch = (event) => {
    const newVal = event.target.checked;
    setSelectedPermission(newVal);
    handleChangePermission(newVal);
  }

  const renderMainContent = (
    <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Number:</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" color="text.primary"><b>{project?.number}</b></Typography>
            </TableCell>
            <TableCell />
          </TableRow>

          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Responsable:</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                <Avatar alt={project?.userManager?.name} src={project?.userManager?.avatarUrl} sx={{ width: 24, height: 24, mr: 1 }} />
                <Typography variant="body2" color="text.primary">
                  <b>{project?.userManager?.name ? project?.userManager?.name : ''}</b>
                </Typography>
              </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
              {project?.userManager?.name && (

                <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                  onClick={() => setOpenDialogs({ ...openDialogs, userManager: true })}
                >
                  <Iconify icon="la:user-edit" color="primary" width={22} />
                </IconButton>

              )}
              {!project?.userManager?.name && (
                <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                  onClick={() => setOpenDialogs({ ...openDialogs, userManager: true })}
                >
                  <Iconify icon="tdesign:user-add-filled" color="warning" width={20} />
                </IconButton>
              )}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Estimated Install Date:</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                {project?.startDate ? (
                  <Typography variant="subtitle2" color="text.primary">
                    {fDate(project?.startDate)}
                  </Typography>
                ) : (
                  <Iconify icon="fluent-mdl2:date-time" color="warning" width={20} sx={{ ml: 0.5, mt: 0.5 }} />
                )}

              </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
              {project?.startDate && (
                <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                  onClick={() => {
                    setIsStartDate(true)
                    setOpenDialogs({ ...openDialogs, date: true })
                  }}
                >
                  <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                </IconButton>
              )}
              {!project?.startDate && (
                <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                  onClick={() => {
                    setIsStartDate(true)
                    setOpenDialogs({ ...openDialogs, date: true })
                  }}
                >
                  <Iconify icon="zondicons:date-add" color="warning" width={20} />
                </IconButton>
              )}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Estimated Closing Date:</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                {project?.endDate ? (
                  <Typography variant="subtitle2" color="text.primary">
                    {fDate(project?.endDate)}
                  </Typography>
                ) : (
                  <Iconify icon="fluent-mdl2:date-time" color="warning" width={20} sx={{ ml: 0.5, mt: 0.5 }} />
                )}

              </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
              {project?.endDate && (
                <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                  onClick={() => {
                    setIsStartDate(false)
                    setOpenDialogs({ ...openDialogs, date: true })
                  }}
                >
                  <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                </IconButton>
              )}
              {!project?.endDate && (
                <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                  onClick={() => {
                    setIsStartDate(false)
                    setOpenDialogs({ ...openDialogs, date: true })
                  }}
                >
                  <Iconify icon="zondicons:date-add" color="warning" width={20} />
                </IconButton>
              )}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Has Permission?</Typography>
            </TableCell>
            <TableCell>
              {/* <Label variant="filled" color={project?.hasPermission ? 'success' : 'error'}>{project?.hasPermission ? 'Yes' : 'No'}</Label> */}
              <Iconify icon={project?.hasPermission ? 'iconamoon:shield-yes-fill' : 'iconamoon:shield-no-fill'}
                color={project?.hasPermission ? 'success.main' : 'error.main'}
                width={30}
              />
            </TableCell>
            <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, maxWidth: '30px', ml: -3 }}>
                {/* <Controller
                  name="hasPermission"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={project?.hasPermission}
                      onChange={(event) => {
                        setSelectedPermission(event.target.checked);
                        handleChangePermission();
                      }}
                      sx={{ maxWidth: 56 }} />
                  )}
                /> */}
                <Switch
                  checked={!!(project && selectedPermission)}
                  onChange={handleSwitch}
                  sx={{ maxWidth: 56 }}
                />
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>

      </Table>
    </Card>
  );

  const renderDescription = (
    <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <TextField label="Description" multiline rows={3} value={project?.description} variant="outlined" fullWidth disabled />
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: -1, textAlign: 'right' }}>
        <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
          Created At:
        </Label>
        <Typography variant="subtitle2" color="text.primary">{fDateTime(project?.createdTime)}</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: -1, textAlign: 'right' }}>
        <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
          Updated At:
        </Label>
        <Typography variant="subtitle2" color="text.primary">{fDateTime(project?.lastModifiedTime)}</Typography>
      </Box>
    </Card>
  );

  const renderStages = (
    <Card sx={{ p: 1, gap: 1, display: 'flex', flexDirection: 'column' }}>
      <ProjectDetailsStageStepper stages={loadedStages} currentStageId={project?.currentStage?.id} project={project} />
    </Card>
  )

  const chart = useMemo(() => ({
    title: '',
    subheader: 'Total tasks',
    series: [
      { label: 'Not Started', value: totalNotStartedTasks },
      { label: 'In Progress', value: totalInProgressTasks },
      { label: 'Completed', value: totalCompletedTasks },
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

  const percentage = useMemo(() => {
    const total = totalNotStartedTasks + totalInProgressTasks + totalCompletedTasks;
    const sumPercentage = project?.projectDefaultTasks?.reduce((acc, task) => acc + task.percentage, 0);
    return total > 0 ? (sumPercentage / total).toFixed(2) : 0;
  }, [project?.projectDefaultTasks, totalNotStartedTasks, totalInProgressTasks, totalCompletedTasks]);

  const chartProject = useMemo(() => ({
    title: '',
    subheader: 'Project Status',
    series: [
      { label: '% Advance', value: percentage },
      { label: '% Not started', value: 100 - percentage },
    ],
  }), [percentage]);

  const chartSemicircleProject = useMemo(() => ({
    title: '',
    subheader: 'Project Status',
    series: [percentage],
    colors: percentage === 0 ? [theme.palette.error.main, theme.palette.error.light] :
      percentage > 0 && percentage < 50 ? [theme.palette.warning.main, theme.palette.warning.light] :
        percentage >= 50 && percentage < 100 ? [theme.palette.info.main, theme.palette.info.light] :
          [theme.palette.success.main, theme.palette.success.light],
  }), [percentage, theme]);

  const renderTaskChart = (
    // <Card sx={{ p: 1, gap: 1, display: 'flex', flexDirection: 'column' }}>
    <ProjectDetailsChartTask chart={chart} />
    // </Card>
  )

  const renderProjectChart = (
    // <Card sx={{ p: 1, gap: 1, display: 'flex', flexDirection: 'column' }}>
    <ProjectDetailsChartProject chart={chartProject} />
    // </Card>
  )

  const renderProjectSemicircleChart = (
    <ProjectDetailsChartSemicircleProject
      total={100}
      chart={chartSemicircleProject}
      data={[
        {
          name: 'Project',
          usedStorage: '50%',
          totalTasks,
          totalCompletedTasks,
          icon: <Box component="img" src={`${CONFIG.assetsDir}/assets/icons/files/ic-folder.svg`} />,
        },

      ]}
    />
  );

  const renderOverview = (
    <Card sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', maxHeight: !isMobile ? 655 : 'auto', minHeight: !isMobile ? 655 : 'auto', overflow: 'auto' }}>
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
          label: 'Date',
          value: fDate(project?.salesOrder?.date),
          icon: <Iconify icon="solar:calendar-date-bold" />,
        },
        {
          label: `${project?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases').length} Product(s), 
          Total Qty: ${project?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases').reduce((total, product) => total + product.quantity, 0)}`,
          value: (
            <>
              {project?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases').map((product) => (
                <ListItem key={product.line_item_id}>
                  <ListItemText
                    primary={product.name}
                    secondary={`Qty: ${product.quantity}`}
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
            </>
          ),
          icon: <Iconify icon="fluent-mdl2:product-list" />,
        },
        // {
        //   label: 'Employment type',
        //   value: job?.employmentTypes,
        //   icon: <Iconify icon="solar:clock-circle-bold" />,
        // },
        // {
        //   label: 'Offered salary',
        //   value: job?.salary.negotiable ? 'Negotiable' : fCurrency(job?.salary.price),
        //   icon: <Iconify icon="solar:wad-of-money-bold" />,
        // },
        // {
        //   label: 'Experience',
        //   value: job?.experience,
        //   icon: <Iconify icon="carbon:skill-level-basic" />,
        // },
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
            {item.label === 'Address' && (
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
  );

  // const renderCompany = (
  //   <Paper variant="outlined" sx={{ p: 3, mt: 3, gap: 2, borderRadius: 2, display: 'flex' }}>
  //     <Avatar
  //       alt={job?.company.name}
  //       src={job?.company.logo}
  //       variant="rounded"
  //       sx={{ width: 64, height: 64 }}
  //     />

  //     <Stack spacing={1}>
  //       <Typography variant="subtitle1">{job?.company.name}</Typography>
  //       <Typography variant="body2">{job?.company.fullAddress}</Typography>
  //       <Typography variant="body2">{job?.company.phoneNumber}</Typography>
  //     </Stack>
  //   </Paper>
  // );

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
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Grid xs={12} md={12}>
            <Box sx={{ mb: 3, width: '100%' }}>
              {renderStages}
            </Box>
          </Grid>
          <Grid xs={12} md={12}>
            <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 3, mb: 3 }}>
              {renderMainContent}
              {renderDescription}
            </Box>
          </Grid>
          <Grid xs={12} md={12}>
            <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 3, mb: 3, width: '100%' }}>
              {renderTaskChart}
              {/* {renderProjectChart} */}
              {renderProjectSemicircleChart}
            </Box>
          </Grid>

        </Grid>

        <Grid xs={12} md={4}>
          {renderOverview}

          {/* {renderCompany} */}
        </Grid>

      </Grid>
      <ProjectEditModalUserManagerView
        isEdit={project?.userManager?.name}
        projectId={project.id}
        open={openDialogs.userManager}
        onClose={() => setOpenDialogs({ ...openDialogs, userManager: false })}
      />
      <ProjectEditModalDatesView
        isEdit={isStartDate ? project?.startDate : project?.endDate}
        isStartDate={isStartDate}
        projectId={project.id}
        open={openDialogs.date}
        onClose={() => setOpenDialogs({ ...openDialogs, date: false })}
      />
      <ProjectEditModalAddressView
        isEdit={project?.address}
        projectId={project.id}
        open={openDialogs.address}
        onClose={() => setOpenDialogs({ ...openDialogs, address: false })}
      />
    </>
  );
}
