import { useState, useCallback, useMemo, useContext, useEffect } from 'react';
import axios from 'axios';
import { CONFIG } from 'src/config-global';

import { LoadingContext } from 'src/auth/context/loading-context';

import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useProjectByIdQuery } from 'src/_mock/__projects';

import { toast } from 'src/components/snackbar';

import { stripHtmlUsingDOM } from 'src/utils/helper';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { varAlpha } from 'src/theme/styles';
import { Tab, Tooltip } from '@mui/material';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTabs } from 'src/hooks/use-tabs';

import { useBoolean } from 'src/hooks/use-boolean';
import dayjs from 'dayjs';
import { CustomDateRangePicker, useDateRangePicker } from 'src/components/custom-date-range-picker';
import { Label } from 'src/components/label';
import { fData } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
import { CustomTabs } from 'src/components/custom-tabs';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { fileFormat, FileThumbnail } from 'src/components/file-thumbnail';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { ProjectShareDialog } from './project-share-dialog';
import { ProjectInvitedItem } from './project-invited-item';
import { KanbanInputName } from '../kanban/components/kanban-input-name';
import { ProjectUserAssigneesList } from './project-user-assignees-list';
import { ProjectDetailsAttachments } from './project-details-attachments';
import { ProjectTaskUserAssigneesList } from './project-task-user-assignees-list';
import { ProjectTaskShareDialog } from './project-task-share-dialog';
import { ProjectTaskDetailsPriority } from './project-task-details-priority';
import { ProjectTaskDetails } from './project-task-details';
import { ProjectTasksList } from './project-tasks-list';



// ----------------------------------------------------------------------

export function ProjectFileDetails({
  item,
  open,
  onClose,
  onDelete,
  favorited,
  onFavorite,
  onCopyLink,
  loadedUsers,
  loadedProjectPermissions,
  loadedStages,
  loadedStagesTask,
  setTableData,
  refetchProjects,
  ...other
}) {

  // useEffect(() => {
  //   if (refetchProjects) {
  //     refetchProjects();
  //   }
  // }, [refetchProjects]);

  const { isMobile } = useContext(LoadingContext);

  const confirm = useBoolean();

  const [expanded, setExpanded] = useState(false);

  const tabs = useTabs('overview');

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const rangePicker = useDateRangePicker(dayjs(item?.startDate), dayjs(item?.endDate));

  const toggleMainInfo = useBoolean(true);

  const share = useBoolean();

  const shareAddTask = useBoolean();

  const shareTask = useBoolean();

  const toggleTaskInfo = useBoolean(true);

  const toggleProjectAttachments = useBoolean(true);

  const [inviteEmail, setInviteEmail] = useState('');

  const [tags, setTags] = useState(item?.tags?.slice(0, 3) || []);

  const { data: itemById, refetch: refetchItemById } = useProjectByIdQuery(item?.id, {
    skip: !item?.id,
  });

  const [projectData, setProjectData] = useState({})

  // useEffect(() => {
  //   if (refetchItemById) {
  //     refetchItemById();
  //   }
  //   setProjectData(itemById || {});
  // }, [refetchItemById, itemById]);

  useEffect(() => {
    if (itemById) {
      setProjectData((prev) => ({
        ...prev,
        id: itemById?.id || '',
        name: itemById?.name || '',
        number: itemById?.number || '',
        description: itemById?.description || null,
        startDate: itemById?.startDate || null,
        endDate: itemById?.endDate || null,
        address: itemById?.address || '',
        usersAssignees: itemById?.usersAssignees || [],
        projectAttachments: itemById?.projectAttachments || [],
        projectTasks: itemById?.projectTasks || [],
        currentStage: itemById?.currentStage || null,
        currentTask: null,
      }));
    }
  }, [itemById, setProjectData]);

  const handleChangeInvite = useCallback((event) => {
    setInviteEmail(event.target.value);
  }, []);

  const handleChangeTags = useCallback((newValue) => {
    setTags(newValue);
  }, []);

  const handleChangeProjectName = useCallback((event) => {
    const name = event.target.value;
    if (name.length > 0) {
      setProjectData({ ...projectData, name });
    }
    else {
      setProjectData({ ...projectData, name: item.name });
    }
  }, [projectData, item]);

  const handleChangeProjectDescription = useCallback((event) => {
    setProjectData({ ...projectData, description: event.target.value });
  }, [projectData]);

  const handleChangeProjectAddress = useCallback((event) => {
    setProjectData({ ...projectData, address: event.target.value });
  }, [projectData]);

  const handleRemoveUserAssignee = useCallback(
    async (userId) => {
      try {
        const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${item.id}/user/${userId}/`, {
          data: {
            userReporter: userLogged?.data,
          },
        });
        const response = await promise;
        if (response.data) {
          const newUsersAssignees = projectData.usersAssignees.filter((user) => user.id !== userId);
          setProjectData({ ...projectData, usersAssignees: newUsersAssignees });
          refetchProjects?.();
        }
      } catch (error) {
        console.error(error);
      }
    }, [projectData, item, refetchProjects, userLogged]
  );




  // const handleUpdateTask = useCallback(
  //   (event) => {
  //     try {
  //       if (event.key === 'Enter') {
  //         if (taskName) {
  //           onUpdateTask({ ...task, name: taskName });
  //         }
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   },
  //   [onUpdateTask, task, taskName]
  // );

  const ProjectDialogSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    description: schemaHelper.editor().optional().nullable(),
    usersAssignees: zod
      .array(
        zod.object({
          id: zod.string(),
          name: zod.string(),
          firstName: zod.string(),
          lastName: zod.string(),
          avatarUrl: zod.string(),
          username: zod.string(),
          email: zod.string(),
          isStaff: zod.boolean(),
          isActive: zod.boolean(),
          project_permissions: zod.array(zod.any()).optional(),
        })
      )
      .nonempty({ message: 'Must have at least 1 user!' }),
    projectAttachments: schemaHelper.files({
      requireFiles: false,
    }),
    address: zod.string().min(1, { message: 'Address is required!' }),
    currentStage: zod.object({
      id: zod.string(),
      name: zod.string(),
      order: zod.number(),
    }),
  });

  const defaultValues = useMemo(
    () => ({
      id: itemById?.id || '',
      name: itemById?.name || '',
      number: itemById?.number || '',
      description: itemById?.description || null,
      usersAssignees: itemById?.usersAssignees || [],
      userReporter: userLogged?.data,
      startDate: itemById?.startDate || null,
      endDate: itemById?.endDate || null,
      projectAttachments: itemById?.projectAttachments || [],
      address: itemById?.address || '',
      currentStage: itemById?.currentStage || null,
    }),
    [itemById, userLogged]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ProjectDialogSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting },
  } = methods;


  useEffect(() => {
    if (itemById) {
      reset({
        id: itemById.id || '',
        name: itemById.name || '',
        number: itemById.number || '',
        description: itemById.description || null,
        usersAssignees: itemById.usersAssignees || [],
        userReporter: userLogged?.data,
        startDate: itemById.startDate || null,
        endDate: itemById.endDate || null,
        projectAttachments: itemById.projectAttachments || [],
        address: itemById.address || '',
        currentStage: itemById.currentStage || null,
      });
    }
  }, [itemById, userLogged?.data, reset]);

  const handleTabChange = (event, newValue) => {
    tabs.onChange(event, newValue);
    setProjectData((prev) => ({
      ...prev,
      currentTask: null,
    }));
  };

  const handleRemoveTask = useCallback(
    async (taskId) => {
      try {
        const promise = axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${item.id}/task/${taskId}/`, {
          data: {
            userReporter: userLogged?.data,
          },
        });
        const response = await promise;
        if (response.data) {
          const newTasks = projectData.projectTasks.filter((task) => task.id !== taskId);
          setProjectData({ ...projectData, projectTasks: newTasks });
          refetchProjects?.();
        }
      } catch (error) {
        console.error(error);
      }
    }, [projectData, item, refetchProjects, userLogged]
  );


  const handleAddResetUsersAssignees = useCallback(
    async (users) => {
      if (projectData.usersAssignees.length > 0) {
        users = [...projectData.usersAssignees, ...users.filter((user) => !projectData.usersAssignees.some((u) => u.id === user.id))];
      }
      try {
        const promise = axios.post(`${CONFIG.apiUrl}/projects/add/project/${item.id}/users/`, {
          usersAssignees: users,
          userReporter: userLogged?.data,
        });
        const response = await promise;
        if (response.data) {
          setProjectData((prev) => ({
            ...prev,
            usersAssignees: users,
          }));
          setValue("usersAssignees", users);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [setValue, projectData, item, userLogged?.data]
  );

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', stripHtmlUsingDOM(data.description));
    formData.append('userReporter', JSON.stringify(userLogged?.data));
    formData.append('usersAssignees', JSON.stringify(data.usersAssignees));

    formData.append('startDate', new Date(rangePicker.startDate).toISOString());
    formData.append('endDate', new Date(rangePicker.endDate).toISOString());

    formData.append('currentStage', JSON.stringify(data.currentStage));
    formData.append('address', data.address);

    if (data.projectAttachments && data.projectAttachments.length > 0) {
      data.projectAttachments.forEach((file) => {
        if (file instanceof File) {
          formData.append('projectAttachments', file);
        }
      });
    }

    const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${item.id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    try {
      toast.promise(promise, {
        loading: 'Loading...',
        success: `Update Project (${data.name}) success!`,
        error: `Update Project (${data.name}) error!`,
      });

      const response = await promise;

      if (!response.data) {
        return;
      }

      setProjectData((prev) => ({
        ...prev,
        name: data.name,
        description: data.description,
        usersAssignees: data.usersAssignees,
        startDate: data.startDate,
        endDate: data.endDate,
        currentStage: data.currentStage,
        address: data.address,
        projectAttachments: data.projectAttachments,
      }));

      refetchProjects?.();

      reset();

      onClose();

    } catch (error) {
      console.error(error);
    }
  });

  const renderTabs = (
    <CustomTabs
      value={tabs.value}
      onChange={handleTabChange}
      variant="fullWidth"
      slotProps={{ tab: { px: 0 } }}
      sx={{ width: expanded ? '40%' : '100%' }}
    >
      {[
        { value: 'overview', label: 'Overview' },
        { value: 'tasks', label: 'Tasks' },
      ].map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </CustomTabs>
  );

  const renderAddUsers = (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 0.5 }}>
        <IconButton
          size="small"
          color="primary"
          onClick={share.onTrue}
          sx={{
            width: 24,
            height: 24,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <Iconify icon="mingcute:add-line" />
        </IconButton>
      </Stack>
    </>
  );

  const renderAddTasks = (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 0.5 }}>
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => { tabs.onChange(e, 'tasks'); }}
          sx={{
            width: 24,
            height: 24,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <Iconify icon="mingcute:add-line" />
        </IconButton>
      </Stack>
    </>
  );

  const renderMainInfo = (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ typography: 'subtitle2' }}
      >
        Main Info
        <IconButton size="small" onClick={toggleMainInfo.onToggle}>
          <Iconify
            icon={toggleMainInfo.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
          />
        </IconButton>
      </Stack>

      {toggleMainInfo.value && (
        <>
          <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
              Due Date
            </Box>
            <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
              {rangePicker.selected ? (
                <Button size="small" onClick={rangePicker.onOpen}>
                  {rangePicker.shortLabel}
                </Button>
              ) : (
                <Tooltip title="Add due date">
                  <IconButton
                    onClick={rangePicker.onOpen}
                    sx={{
                      bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                      border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                    }}
                  >
                    <Iconify icon="mingcute:add-line" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <CustomDateRangePicker
              variant="calendar"
              title={`Choose due date (${projectData.number})`}
              startDate={rangePicker.startDate}
              endDate={rangePicker.endDate}
              onChangeStartDate={rangePicker.onChangeStartDate}
              onChangeEndDate={rangePicker.onChangeEndDate}
              open={rangePicker.open}
              onClose={rangePicker.onClose}
              selected={rangePicker.selected}
              error={rangePicker.error}
            />
          </Stack>
          <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
              Current Stage
            </Box>
            <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
              <Field.Autocomplete
                name="currentStage"
                placeholder="Current Stage"
                // disableCloseOnSelect
                options={loadedStages || []}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => value.id ? option.id === value.id : option.id === value._id}
                renderOption={(props, stage) => (
                  <li {...props} key={stage.id}>
                    {stage.name}
                  </li>
                )}
                renderTags={(selected, getTagProps) =>
                  selected.map((stage, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={stage.id}
                      size="small"
                      variant="soft"
                      label={stage.name}
                    />
                  ))
                }
              />
            </Box>
          </Stack>
          <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
              Address
            </Box>
            <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
              <Field.Text name="address" placeholder="Ex: 1234 Main St..." />
            </Box>
          </Stack>
          <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
              Description
            </Box>
            <Box sx={{ width: '100%', color: 'text.secondary', mt: -0.8 }}>
              <Field.Editor name="description" placeholder="Description..." />
            </Box>
          </Stack>
          <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
              Assigned Users
              {renderAddUsers}
            </Box>
            {/* <Box sx={{ width: expanded ? '40%' : '100%', color: 'text.secondary', mt: -0.8 }}>
              <Box component="ul" sx={{ pl: 2, pr: 1 }}>
                {projectData?.usersAssignees?.map((person, index) => (
                  <ProjectUserAssigneesList
                    key={`${index}-${person?.id}`}
                    project={item}
                    person={person}
                    loadedProjectPermissions={loadedProjectPermissions}
                    handleRemoveUserAssignee={handleRemoveUserAssignee}
                  />
                ))}
              </Box>
            </Box> */}
            <Controller
              name="usersAssignees"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Box sx={{ width: expanded ? '40%' : '100%', color: 'text.secondary', mt: -0.8 }}>
                    {field.value.length > 0 ? (
                      <Box component="ul" sx={{ pl: 2, pr: 1 }}>
                        {field.value.map((person, index) => (
                          <ProjectUserAssigneesList
                            key={`${index}-${person?.id}`}
                            project={item}
                            person={person}
                            loadedProjectPermissions={loadedProjectPermissions}
                            handleRemoveUserAssignee={handleRemoveUserAssignee}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Box component="label" sx={{ pl: 2, pr: 1 }}>
                        <Label color="warning" sx={{ marginTop: 5, marginLeft: 1 }}>Add users to task</Label>
                      </Box>
                    )}
                  </Box>
                  {error && (
                    <Typography variant="caption" color="error">
                      {error.message}
                    </Typography>
                  )}
                </>
              )}
            />
          </Stack>
          <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }} />

          </Stack>
        </>
      )}
    </Stack>
  );

  const renderTaskDetails = (task) => (
    <ProjectTaskDetails
      projectData={projectData}
      setProjectData={setProjectData}
      project={item}
      task={task}
      tabs={tabs}
      loadedStages={loadedStagesTask}
      shareTask={shareTask}
      handleChangeProjectName={handleChangeProjectName}
      handleRemoveTask={handleRemoveTask}
      setTableData={setTableData}
      refetchProjects={refetchProjects}
      expanded={expanded}
    />
  )

  const renderTasks = (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ typography: 'subtitle2' }}
      >
        <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
          Tasks
          {renderAddTasks}
        </Box>
        <IconButton size="small" onClick={toggleTaskInfo.onToggle}>
          <Iconify
            icon={toggleTaskInfo.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
          />
        </IconButton>
      </Stack>

      {toggleTaskInfo.value && (
        <>
          <Box sx={{ width: expanded ? '40%' : '85%', color: 'text.secondary', mt: -0.8, ml: 11 }}>
            {projectData?.projectTasks?.length > 0 ? (
              <Box component="ul" sx={{ pl: 2, pr: 1 }}>
                {projectData?.projectTasks?.map((task, index) => (
                  <ProjectTasksList
                    key={`${index}-${task?.id}`}
                    project={item}
                    task={task}
                    handleRemoveTask={handleRemoveTask}
                    tabs={tabs}
                    renderTaskDetails={renderTaskDetails}
                    projectData={projectData}
                    setProjectData={setProjectData}
                    refetchProjects={refetchProjects}
                  />
                ))}
              </Box>
            ) : (
              <Box component="label" sx={{ pl: 2, pr: 1 }}>
                <Label color="warning">Add tasks to project</Label>
              </Box>
            )}

          </Box>
        </>
      )}
    </Stack>
  );

  const renderAttachments = (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ typography: 'subtitle2' }}
      >
        Attachments
        <IconButton size="small" onClick={toggleProjectAttachments.onToggle}>
          <Iconify
            icon={toggleProjectAttachments.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
          />
        </IconButton>
      </Stack>

      {toggleProjectAttachments.value && (
        <>

          <Stack direction="row" sx={{ typography: 'caption', textTransform: 'capitalize' }}>
            <Box component="span" sx={{ width: 80, color: 'text.secondary', mr: 2 }}>
              Files
            </Box>
            <Controller
              name="projectAttachments"
              control={control}
              render={({ field }) => (
                <ProjectDetailsAttachments
                  projectData={projectData}
                  setProjectData={setProjectData}
                  attachments={field.value}
                  onChange={field.onChange}
                  type="project"
                  id={item.id}
                  name={projectData?.name}
                  data={projectData}
                  setData={setProjectData}
                  setTableData={setTableData}
                  refetchProjects={refetchProjects}
                />
              )}
            />
          </Stack>
        </>
      )}
    </Stack>
  );

  const renderProject = (
    <Stack
      spacing={2.5}
      justifyContent="center"
      sx={{ p: 2.5, bgcolor: 'background.neutral' }}
    >

      {/* <KanbanInputName
        value={projectData.name}
        placeholder="Project name"
        onChange={handleChangeProjectName}
        onKeyUp={null}
        inputProps={{ id: `input-project-${projectData.name}` }}
      /> */}

      <Controller
        name="name"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            <KanbanInputName
              {...field}
              placeholder="Project name"
              value={field.value}
              onChange={(e) => {
                const newValue = e.target.value;
                field.onChange(newValue);
              }}
              onBlur={field.onBlur}
              inputProps={{ id: `input-task-${projectData?.name}` }}
            />
            {error && <Typography color="error">{error.message}</Typography>}
          </>
        )}
      />

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderMainInfo}

      {renderTasks}

      {renderAttachments}

      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'row', width: expanded ? '40%' : '100%' }}>
        <Button
          fullWidth
          type="submit"
          variant="soft"
          color="info"
          size="medium"
          startIcon={<Iconify icon="solar:server-square-update-bold" />}
          onClick={null}
          sx={{ mr: 2.5 }}
        >
          Update Project
        </Button>
        <Button
          fullWidth
          variant="soft"
          color="error"
          size="medium"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={confirm.onTrue}
          sx={{ mr: 2.5 }}
        >
          Delete Project
        </Button>
        <Button
          fullWidth
          variant="soft"
          color="warning"
          size="medium"
          startIcon={<Iconify icon="material-symbols:cancel" />}
          onClick={onClose}
        >
          Cancel
        </Button>
      </Box>
    </Stack>
  )

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: isMobile ? 420 : (expanded ? '85%' : 620), height: '96%' } }}
        {...other}
      >


        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5 }}>
          <Typography variant="h6"> Project No. {projectData.number} </Typography>

          {/* <Checkbox
                color="warning"
                icon={<Iconify icon="eva:star-outline" />}
                checkedIcon={<Iconify icon="eva:star-fill" />}
                checked={favorited}
                onChange={onFavorite}
              /> */}

          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <Tooltip title="Kanban View">
              <IconButton onClick={null}>
                <Iconify icon="bi:kanban" />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Tooltip title={!expanded ? "Expand" : "Reduce"}>
                <IconButton onClick={() => setExpanded(!expanded)}>
                  <Iconify icon={!expanded ? "humbleicons:expand" : "lets-icons:reduce"} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close">
              <IconButton onClick={onClose}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>

        {renderTabs}


        <Scrollbar>
          <Form methods={methods} onSubmit={onSubmit}>
            {tabs.value === 'overview' && renderProject}
          </Form>
          {tabs.value === 'tasks' && renderTaskDetails(projectData.currentTask)}
        </Scrollbar>
      </Drawer >

      <ProjectShareDialog
        open={share.value}
        shared={item?.shared}
        inviteEmail={inviteEmail}
        onChangeInvite={handleChangeInvite}
        onCopyLink={onCopyLink}
        loadedUsers={loadedUsers}
        loadedProjectPermissions={loadedProjectPermissions}
        projectData={projectData}
        handleAddUsersAssignees={handleAddResetUsersAssignees}
        onClose={() => {
          share.onFalse();
        }}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Project"
        content={
          <>
            Are you sure want to delete project <strong> {item?.name} </strong>?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={onDelete}>
            Delete
          </Button>
        }
      />


    </>
  );
}
