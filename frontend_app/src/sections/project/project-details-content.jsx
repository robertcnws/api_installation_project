import axios from 'axios';
import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Table, Switch, Tooltip, TableRow, TableBody, TableCell, IconButton } from '@mui/material';

import { getProjectInstaller } from 'src/utils/project-tasks-utils';
import { fDate, fIsAfter, fDateTime, fDuration } from 'src/utils/format-time';
import { isInstaller, verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectDetailsChartTask } from './view/project-details-chart-task';
import { ProjectEditModalDatesView } from './view/project-edit-modal-dates-view';
import { ProjectDetailsStageStepper } from './view/project-details-stage-stepper';
import { ProjectDetailsContentOverview } from './project-details-content-overview';
import { ProjectEditModalUserManagerView } from './view/project-edit-modal-user-manager-view';
import { ProjectDetailsContentOverviewInstaller } from './project-details-content-overview-installer';
import { ProjectDetailsChartSemicircleProject } from './view/project-details-chart-semicircle-project';
import { ProjectEditModalInstallationTeamView } from './view/project-edit-modal-installation-team-view';





// ----------------------------------------------------------------------

export function ProjectDetailsContent({
  project,
  refetchProject,
  setOpenEdit,
  listPermissions,
  openDialogs,
  setOpenDialogs,
}) {

  const theme = useTheme();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const {
    loadedStages,
    loadedUsers,
  } = useDataContext();

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

  const [isStartDate, setIsStartDate] = useState(false);

  const [isInspectionDate, setIsInspectionDate] = useState(false);

  const [isFinishPermissionDate, setIsFinishPermissionDate] = useState(false);

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

  // const items = useMemo(() => project?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases'), [project]);
  const items = useMemo(() => project?.salesOrder?.line_items, [project]);

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
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
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

          {!isInstaller(userLogged?.data?.user_role?.name) && (

            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" color="text.secondary">Responsible:</Typography>
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
                {(project?.userManager?.name && (verifyPermissions(
                  listPermissions,
                  CONFIG.permissions.system,
                  CONFIG.permissions.moduleProjects,
                  CONFIG.permissions.operationEditResponsable
                ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (

                    <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, userManager: true })}
                    >
                      <Iconify icon="la:user-edit" color="primary" width={22} />
                    </IconButton>

                  )}
                {(!project?.userManager?.name && (verifyPermissions(
                  listPermissions,
                  CONFIG.permissions.system,
                  CONFIG.permissions.moduleProjects,
                  CONFIG.permissions.operationEditResponsable
                ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                    <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, userManager: true })}
                    >
                      <Iconify icon="tdesign:user-add-filled" color="warning" width={20} />
                    </IconButton>
                  )}
              </TableCell>
            </TableRow>

          )}

          {project?.userManager?.name && (

            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" color="text.secondary">Installation Team:</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                  <Avatar
                    alt={getProjectInstaller(project, CONFIG)?.name}
                    src={getProjectInstaller(project, CONFIG)?.avatarUrl}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  />
                  <Typography variant="body2" color="text.primary">
                    <b>
                      {getProjectInstaller(project, CONFIG)?.name ?
                        getProjectInstaller(project, CONFIG)?.name : ''}
                    </b>
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                {(getProjectInstaller(project, CONFIG)?.name && (verifyPermissions(
                  listPermissions,
                  CONFIG.permissions.system,
                  CONFIG.permissions.moduleProjects,
                  CONFIG.permissions.operationEditInstaller
                ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (

                    <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, installationTeam: true })}
                    >
                      <Iconify icon="la:user-edit" color="primary" width={22} />
                    </IconButton>

                  )}
                {(!getProjectInstaller(project, CONFIG)?.name && (verifyPermissions(
                  listPermissions,
                  CONFIG.permissions.system,
                  CONFIG.permissions.moduleProjects,
                  CONFIG.permissions.operationEditInstaller
                ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
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
              <Typography variant="subtitle2" color="text.secondary">Estimated Install Date:</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                {project?.startDate ? (
                  <Typography
                    variant="subtitle2"
                    color={
                      project?.endDate
                        ? (
                          (fIsAfter(dayjs(new Date()), dayjs(project?.endDate).format('YYYY-MM-DD')) &&
                            (
                              project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.preparation.toLowerCase()) ||
                              project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.coordination.toLowerCase()) ||
                              project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.installation.toLowerCase())
                            )
                          )
                            ? 'error.main'
                            : 'text.primary'
                        )
                        : 'text.primary'
                    }
                    sx={{
                      fontWeight: project?.endDate ? (
                        (fIsAfter(dayjs(new Date()), dayjs(project?.endDate).format('YYYY-MM-DD')) &&
                          (
                            project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.preparation.toLowerCase()) ||
                            project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.coordination.toLowerCase()) ||
                            project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.installation.toLowerCase())
                          )
                        )
                          ? 'bold'
                          : 'normal'
                      ) : 'normal'
                    }}
                  >
                    {fDate(project?.startDate)} <b>({fDuration(project?.startDate, project?.endDate)})</b> <br />
                    <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
                      {project?.isPartDays ? 'Part Days' : 'Full Days'}
                    </Label>
                  </Typography>
                ) : (
                  <Iconify icon="fluent-mdl2:date-time" color="warning" width={20} sx={{ ml: 0.5, mt: 0.5 }} />
                )}

              </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
              {(project?.startDate && (verifyPermissions(
                listPermissions,
                CONFIG.permissions.system,
                CONFIG.permissions.moduleProjects,
                CONFIG.permissions.operationEditInstallDate
              ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                    onClick={() => {
                      setIsStartDate(true)
                      setIsInspectionDate(false)
                      setIsFinishPermissionDate(false)
                      setOpenDialogs({ ...openDialogs, date: true })
                    }}
                  >
                    <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                  </IconButton>
                )}
              {(!project?.startDate && (verifyPermissions(
                listPermissions,
                CONFIG.permissions.system,
                CONFIG.permissions.moduleProjects,
                CONFIG.permissions.operationEditInstallDate
              ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                    onClick={() => {
                      setIsStartDate(true)
                      setIsInspectionDate(false)
                      setIsFinishPermissionDate(false)
                      setOpenDialogs({ ...openDialogs, date: true })
                    }}
                  >
                    <Iconify icon="zondicons:date-add" color="warning" width={20} />
                  </IconButton>
                )}
            </TableCell>
          </TableRow>

          {/* <TableRow>
            <TableCell>
              <Typography variant="subtitle2" color="text.secondary">Estimated Closing Date:</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                {project?.endDate ? (
                  <Typography
                    variant="subtitle2"
                    color={
                      project?.endDate
                        ? (
                          (fIsAfter(dayjs(new Date()), dayjs(project?.endDate).format('YYYY-MM-DD')) &&
                            (
                              project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.preparation.toLowerCase()) ||
                              project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.coordination.toLowerCase()) ||
                              project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.installation.toLowerCase())
                            )
                          )
                            ? 'error.main'
                            : 'text.primary'
                        )
                        : 'text.primary'
                    }
                    sx={{
                      fontWeight: project?.endDate ? (
                        (fIsAfter(dayjs(new Date()), dayjs(project?.endDate).format('YYYY-MM-DD')) &&
                          (
                            project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.preparation.toLowerCase()) ||
                            project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.coordination.toLowerCase()) ||
                            project?.currentStage?.name.toLowerCase().includes(CONFIG.stages.installation.toLowerCase())
                          )
                        )
                          ? 'bold'
                          : 'normal'
                      ) : 'normal'
                    }}
                  >
                    {fDate(project?.endDate)}
                  </Typography>
                ) : (
                  <Iconify icon="fluent-mdl2:date-time" color="warning" width={20} sx={{ ml: 0.5, mt: 0.5 }} />
                )}

              </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
              {(project?.endDate && (verifyPermissions(
                listPermissions,
                CONFIG.permissions.system,
                CONFIG.permissions.moduleProjects,
                CONFIG.permissions.operationEditClosingDate
              ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                    onClick={() => {
                      setIsStartDate(false)
                      setIsInspectionDate(false)
                      setOpenDialogs({ ...openDialogs, date: true })
                    }}
                  >
                    <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                  </IconButton>
                )}
              {(!project?.endDate && (verifyPermissions(
                listPermissions,
                CONFIG.permissions.system,
                CONFIG.permissions.moduleProjects,
                CONFIG.permissions.operationEditClosingDate
              ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                  <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                    onClick={() => {
                      setIsStartDate(false)
                      setIsInspectionDate(false)
                      setOpenDialogs({ ...openDialogs, date: true })
                    }}
                  >
                    <Iconify icon="zondicons:date-add" color="warning" width={20} />
                  </IconButton>
                )}
            </TableCell>
          </TableRow> */}



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
            {(verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleProjects,
              CONFIG.permissions.operationEditHasPermission
            ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, maxWidth: '30px', ml: -3 }}>
                    <Switch
                      checked={!!(project && selectedPermission)}
                      onChange={handleSwitch}
                      sx={{ maxWidth: 56 }}
                    />
                  </Box>
                </TableCell>
              )}
          </TableRow>

          {project?.hasPermission && (
            <>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" color="text.secondary">Inspection Date:</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                    {project?.inspectionDate ? (
                      <Typography variant="subtitle2" color="text.primary">
                        {fDate(project?.inspectionDate)}
                      </Typography>
                    ) : (
                      <Iconify icon="fluent-mdl2:date-time" color="warning" width={20} sx={{ ml: 0.5, mt: 0.5 }} />
                    )}

                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                  {(project?.inspectionDate && (verifyPermissions(
                    listPermissions,
                    CONFIG.permissions.system,
                    CONFIG.permissions.moduleProjects,
                    CONFIG.permissions.operationEditHasPermission
                  ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                      <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => {
                          setIsStartDate(false)
                          setIsInspectionDate(true)
                          setIsFinishPermissionDate(false)
                          setOpenDialogs({ ...openDialogs, date: true })
                        }}
                      >
                        <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                      </IconButton>
                    )}
                  {(!project?.inspectionDate && (verifyPermissions(
                    listPermissions,
                    CONFIG.permissions.system,
                    CONFIG.permissions.moduleProjects,
                    CONFIG.permissions.operationEditHasPermission
                  ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                      <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => {
                          setIsStartDate(false)
                          setIsInspectionDate(true)
                          setIsFinishPermissionDate(false)
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
                  <Typography variant="subtitle2" color="text.secondary">Finish Date:</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                    {project?.finishPermissionDate ? (
                      <Typography variant="subtitle2" color="text.primary">
                        {fDate(project?.finishPermissionDate)}
                      </Typography>
                    ) : (
                      <>
                        <Iconify icon="fluent-mdl2:date-time" color="warning" width={20} sx={{ ml: 0.5, mt: 0.5 }} />
                        {/* {project?.inspectionDate === null && (
                          <Typography variant="caption" color="text.primary">
                            [Need Inspection Date]
                          </Typography>
                        )} */}
                      </>
                    )}

                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                  {(project?.finishPermissionDate &&
                    (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                      <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => {
                          setIsStartDate(false)
                          setIsInspectionDate(false)
                          setIsFinishPermissionDate(true)
                          setOpenDialogs({ ...openDialogs, date: true })
                        }}
                      >
                        <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                      </IconButton>
                    )}
                  {(!project?.finishPermissionDate &&
                    (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                      <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => {
                          setIsStartDate(false)
                          setIsInspectionDate(false)
                          setIsFinishPermissionDate(true)
                          setOpenDialogs({ ...openDialogs, date: true })
                        }}
                      // disabled={!project?.inspectionDate}
                      >
                        <Iconify icon="zondicons:date-add" color="warning" width={20} />
                      </IconButton>
                    )}
                </TableCell>
              </TableRow>
            </>
          )}

        </TableBody>

      </Table>
    </Card>
  );

  const renderDescription = (
    <Card sx={{ p: 3, gap: 1.5, display: 'flex', flexDirection: 'column', width: '100%' }}>
      {project?.description?.split('&').map((line, index) => (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: 0 }} key={`box-${index}`}>
          <Typography key={index} variant="caption" color="text.primary" sx={{ mb: 0.5, textAlign: 'justify', fontWeight: index === 0 ? 'bold' : 'normal' }}>
            {line}
          </Typography>
          {(index === 0 &&
            project?.description &&
            listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
              <Tooltip title={`Change description for project ${project?.name}`} arrow>
                <IconButton variant="text" color={project?.description ? "primary" : "warning"} size="small" sx={{
                  // ml: -15, 
                  minWidth: 15,
                  mt: -1,
                  '&:hover': {
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  },
                }}
                  onClick={() => setOpenDialogs({ ...openDialogs, description: true })}
                >
                  <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
                </IconButton>
              </Tooltip>
            )}
        </Box>
      ))}
      {project?.salesOrder?.custom_fields?.map((field, index) => (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: 0, textAlign: 'right' }} key={`box-${index}`}>
          <Typography variant="subtitle2" color="text.primary" key={`typo-${index}`}>
            <b>{field.label}:</b>
          </Typography>
          <Label
            variant="filled"
            sx={{
              bgcolor: field.value.toLowerCase() === 'custom' ? 'whitesmoke' :
                field.value.toLowerCase() === 'mixed' ? 'warning.lighter' : 'success.lighter',
              color: field.value.toLowerCase() === 'custom' ? 'text.primary' :
                field.value.toLowerCase() === 'mixed' ? 'warning.main' : 'success.main'
            }}
            key={`label-${index}`}
          >
            {field.value}
          </Label>
        </Box>
      ))}
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: -1, textAlign: 'right' }}>
          <Typography variant="caption" color="text.primary" sx={{ mt: 0.3 }}>
            Created:
          </Typography>
          <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
            {fDateTime(project?.createdTime)}
          </Label>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 0, mb: -1, textAlign: 'right' }}>
          <Typography variant="caption" color="text.primary" sx={{ mt: 0.3 }}>
            Updated:
          </Typography>
          <Label variant="filled" sx={{ bgcolor: 'whitesmoke', color: 'text.primary' }}>
            {fDateTime(project?.lastModifiedTime)}
          </Label>
        </Box>
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

  const percentage = useMemo(() => {
    const total = totalNotStartedTasks + totalInProgressTasks + totalCompletedTasks;
    const sumPercentage = project?.projectDefaultTasks?.reduce((acc, task) => acc + task.percentage, 0);
    return total > 0 ? (sumPercentage / total).toFixed(2) : 0;
  }, [project?.projectDefaultTasks, totalNotStartedTasks, totalInProgressTasks, totalCompletedTasks]);

  const chartSemicircleProject = useMemo(() => ({
    title: '',
    subheader: 'Project Status',
    series: [(percentage || 0)],
    colors: percentage === 0 ? [theme.palette.error.main, theme.palette.error.light] :
      percentage > 0 && percentage < 100 ? [theme.palette.warning.main, theme.palette.warning.light] :
        [theme.palette.success.main, theme.palette.success.light],
  }), [percentage, theme]);

  const renderTaskChart = (
    // <Card sx={{ p: 1, gap: 1, display: 'flex', flexDirection: 'column' }}>
    <ProjectDetailsChartTask chart={chart} />
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
    <ProjectDetailsContentOverview
      project={project}
      listPermissions={listPermissions}
      openDialogs={openDialogs}
      setOpenDialogs={setOpenDialogs}
      isOverview={!!project}
    />
  );

  const renderOverviewInstaller = (
    <ProjectDetailsContentOverviewInstaller
      project={project}
      listPermissions={listPermissions}
      openDialogs={openDialogs}
      setOpenDialogs={setOpenDialogs}
      isOverview={!!project}
      loadedUsers={loadedUsers}
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
      <Grid container spacing={3}>
        {!isInstaller(userLogged?.data?.user_role?.name) && (
          <>
            <Grid xs={12} md={8}>
              <Grid xs={12} md={12}>
                <Box sx={{ mb: 1, width: '100%', mt: -4 }}>
                  {renderStages}
                </Box>
              </Grid>
              <Grid xs={12} md={12}>
                <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 1, mb: 1, mt: -3 }}>
                  {renderMainContent}
                  {renderDescription}
                </Box>
              </Grid>
              <Grid xs={12} md={12}>
                <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 1, mb: 1, mt: -3, width: '100%' }}>
                  {renderTaskChart}
                  {renderProjectSemicircleChart}
                </Box>
              </Grid>

            </Grid>
            <Grid xs={12} md={4}>
              <Box sx={{ mb: 1, width: '100%', mt: -2.5, ml: -3 }}>
                {renderOverview}
              </Box>
            </Grid>
          </>
        )}
        {isInstaller(userLogged?.data?.user_role?.name) && (
          <>
            <Grid xs={12} md={12}>
              {renderOverviewInstaller}
            </Grid>
            <Grid xs={12} md={12}>
              <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 2, mb: 1, mt: -1 }}>
                {renderMainContent}
                {renderDescription}
              </Box>
            </Grid>
          </>
        )}

      </Grid >
      <ProjectEditModalUserManagerView
        isEdit={project?.userManager?.name}
        projectId={project.id}
        open={openDialogs.userManager}
        onClose={() => setOpenDialogs({ ...openDialogs, userManager: false })}
      />
      <ProjectEditModalInstallationTeamView
        isEdit={getProjectInstaller(project, CONFIG)?.name}
        project={project}
        open={openDialogs.installationTeam}
        onClose={() => setOpenDialogs({ ...openDialogs, installationTeam: false })}
      />
      <ProjectEditModalDatesView
        isEdit={
          isStartDate ? project?.startDate :
            isInspectionDate ? project?.inspectionDate :
              isFinishPermissionDate ? project?.finishPermissionDate : project?.endDate
        }
        isStartDate={isStartDate}
        isInspectionDate={isInspectionDate}
        isFinishPermissionDate={isFinishPermissionDate}
        project={project}
        refetchProject={refetchProject}
        open={openDialogs.date}
        onClose={() => setOpenDialogs({ ...openDialogs, date: false })}
      />
    </>
  );
}
