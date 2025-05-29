import axios from 'axios';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

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
import { verifyPermissions, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectShareDialog } from './project-share-dialog';
import { ServiceNewFormFromProject } from '../service/service-new-form-from-project';


// ----------------------------------------------------------------------

export function ProjectDetailsToolbar({
  project,
  tabs,
  backLink,
  editLink,
  openEdit,
  setOpenEdit,
  type,
  onDelete,
  onGenerateMeasurements,
  refetchProject,
  listPermissions,
  sx,
  ...other
}) {

  const {
    loadedUsers,
    loadedProjectPermissions,
    loadedMeasurements,
    refetchMeasurements,
    loadedServices,
  } = useDataContext();

  const share = useBoolean();

  const confirmDelete = useBoolean();

  const confirmGenerateMeasurements = useBoolean();

  const confirmGenerateService = useBoolean();

  const [openModalNewService, setOpenModalNewService] = useState(false);

  const popoverInstallationList = usePopover();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const cleanLoadedUsers = useMemo(() => loadedUsers.map(({ __typename, ...rest }) => rest), [loadedUsers]);

  const filteredUsers = useMemo(() => cleanLoadedUsers.filter(user => user.id !== project?.userManager?.id), [cleanLoadedUsers, project]);

  const [associatedMeasurement, setAssociatedMeasurement] = useState(loadedMeasurements?.find(measurement => measurement.project?.id === project?.id) || null);

  const [associatedServices, setAssociatedServices] = useState(
    loadedServices?.filter(service => service.salesOrder?.salesorder_id === project?.salesOrder?.salesorder_id) || null
  );

  const router = useRouter();

  const [installationFilteredList, setInstallationFilteredList] = useState([]);

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('installationFilteredList');
    if (raw) {
      try {
        setInstallationFilteredList(JSON.parse(raw));
      } catch (e) {
        console.error('Error parseando installationFilteredList desde localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (loadedMeasurements && loadedMeasurements?.length > 0) {
      const measurement = loadedMeasurements?.find(m => m.project?.id === project?.id);
      if (measurement && measurement?.id) {
        setAssociatedMeasurement(measurement);
      }
    }
  }, [loadedMeasurements, project]);

  useEffect(() => {
    if (loadedServices && loadedServices?.length > 0) {
      const services = loadedServices.filter(s => s.salesOrder?.salesorder_id === project?.salesOrder?.salesorder_id);
      if (services && services?.length > 0) {
        setAssociatedServices(services);
      } 
    }
  }, [loadedServices, project]);

  const indexInInstallationFilteredList = useMemo(() => {
    if (installationFilteredList.length > 0) {
      return installationFilteredList.findIndex(installation => installation.id === project?.id);
    }
    return -1;
  }, [installationFilteredList, project]);

  const searchedInstallationFilteredList = useMemo(() => {
    const lower = searchText.toLowerCase();
    return installationFilteredList.filter(inst =>
      inst.name.toLowerCase().includes(lower) ||
      String(inst.number).toLowerCase().includes(lower)
    );
  }, [installationFilteredList, searchText]);

  const handleAddResetUsersAssignees = useCallback(
    async (users) => {
      let updatedUsers = users;
      if (project?.usersAssignees.length > 0) {
        updatedUsers = [
          ...project.usersAssignees,
          ...users.filter((user) => !project?.usersAssignees.some((u) => u.id === user.id)),
        ];
      }
      try {
        const promise = axios.post(`${CONFIG.apiUrl}/projects/add/project/${project?.id}/users/`, {
          usersAssignees: updatedUsers,
          userReporter: userLogged?.data,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [project, userLogged]
  );

  const handleRefetchSalesOrder = useCallback(
    async () => {
      try {
        const promise = axios.get(`${CONFIG.apiUrl}/integration/refetch_salesorder/${project?.id}/`);

        toast.promise(promise, {
          loading: 'Loading...',
          success: `Sales Order refetched!`,
          error: `Sales Order error in refetching!`,
        });

      } catch (error) {
        console.error(error);
      }
    },
    [project]
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'space-between', gap: 0 }}>
          <Typography variant="h6">INSTALLATION {project?.name}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left' }}>
            {indexInInstallationFilteredList - 1 >= 0 && (
              <Tooltip title={`Previous installation: ${installationFilteredList?.[indexInInstallationFilteredList - 1]?.name}`} arrow>
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={() => {
                    const id = installationFilteredList?.[indexInInstallationFilteredList - 1]?.id;
                    localStorage.setItem('projectId', id);
                    localStorage.setItem('backFromProjectDetails', 'projects');
                    // tabs?.setValue('overview');
                    router.push(paths.dashboard.project.details(id));
                  }} color='default'>
                  <Iconify icon="mdi-light:skip-previous" />
                </IconButton>
              </Tooltip>
            )}
            {indexInInstallationFilteredList + 1 < installationFilteredList?.length && (
              <Tooltip title={`Next installation: ${installationFilteredList?.[indexInInstallationFilteredList + 1]?.name}`} arrow>
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={() => {
                    const id = installationFilteredList?.[indexInInstallationFilteredList + 1]?.id;
                    localStorage.setItem('projectId', id);
                    localStorage.setItem('backFromProjectDetails', 'projects');
                    // tabs?.setValue('overview');
                    router.push(paths.dashboard.project.details(id));
                  }} color='default'>
                  <Iconify icon="mdi-light:skip-next" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='List installations' arrow>
              <IconButton
                sx={{
                  '&:hover': {
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  },
                }}
                onClick={popoverInstallationList.onOpen}
                color='default'>
                <Iconify icon="pepicons-pencil:next-track" />
              </IconButton>
            </Tooltip>
            <CustomPopover
              open={popoverInstallationList.open}
              anchorEl={popoverInstallationList.anchorEl}
              onClose={popoverInstallationList.onClose}
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
                {searchedInstallationFilteredList.length > 0 ? (
                  searchedInstallationFilteredList?.map((installation) => (
                    <MenuItem
                      key={installation?.id}
                      onClick={() => {
                        popoverInstallationList.onClose();
                        const id = installation?.id;
                        localStorage.setItem('projectId', id);
                        localStorage.setItem('backFromProjectDetails', 'projects');
                        router.push(paths.dashboard.project.details(id));
                      }}
                    >
                      <Tooltip
                        title={
                          <>
                            <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                              Installation: {installation?.name}
                            </Typography>
                            <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                              Install date: {fDate(installation?.startDate) || 'N/A'}
                            </Typography>
                          </>
                        }
                        placement="right"
                        arrow
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left', gap: 2 }}>
                          <Iconify icon="grommet-icons:services" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {installation?.name}
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

        {(type === 'project' || type === 'tasks') && (
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
            {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff) ||
              listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.projectManager)) && (
                <Tooltip title='Generate Service' arrow>
                  <IconButton
                    sx={{
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                      },
                    }}
                    onClick={confirmGenerateService.onTrue}
                    color='default'>
                    <Iconify icon="fluent-mdl2:c-r-m-services" />
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
            {/* {(verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleProjects,
              CONFIG.permissions.operationEditUsersAssignees
            ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                <Tooltip title='Add users to installation' arrow>
                  <IconButton
                    sx={{
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                      },
                    }}
                    onClick={share.onTrue}
                    color={project?.usersAssignees?.length > 0 ? 'default' : 'warning'}>
                    <Iconify icon="tdesign:usergroup-add-filled" />
                  </IconButton>
                </Tooltip>
              )}
            {(type === 'project' &&
              (verifyPermissions(
                listPermissions,
                CONFIG.permissions.system,
                CONFIG.permissions.moduleProjects,
                CONFIG.permissions.operationUpdate
              ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator))) && (
                <Tooltip title={`Edit ${type === 'project' ? 'installation' : type}`} arrow>
                  <IconButton
                    sx={{
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                      },
                    }}
                    onClick={() => setOpenEdit(true)}>
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Tooltip>
              )} */}
            {(verifyPermissions(
              listPermissions,
              CONFIG.permissions.system,
              CONFIG.permissions.moduleProjects,
              CONFIG.permissions.operationDelete
            ) || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                <Tooltip title="Delete installation" arrow>
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
        <Tooltip title='Close installation' arrow>
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
            onClick={localStorage.getItem('projectReminderTab') ? () => localStorage.removeItem('projectReminderTab') : null}
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

      <ProjectShareDialog
        open={share.value}
        shared={project?.shared}
        loadedUsers={filteredUsers}
        loadedProjectPermissions={loadedProjectPermissions}
        projectData={project}
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
            Are you sure want to delete installation project <strong> {project?.name} </strong>?
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
        title="Generate Measurements"
        content={
          <>
            {associatedMeasurement && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                This installation already has{' '}
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
                    localStorage.setItem('backFromMeasurementDetails', 'project');
                    localStorage.setItem('backFromMeasurementDetailsProjectId', project?.id);
                    localStorage.setItem('backFromMeasurementDetailsServiceId', '');
                  }}
                >
                  measurements
                </Link>
                associated
              </Typography>
            )}
            Are you sure want to generate new measurements for <strong> {project?.name} </strong>?
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
                localStorage.setItem('backFromMeasurementDetails', 'project');
                localStorage.setItem('backFromMeasurementDetailsProjectId', project?.id);
                localStorage.setItem('backFromMeasurementDetailsServiceId', '');
                await refetchProject();
                router.push(paths.dashboard.measurement.details(newMeas?.data?.id));
              }
            }}
          >
            Generate
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmGenerateService.value}
        onClose={confirmGenerateService.onFalse}
        title="Generate Service"
        content={
          <>
            {associatedServices?.length > 0 && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }} key={`associatedServices-${project?.id}`}>
                This installation already has {associatedServices?.length} associated services:
                {associatedServices?.map((service, index) => (
                  <React.Fragment key={`associatedService-${index}`}>
                    <br key={`br-${index}`}/>
                    <Link
                      key={index}
                      component={RouterLink}
                      to={paths.dashboard.service.details(service.id)}
                      variant="body2"
                      underline="hover"
                      color="default"
                      sx={{ mx: 0.5 }}
                      onClick={() => {
                        confirmGenerateService.onFalse();
                        localStorage.setItem('serviceId', service?.id);
                        localStorage.setItem('backFromServiceDetails', 'projectDetails');
                        localStorage.setItem('projectId', project?.id);
                      }}
                    >
                      {service?.name} (version: {service?.version})
                    </Link>
                  </React.Fragment>
                ))}
              </Typography>
            )}
            Are you sure want to generate new service for <strong> {project?.name} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
              confirmGenerateService.onFalse();
              setOpenModalNewService(true);
            }}
          >
            Generate
          </Button>
        }
      />
      <ServiceNewFormFromProject
        salesOrder={project?.salesOrder}
        open={openModalNewService}
        setOpen={setOpenModalNewService}
      />
    </>
  );
}
