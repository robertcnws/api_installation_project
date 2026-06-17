import axios from 'axios';
import { z as zod } from 'zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { createDefaultPermissions, isInstaller } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { USER_STATUS_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';
import { Grid } from '@mui/material';

// ----------------------------------------------------------------------

const units = [
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
];

const typeCrews = [
  { label: 'On House', value: 'onHouse' },
  { label: 'Subcontractor', value: 'subcontractor' },
];

// ----------------------------------------------------------------------

export function UserQuickEditForm({ currentUser, open, onClose }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { loadedUserRoles, refetchUsers } = useDataContext();

  const defaultValues = useMemo(
    () => ({
      id: currentUser?.id || '',
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      status: currentUser?.isActive ? 'active' : 'inactive',
      role: currentUser?.userRole.id || '',
      costByUnit: currentUser?.installerInfo?.costByUnit || 1,
      unit: currentUser?.installerInfo?.unit || null,
      typeCrew: currentUser?.installerInfo?.typeCrew || null,
    }),
    [currentUser]
  );

  const baseSchema = zod.object({
    firstName: zod.string().min(1, { message: 'First name is required!' }),
    lastName: zod.string().min(1, { message: 'Last name is required!' }),
    email: zod
      .string()
      .min(1, { message: 'Email is required!' })
      .email({ message: 'Email must be a valid email address!' }),
    phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    role: zod.string().min(1, { message: 'Role is required!' }),
    status: zod.string(),
    costByUnit: zod
      .coerce
      .number()
      .optional(),

    unit: zod
      .object({
        value: zod.string(),
        label: zod.string(),
      })
      .nullable()
      .optional(),

    typeCrew: zod
      .object({
        value: zod.string(),
        label: zod.string(),
      })
      .nullable()
      .optional(),
  });

  const UserQuickEditSchema = useMemo(
    () =>
      baseSchema.superRefine((data, ctx) => {
        const selectedRole = loadedUserRoles?.find(
          (role) => role.id === data.role
        );
        const isInstallerSelected =
          selectedRole && isInstaller(selectedRole.name);

        if (isInstallerSelected) {
          if (
            Number.isNaN(data.costByUnit)
          ) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Cost by unit is required',
              path: ['costByUnit'],
            });
          } else if (data.costByUnit < 0) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Cost by unit must be at least 0',
              path: ['costByUnit'],
            });
          }

          // unit requerido
          if (!data.unit) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Unit is required!',
              path: ['unit'],
            });
          }

          // typeCrew requerido
          if (!data.typeCrew) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Type crew is required!',
              path: ['typeCrew'],
            });
          }
        }
      }),
    [baseSchema, loadedUserRoles]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = methods;

  const roleValue = watch('role');

  const isInstallerRole = useMemo(() => {
    if (!loadedUserRoles || loadedUserRoles.length === 0) return false;
    const selectedRole = loadedUserRoles.find((role) => role.id === roleValue);
    return !!(selectedRole && isInstaller(selectedRole.name));
  }, [roleValue, loadedUserRoles]);

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    const { id } = currentUser;
    let payload = {
      ...data,
      username: currentUser.username,
      userReporter: userLogged?.data
    };

    const selectedRole = loadedUserRoles?.find((role) => role.id === data.role);
    const isInstallerSelected = selectedRole && isInstaller(selectedRole.name);

    if (isInstallerSelected) {
      payload = {
        ...payload,
        installerInfo: {
          costByUnit:
            typeof data.costByUnit === 'number'
              ? data.costByUnit
              : Number(data.costByUnit),
          unit: data.unit,
          typeCrew: data.typeCrew,
        },
      };
    }

    const promise = axios.post(`${CONFIG.apiUrl}/users/edit/user/${id}/`, payload);

    try {
      reset();
      onClose();

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Update success!',
        error: 'Update error!',
      });

      await promise;

      // console.info('DATA', data);

      if (data.username === userLogged?.data.username) {
        localStorage.removeItem('userLogged');
        sessionStorage.removeItem('userLogged');
        /* eslint-disable object-shorthand */
        localStorage.setItem('userLogged', JSON.stringify({ data: data }));
        sessionStorage.setItem('userLogged', JSON.stringify({ data: data }));
        /* eslint-enable object-shorthand */
      }

      refetchUsers?.();

      // const roleName = loadedUserRoles?.find((role) => role.id === data.role)?.name;
      // const { username } = data;

      // const dataAWS = createDefaultPermissions(roleName);
      // await axios.post(`${CONFIG.apiUrl}/integration/manage_user_permissions/`, {
      //   username,
      //   data: dataAWS,
      // }, {
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // }).then((res) => res.data)

    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 920 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box className="dialog-title-icon">
              <Iconify icon="mdi:account-edit" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Quick User Info Update
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            USERNAME: <b>{currentUser?.username}</b>
          </Alert>

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <Field.Select name="status" label="Status">
              {USER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Label>
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        mr: 1,
                        borderRadius: '50%',
                        bgcolor: status.color,
                      }}
                    />
                    {status.label}
                  </Label>
                </MenuItem>
              ))}
            </Field.Select>

            {/* <Box sx={{ display: { xs: 'none', sm: 'block' } }} /> */}
            <Field.Text name="email" label="Email address" />

            <Field.Text name="firstName" label="First name" />
            <Field.Text name="lastName" label="Last name" />

            <Field.Phone name="phoneNumber" label="Phone number" />
            <Field.Select name="role" label="Role">
              {loadedUserRoles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Field.Select>
          </Box>
          {isInstallerRole && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    width: '100%',
                    gap: 2,
                    mt: 3,
                    mb: 2,
                  }}
                >
                  <Field.Autocomplete
                    name="unit"
                    label="Unit"
                    options={units}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      !!value && option.value === value.value
                    }
                    sx={{ flex: 1 }}
                  />

                  <Field.Text
                    name="costByUnit"
                    label="Cost by unit"
                    type="number"
                    sx={{ flex: 1 }}
                    inputProps={{ min: 1 }}
                  />

                  <Field.Autocomplete
                    name="typeCrew"
                    label="Crew type"
                    options={typeCrews}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      !!value && option.value === value.value
                    }
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
