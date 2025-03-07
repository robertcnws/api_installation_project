import axios from 'axios';
import { z as zod } from 'zod';
import { useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Stack, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { stripHtmlUsingDOM } from 'src/utils/helper';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const SalesOrderCreateProjectDialogSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  description: schemaHelper.editor().optional().nullable(),
  usersAssignees: zod.array(
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
      user_role: zod.object({
        id: zod.string(),
        name: zod.string(),
        description: zod.string(),
      }).optional(),
      userRole: zod.object({
        id: zod.string(),
        name: zod.string(),
        description: zod.string(),
      }).optional(),
    })
  ).nonempty({ message: 'Must have at least 1 user!' }),
  userManager: zod.object({
    id: zod.string(),
    name: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
    avatarUrl: zod.string(),
    username: zod.string(),
    email: zod.string(),
    isStaff: zod.boolean(),
    isActive: zod.boolean(),
    user_role: zod.object({
      id: zod.string(),
      name: zod.string(),
      description: zod.string(),
    }).optional(),
    userRole: zod.object({
      id: zod.string(),
      name: zod.string(),
      description: zod.string(),
    }).optional(),
  }).refine((data) => data.id && data.name, {
    message: "Project Manager is required!",
    path: ["userManager"],
  }),
  projectAttachments: schemaHelper.files({
    requireFiles: false,
  }),
  address: zod.string().min(1, { message: 'Address is required!' }),
  hasPermission: zod.boolean(),
});

// ----------------------------------------------------------------------

export function SalesOrderCreateProjectDialogForm({ currentProject, loadedUsers, currentSalesOrder, open, onClose }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const router = useRouter();

  const defaultValues = useMemo(
    () => ({
      id: currentProject?.id || '',
      name: currentProject?.name || '',
      number: currentProject?.number || '',
      description: currentProject?.description || null,
      salesOrder: currentProject?.salesOrder || '',
      usersAssignees: currentProject?.usersAssignees || [],
      userManager: currentProject?.userManager || null,
      hasPermission: currentProject?.hasPermission || false,
      projectAttachments: currentProject?.projectAttachments || [],
      address: currentProject?.address || '',
    }),
    [currentProject]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(SalesOrderCreateProjectDialogSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    setValue,
    getValues,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const selectedManager = useWatch({ control, name: 'userManager' });

  const onSubmit = handleSubmit(async (data) => {
    // const id = currentProject.id;

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', stripHtmlUsingDOM(data.description));
    formData.append('salesOrder', JSON.stringify(currentSalesOrder));
    formData.append('address', data.address);
    formData.append('userReporter', JSON.stringify(userLogged?.data));
    formData.append('usersAssignees', JSON.stringify(data.usersAssignees));
    formData.append('userManager', JSON.stringify(data.userManager));
    formData.append('hasPermission', data.hasPermission);
    formData.append('address', data.address);
    // formData.append(
    //   'startDate',
    //   data.startDate ? new Date(data.startDate).toISOString() : ''
    // );
    // formData.append(
    //   'endDate',
    //   data.endDate ? new Date(data.endDate).toISOString() : ''
    // );
    if (data.projectAttachments && data.projectAttachments.length > 0) {
      data.projectAttachments.forEach((file) => {
        formData.append('projectAttachments', file);
      });
    }

    const promise = axios.post(`${CONFIG.apiUrl}/projects/create/project/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    try {

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Create success!',
        error: 'Create error!',
      });

      await promise;

      router.push(paths.dashboard.project.list);

      reset();
      onClose();

    } catch (error) {
      console.error(error);
    }
  });

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.projectAttachments && values.projectAttachments?.filter((file) => file !== inputFile);
      setValue('projectAttachments', filtered, { shouldValidate: true });
    },
    [setValue, values.projectAttachments]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('projectAttachments', [], { shouldValidate: true });
  }, [setValue]);

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 1220 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Creating an Installation from {currentSalesOrder?.salesorder_number}</DialogTitle>

        <DialogContent>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            sx={{ mb: 2 }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Name</Typography>
              <Field.Text name="name" placeholder="Ex: Project Installation X..." />
            </Stack>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" />
              <Field.Switch
                name="hasPermission"
                labelPlacement="start"
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Need Permission
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      This is a switch to enable or disable the need for especial permissions.
                    </Typography>
                  </>
                }
                sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
              />
            </Stack>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Project Manager</Typography>
              <Field.Autocomplete
                name="userManager"
                control={control}
                placeholder="Select manager"
                options={loadedUsers}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => {
                  setValue('userManager', newValue);
                  if (newValue) {
                    const oldAssignees = getValues('usersAssignees') || [];
                    const filtered = oldAssignees.filter((u) => u.id !== newValue.id);
                    setValue('usersAssignees', filtered);
                  }
                }}
                renderOption={(props, user) => (
                  <li {...props} key={user.id}>
                    <Avatar
                      key={user.id}
                      alt={user.avatarUrl}
                      src={user.avatarUrl}
                      sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                    />

                    {user.name}
                  </li>
                )}
                renderTags={(selected, getTagProps) =>
                  selected.map((user, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={user.id}
                      size="small"
                      variant="soft"
                      label={user.name}
                      avatar={<Avatar alt={user.name} src={user.avatarUrl} />}
                    />
                  ))
                }
              />
            </Stack>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Users Assignees</Typography>
              <Field.Autocomplete
                multiple
                control={control}
                name="usersAssignees"
                placeholder="+ Users"
                disableCloseOnSelect
                options={loadedUsers.filter(
                  (user) => user.id !== (selectedManager ? selectedManager.id : null)
                )}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, user) => (
                  <li {...props} key={user.id}>
                    <Avatar
                      key={user.id}
                      alt={user.avatarUrl}
                      src={user.avatarUrl}
                      sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                    />

                    {user.name}
                  </li>
                )}
                renderTags={(selected, getTagProps) =>
                  selected.map((user, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={user.id}
                      size="small"
                      variant="soft"
                      label={user.name}
                      avatar={<Avatar alt={user.name} src={user.avatarUrl} />}
                    />
                  ))
                }
              />
            </Stack>
          </Box>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            sx={{ mb: 2 }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Description</Typography>
              <Field.Editor name="description" placeholder="Write your project description here..." />
            </Stack>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Attachments</Typography>
              <Field.Upload
                multiple
                thumbnail
                name="projectAttachments"
                maxSize={3145728}
                onRemove={handleRemoveFile}
                onRemoveAll={handleRemoveAllFiles}
                onUpload={() => console.info('ON UPLOAD')}
              />
            </Stack>
          </Box>
          <Box
            rowGap={3}
            columnGap={1}
            display="grid"
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Address</Typography>
              <Field.Text name="address" placeholder="Ex: 1234 Main St..." />
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Create
          </LoadingButton>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </Form>
    </Dialog >
  );
}
