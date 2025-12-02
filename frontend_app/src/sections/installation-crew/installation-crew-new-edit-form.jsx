import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { stripHtmlUsingDOM } from 'src/utils/helper';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';
import { isInstaller } from 'src/utils/check-permissions';
import { Avatar, TextField } from '@mui/material';
import { label } from 'yet-another-react-lightbox';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

const units = [
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
];

const typeCrews = [
  { label: 'On House', value: 'onHouse' },
  { label: 'Subcontractor', value: 'subcontractor' },
];

export function InstallationCrewNewEditForm({ currentInstallationCrewId, onReturnList }) {

  const {
    loadedInstallationCrews,
    loadedUsers,
  } = useDataContext();

  const currentInstallationCrew = useMemo(() => {
    if (currentInstallationCrewId && loadedInstallationCrews) {
      return loadedInstallationCrews.find((installationCrew) => installationCrew.id === currentInstallationCrewId);
    }
    return null;
  }, [currentInstallationCrewId, loadedInstallationCrews]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [installationCrews, setInstallationCrews] = useState(null);

  const [optionsHelpers, setOptionsHelpers] = useState(currentInstallationCrew?.usersHelpers || []);

  const installers = useMemo(() => {
    if (loadedUsers) {
      const firstFilteredUsers = loadedUsers?.filter((user) => isInstaller(user.userRole?.name));
      const finalFilteredUsers = firstFilteredUsers.filter(
        (user) => !installationCrews?.some((ic) =>
          ic.usersInstallers?.some((installer) => installer.id === user.id)
          && ic.id !== currentInstallationCrewId
      ));
      return finalFilteredUsers;
    }
    return [];
  }, [loadedUsers, installationCrews, currentInstallationCrewId]);

  useEffect(() => {
    if (loadedInstallationCrews && loadedInstallationCrews.length > 0) {
      setInstallationCrews(loadedInstallationCrews);
    }
  }, [loadedInstallationCrews]);

  useEffect(() => {
    setOptionsHelpers(currentInstallationCrew?.usersHelpers || []);
  }, [currentInstallationCrew]);

  const NewInstallationCrewSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    usersInstallers: zod.array(
      zod.object({
        id: zod.string(),
        username: zod.string(),
        firstName: zod.string(),
        lastName: zod.string(),
      })
    ).min(1, { message: 'At least one installer must be selected!' }),
    usersHelpers: zod.array(
      zod.object({
        name: zod.string(),
      })
    ).optional(),
    costByUnit: zod.coerce.number().min(0, { message: 'Cost by unit must be at least 0' }),
    unit: zod.object({
      value: zod.string(),
      label: zod.string(),
    }).nullable({ message: 'Unit is required!' }),
    typeCrew: zod.object({
      value: zod.string(),
      label: zod.string(),
    }).nullable({ message: 'Type crew is required!' }),
    isActive: zod.boolean().optional(),
    description: zod.string().optional(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentInstallationCrew?.name || '',
      usersInstallers: currentInstallationCrew?.usersInstallers || [],
      usersHelpers: currentInstallationCrew?.usersHelpers || [],
      costByUnit: currentInstallationCrew?.costByUnit || 0,
      unit: currentInstallationCrew?.unit || null,
      typeCrew: currentInstallationCrew?.typeCrew || null,
      isActive: currentInstallationCrew ? currentInstallationCrew.isActive : true,
      description: currentInstallationCrew?.description || '',
    }),
    [currentInstallationCrew]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewInstallationCrewSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [currentInstallationCrew, reset, defaultValues]);

  const upsertHelpers = (rawList) => {
    const seen = new Set();
    const normalized = [];

    rawList.forEach((item) => {
      const name = (typeof item === 'string' ? item : item?.name || '').trim();
      if (!name) return;

      const key = name.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      normalized.push({ name });
    });

    setOptionsHelpers(normalized);
    setValue('usersHelpers', normalized, { shouldValidate: true });
  };


  const onSubmit = handleSubmit(async (data) => {

    const icId = currentInstallationCrew ? currentInstallationCrew.id : null;
    const url = icId ? `${CONFIG.apiUrl}/projects/edit/installation-crew/${icId}/` : `${CONFIG.apiUrl}/projects/create/installation-crew/`;

    try {
      await axios.post(url, {
        name: data.name,
        usersInstallers: data.usersInstallers,
        usersHelpers: data.usersHelpers,
        costByUnit: data.costByUnit,
        unit: data.unit,
        typeCrew: data.typeCrew,
        isActive: data.isActive,
        description: data.description,
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(icId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.installationCrew.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" sx={{ mb: 2 }} />
      <Field.Autocomplete
        multiple
        name="usersInstallers"
        label="Installers"
        options={installers}
        getOptionLabel={(option) => `${option.firstName || option.first_name} ${option.lastName || option.last_name}`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <Box component="li" key={option.id} {...rest}>
              <Avatar sx={{ mr: 2 }}>
                {`${option.firstName[0]}${option.lastName[0]}`}
              </Avatar>
              {`${option.firstName} ${option.lastName}`}
            </Box>
          );
        }}
        sx={{ mb: 2 }}
      />
      <Field.Autocomplete
        multiple
        freeSolo
        name="usersHelpers"
        label="Assistants"
        options={optionsHelpers}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option?.name || '';
        }}
        isOptionEqualToValue={(option, value) => {
          const optName = typeof option === 'string' ? option : option?.name;
          const valName = typeof value === 'string' ? value : value?.name;
          return optName === valName;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Assistants"
            placeholder="Type a name and press Enter"
          />
        )}
        onChange={(event, newValue) => {
          upsertHelpers(newValue);
        }}
        onBlur={(event) => {
          const inputValue = (event.target.value || '').trim();
          if (!inputValue) return;
          upsertHelpers([...optionsHelpers, { name: inputValue }]);
        }}
        sx={{ mb: 2 }}
      />

      <Field.Autocomplete
        name="unit"
        label="Unit"
        options={units}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        sx={{ mb: 2 }}
      />
      <Field.Text
        name="costByUnit"
        label="Cost by unit"
        placeholder="Cost by unit"
        type="number"
        min="0"
        sx={{ mb: 2 }}
      />
      <Field.Autocomplete
        name="typeCrew"
        label="Crew type"
        options={typeCrews}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        sx={{ mb: 2 }}
      />
      <Field.Switch
        name="isActive"
        label="Is Active"
        sx={{ mb: 2 }}
      />
      <Field.Text
        name="description"
        label="Description"
        placeholder="Description"
        rows={4}
        multiline
        sx={{ mb: 2 }}
      />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {currentInstallationCrew ? 'Update installation crew' : 'Create installation crew'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
