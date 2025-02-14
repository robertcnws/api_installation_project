import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CONFIG } from 'src/config-global';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';


import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { MenuItem } from '@mui/material';
import { useUserList } from 'src/_mock/_user';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function UserNewEditForm({ currentUser }) {
  
  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { loading, error, _userList } = useUserList();

  const [users, setUsers] = useState(null);

  useEffect(() => {
    if (_userList && _userList.length > 0) {
      setUsers(_userList);
    } else if (!loading && !error) {
      setUsers(null);
    }
  }, [_userList, loading, error]);

  const NewUserSchema = zod.object({
    // avatarUrl: schemaHelper.file({
    //   message: { required_error: 'Avatar is required!' },
    // }),
    username: zod.string().min(1, { message: 'Username is required!' }),
    // firstName: zod.string().min(1, { message: 'First name is required!' }),
    // lastName: zod.string().min(1, { message: 'Last name is required!' }),
    email: zod
      .string()
      .min(1, { message: 'Email is required!' })
      .email({ message: 'Email must be a valid email address!' }),
    phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    // country: schemaHelper.objectOrNull({
    //   message: { required_error: 'Country is required!' },
    // }),
    // address: zod.string().min(1, { message: 'Address is required!' }),
    // gender: zod.string().min(1, { message: 'Gender is required!' }),
    // state: zod.string().min(1, { message: 'State is required!' }),
    // city: zod.string().min(1, { message: 'City is required!' }),
    role: zod.string().min(1, { message: 'Role is required!' }),
    // zipCode: zod.string().min(1, { message: 'Zip code is required!' }),
    password: currentUser ? zod.string() : zod.string().min(1, { message: 'Password is required!' }),
    confirmPassword: currentUser ? zod.string() : zod.string().min(1, { message: 'Confirm Password is required!' }),

    // Not required
    status: zod.string(),
    isVerified: zod.boolean(),
  })
  .refine((data) => {
    if (!currentUser) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    if (!currentUser) {
      const usernameExists = users?.some(
        (user) => user.username.toLowerCase() === data.username.toLowerCase()
      );
      return !usernameExists;
    }
    return true;
  }, {
    message: "Username already exists",
    path: ["username"],
  });

  const defaultValues = useMemo(
    () => ({
      status: currentUser?.status || '',
      avatarUrl: currentUser?.avatarUrl || null,
      isVerified: currentUser?.isVerified || true,
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      country: currentUser?.country || '',
      state: currentUser?.state || '',
      city: currentUser?.city || '',
      address: currentUser?.address || '',
      zipCode: currentUser?.zipCode || '',
      gender: currentUser?.gender || '',
      role: currentUser?.role || '',
      password: '',
      confirmPassword: '',
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {
    
    try {
      const id = currentUser ? currentUser.id : 0;
      await axios.post(`${CONFIG.apiUrl}/api_zoho/manage_user/${id}/`, {
        ...data,
        manager_username: userLogged?.data.username,
      });
      reset();
      toast.success(currentUser ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.user.list);
    } catch (err) {
      console.error(err);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* <Grid xs={12} md={4}>
          <Card sx={{ pt: 3, pb: 5, px: 3 }}>
            {currentUser && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'inactive' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )}

            <Box sx={{ mb: 5 }}>
              <Field.Text name="username" label="Username" />
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box> 

            {currentUser && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value !== 'active'}
                        onChange={(event) =>
                          field.onChange(event.target.checked ? 'banned' : 'active')
                        }
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Banned
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Apply disable account
                    </Typography>
                  </>
                }
                sx={{
                  mx: 0,
                  mb: 3,
                  width: 1,
                  justifyContent: 'space-between',
                }}
              />
            )}

            <Field.Switch
              name="isVerified"
              labelPlacement="start"
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Email verified
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Disabling this will automatically send the user a verification email
                  </Typography>
                </>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />

            {currentUser && (
              <Stack justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                <Button variant="soft" color="error">
                  Delete user
                </Button>
              </Stack>
            )}
          </Card>
        </Grid> */}

        <Grid xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="username" label="Username" />
              <Field.Text name="email" label="Email address" />
              {/* <Field.Text name="firstName" label="First name" />
              <Field.Text name="lastName" label="Last name" /> */}
              <Field.Phone name="phoneNumber" label="Phone number" />

              {/* <Field.CountrySelect
                fullWidth
                name="country"
                label="Country"
                placeholder="Choose a country"
              />

              <Field.Text name="state" label="State/region" />
              <Field.Text name="city" label="City" />
              <Field.Text name="address" label="Address" />
              <Field.Text name="zipCode" label="Zip/code" />
              <Field.Select name="gender" label="Gender">
                <MenuItem key="M" value="M">
                  Male
                </MenuItem>
                <MenuItem key="F" value="F">
                  Female
                </MenuItem>
              </Field.Select> */}
              <Field.Select name="role" label="Role">
                <MenuItem key="Admin" value="Admin">
                  Admin
                </MenuItem>
                <MenuItem key="User" value="User">
                  User
                </MenuItem>
              </Field.Select>
              <Field.Text name="password" label="Password" type="password"/>
              <Field.Text name="confirmPassword" label="Confirm Password" type="password"/>
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create user' : 'Save changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
