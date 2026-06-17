import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import { Button, MenuItem } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createDefaultPermissions, isInstaller } from 'src/utils/check-permissions';

import { _mock } from 'src/_mock/_mock';
import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';

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

export function UserNewEditForm({ currentUser }) {
  const router = useRouter();

  const userLogged = useMemo(
    () => JSON.parse(sessionStorage.getItem('userLogged')),
    []
  );

  const { loadedUsers, refetchUsers, loadedUserRoles } = useDataContext();

  const [users, setUsers] = useState(null);

  useEffect(() => {
    if (loadedUsers && loadedUsers.length > 0) {
      setUsers(loadedUsers);
    }
  }, [loadedUsers]);

  // ======================
  // defaultValues
  // ======================
  const defaultValues = useMemo(
    () => ({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      role: currentUser?.userRole?.id || '',
      isActive: currentUser?.isActive ?? true,
      password: '',
      confirmPassword: '',
      // SIEMPRE definimos los campos de installer para evitar
      // uncontrolled → controlled
      costByUnit: currentUser?.installerInfo?.costByUnit || 1,
      unit: currentUser?.installerInfo?.unit || null,
      typeCrew: currentUser?.installerInfo?.typeCrew || null,
    }),
    [currentUser]
  );

  // ======================
  // Schema con Zod
  // ======================

  const baseSchema = useMemo(
    () =>
      zod.object({
        username: zod.string().min(1, { message: 'Username is required!' }),
        firstName: zod.string().min(1, { message: 'First name is required!' }),
        lastName: zod.string().min(1, { message: 'Last name is required!' }),
        email: zod
          .string()
          .min(1, { message: 'Email is required!' })
          .email({ message: 'Email must be a valid email address!' }),
        phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
        role: zod.string().min(1, { message: 'Role is required!' }),
        password: currentUser
          ? zod.string()
          : zod.string().min(1, { message: 'Password is required!' }),
        confirmPassword: currentUser
          ? zod.string()
          : zod.string().min(1, {
            message: 'Confirm Password is required!',
          }),

        // IMPORTANTE: los campos de installer SIEMPRE existen,
        // pero son opcionales a nivel de tipo.
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
      }),
    [currentUser]
  );

  const NewUserSchema = useMemo(
    () =>
      baseSchema.superRefine((data, ctx) => {
        // 1) Passwords deben coincidir solo si es creación
        if (!currentUser && data.password !== data.confirmPassword) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: 'Passwords must match',
            path: ['confirmPassword'],
          });
        }

        // 2) Username único solo si es creación
        if (!currentUser && users && users.length > 0) {
          const usernameExists = users.some(
            (user) =>
              user.username?.toLowerCase() ===
              data.username.trim().toLowerCase()
          );
          if (usernameExists) {
            ctx.addIssue({
              code: zod.ZodIssueCode.custom,
              message: 'Username already exists',
              path: ['username'],
            });
          }
        }

        // 3) Validaciones específicas de installer
        const selectedRole = loadedUserRoles?.find(
          (role) => role.id === data.role
        );
        const isInstallerSelected =
          selectedRole && isInstaller(selectedRole.name);

        if (isInstallerSelected) {
          // costByUnit requerido y >= 0
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
    [baseSchema, currentUser, users, loadedUserRoles]
  );

  // ======================
  // useForm
  // ======================

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const roleValue = watch('role');

  // estado derivado para mostrar / ocultar sección installer
  const isInstallerRole = useMemo(() => {
    if (!loadedUserRoles || loadedUserRoles.length === 0) return false;
    const selectedRole = loadedUserRoles.find((role) => role.id === roleValue);
    return !!(selectedRole && isInstaller(selectedRole.name));
  }, [roleValue, loadedUserRoles]);

  // ======================
  // submit
  // ======================

  const onSubmit = handleSubmit(async (data) => {
    const selectedRole = loadedUserRoles?.find((role) => role.id === data.role);
    const isInstallerSelected = selectedRole && isInstaller(selectedRole.name);

    try {
      const randomNumber = Math.floor(Math.random() * 25) + 1;

      let payload = {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        password: data.password,
        isActive: data.isActive,
        userReporter: userLogged?.data,
        avatarUrl: _mock.image.avatar(randomNumber),
      };

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

      await axios.post(`${CONFIG.apiUrl}/users/create/user/`, payload);

      await refetchUsers?.();

      reset();
      toast.success(currentUser ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.user.list);
    } catch (err) {
      console.error(err);
    }
  });

  // ======================
  // JSX
  // ======================

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            {/* Datos básicos */}
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
              sx={{ mb: isInstallerRole ? 0 : 3 }}
            >
              <Field.Text name="username" label="Username" />
              <Field.Text name="email" label="Email address" />
              <Field.Text name="firstName" label="First name" />
              <Field.Text name="lastName" label="Last name" />
              <Field.Phone name="phoneNumber" label="Phone number" />

              <Field.Select name="role" label="Role">
                {loadedUserRoles?.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>

            {/* Bloque installer: ocupa toda la fila y es responsivo */}
            {isInstallerRole && (
              <Grid xs={12} md={12}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    width: '100%',
                    gap: 2,
                    mt: 1,
                    mb: 1,
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
            )}

            {/* Passwords */}
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="password" label="Password" type="password" />
              <Field.Text
                name="confirmPassword"
                label="Confirm Password"
                type="password"
              />
            </Box>

            {/* Botones */}
            <Stack
              alignItems="flex-end"
              sx={{
                mt: 3,
                flexDirection: 'row',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
              }}
            >
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create user' : 'Save changes'}
              </LoadingButton>
              <Button
                type="button"
                variant="outlined"
                onClick={() => router.push(paths.dashboard.user.list)}
              >
                Cancel
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
