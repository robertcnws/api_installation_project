import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Chip, Avatar } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';

import { Field } from 'src/components/hook-form';



// ----------------------------------------------------------------------

export function ProjectTaskShareDialog({
  open,
  onClose,
  projectData,
  usersAssignees,
  handleAddTaskUsersAssignees,
  ...other
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const ProjectDialogSchema = zod.object({
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
        })
      )
      .nonempty({ message: 'Must have at least 1 user!' }),
  });

  const defaultValues = useMemo(
    () => ({
      usersAssignees: usersAssignees || [],
    }),
    [usersAssignees]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ProjectDialogSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);


  const addUsers = async (users) => {
    await handleAddTaskUsersAssignees(users);
    onClose();
  }

  const onSubmit = handleSubmit(async (data) => {
    await addUsers(data.usersAssignees);
  });

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose} {...other}>
      <DialogTitle> Add New Task User(s) </DialogTitle>

      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>

        <Box sx={{ px: 3 }}>
          <Field.Autocomplete
            multiple
            name="usersAssignees"
            placeholder="+ Users"
            disableCloseOnSelect
            options={projectData?.usersAssignees || []}
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
        </Box>

        <DialogActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="success" type="submit" disabled={isSubmitting || !methods.formState.isValid}>
            Add User(s)
          </Button>
          {onClose && (
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
