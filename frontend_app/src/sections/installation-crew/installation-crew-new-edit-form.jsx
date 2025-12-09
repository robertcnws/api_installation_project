import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';
import { Avatar, TextField } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { useDataContext } from 'src/auth/context/data/data-context';
import { isInstaller } from 'src/utils/check-permissions';

// ----------------------------------------------------------------------

const units = [
  { label: 'Daily', value: 'daily' },
  { label: 'Hourly', value: 'hourly' },
];

const typeCrews = [
  { label: 'On House', value: 'onHouse' },
  { label: 'Subcontractor', value: 'subcontractor' },
];

const typeWorkings = [
  { label: 'Installation', value: 'installation' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Finish', value: 'finish' },
  { label: 'Service', value: 'service' },
];

// ----------------------------------------------------------------------

export function InstallationCrewNewEditForm({
  currentInstallationCrewId,
  onReturnList,
  refetchInstallationCrews = null,
}) {
  const { loadedInstallationCrews, loadedUsers } = useDataContext();
  const router = useRouter();

  const userLogged = useMemo(
    () => JSON.parse(sessionStorage.getItem('userLogged')),
    []
  );

  const currentInstallationCrew = useMemo(() => {
    if (currentInstallationCrewId && loadedInstallationCrews) {
      return loadedInstallationCrews.find(
        (installationCrew) => installationCrew.id === currentInstallationCrewId
      );
    }
    return null;
  }, [currentInstallationCrewId, loadedInstallationCrews]);

  // Helpers (assistants) como opciones
  const [optionsHelpers, setOptionsHelpers] = useState(
    currentInstallationCrew?.usersHelpers || []
  );

  useEffect(() => {
    setOptionsHelpers(currentInstallationCrew?.usersHelpers || []);
  }, [currentInstallationCrew]);

  // =======================
  //   SCHEMA ZOD
  // =======================

  const NewInstallationCrewSchema = zod
    .object({
      name: zod.string().min(1, { message: 'Name is required!' }),

      usersInstallers: zod
        .array(
          zod.object({
            id: zod.string(),
            username: zod.string(),
            firstName: zod.string(),
            lastName: zod.string(),
          })
        )
        .min(1, { message: 'At least one installer must be selected!' }),

      usersHelpers: zod
        .array(
          zod.object({
            name: zod.string(),
          })
        )
        .optional(),

      costByUnit: zod.coerce.number().optional(),

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
        .nullable({ message: 'Crew type is required!' }),

      typeWorking: zod
        .object({
          value: zod.string(),
          label: zod.string(),
        })
        .nullable({ message: 'Working type is required!' }),

      isActive: zod.boolean().optional(),
      description: zod.string().optional(),
    })
    .superRefine((data, ctx) => {
      // typeWorking requerido
      if (!data.typeWorking) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ['typeWorking'],
          message: 'Working type is required!',
        });
        return;
      }

      const isInstallation = data.typeWorking.value.toLowerCase() === 'installation';
      const isOnHouse = data.typeCrew?.value.toLowerCase() === 'onhouse';

      // Para tipo Installation → unit y costByUnit obligatorios
      if (isInstallation && isOnHouse) {
        if (!data.unit) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            path: ['unit'],
            message: 'Unit is required for installation crews!',
          });
        }

        if (data.costByUnit === undefined || data.costByUnit === null || Number.isNaN(data.costByUnit)) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            path: ['costByUnit'],
            message: 'Cost by unit is required for installation crews!',
          });
        } else if (data.costByUnit < 0) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            path: ['costByUnit'],
            message: 'Cost by unit must be at least 0',
          });
        }
      }
    });

  // =======================
  //   DEFAULT VALUES
  // =======================

  const defaultValues = useMemo(
    () => ({
      name: currentInstallationCrew?.name || '',
      usersInstallers: currentInstallationCrew?.usersInstallers || [],
      usersHelpers: currentInstallationCrew?.usersHelpers || [],
      costByUnit:
        typeof currentInstallationCrew?.costByUnit === 'number'
          ? currentInstallationCrew.costByUnit
          : undefined,
      unit: currentInstallationCrew?.unit || null,
      typeCrew: currentInstallationCrew?.typeCrew || null,
      typeWorking: currentInstallationCrew?.typeWorking || null,
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
    watch,
  } = methods;

  const values = watch();

  useEffect(() => {
    reset(defaultValues);
  }, [currentInstallationCrew, reset, defaultValues]);

  // =======================
  //   HELPERS HANDLER
  // =======================

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

  // =======================
  //   WORKERS OPTIONS
  // =======================

  const workers = useMemo(() => {
    if (!loadedUsers) return [];

    const workingType = values.typeWorking?.value;

    let installers = [];

    if (workingType === 'installation') {
      installers = loadedUsers.filter((user) => isInstaller(user.userRole?.name));
    } else if (workingType === 'inspection') {
      installers = loadedUsers.filter((user) => !isInstaller(user.userRole?.name));
    } else {
      // para finish / service / etc → puedes ajustar la lógica
      installers = loadedUsers.filter((user) => isInstaller(user.userRole?.name));
    }

    return installers;
  }, [loadedUsers, values.typeWorking]);

  // =======================
  //   SUBMIT
  // =======================

  const onSubmit = handleSubmit(async (data) => {
    const icId = currentInstallationCrew ? currentInstallationCrew.id : null;
    const url = icId
      ? `${CONFIG.apiUrl}/projects/edit/installation-crew/${icId}/`
      : `${CONFIG.apiUrl}/projects/create/installation-crew/`;

    const isInstallation = data.typeWorking?.value === 'installation';

    // 🔹 Payload base
    const payload = {
      name: data.name,
      usersInstallers: data.usersInstallers,
      usersHelpers: data.usersHelpers || [],
      typeCrew: data.typeCrew,
      typeWorking: data.typeWorking,
      isActive: data.isActive,
      description: data.description,
      userReporter: userLogged?.data,
      // Solo si es installation agregamos estos campos
      ...(isInstallation && {
        costByUnit: data.costByUnit,
        unit: data.unit,
      }),
    };

    try {
      await axios.post(url, payload);
      reset();
      toast.success(icId ? 'Update success!' : 'Create success!');
      onReturnList?.();
      refetchInstallationCrews?.();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Error saving installation crew';
      toast.error(msg);
    }
  });

  // =======================
  //   RENDER
  // =======================

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Field.Text name="name" label="Name" placeholder="Name" sx={{ mb: 2 }} />

      <Field.Autocomplete
        name="typeWorking"
        label="Working type"
        options={typeWorkings}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        sx={{ mb: 2 }}
        onChange={(_, newValue) => {
          setValue('typeWorking', newValue, { shouldValidate: true });
          // Reset de instaladores y helpers cuando cambia el tipo
          setValue('usersInstallers', [], { shouldValidate: true });
          upsertHelpers([]);
          // También podemos limpiar unit / costByUnit cuando deja de ser installation
          if (newValue?.value !== 'installation') {
            setValue('unit', null, { shouldValidate: false });
            setValue('costByUnit', undefined, { shouldValidate: false });
          }
        }}
      />

      {/* Solo mostramos el resto del formulario si ya eligieron tipo de trabajo */}
      {values.typeWorking && (
        <>
          <Field.Autocomplete
            multiple
            name="usersInstallers"
            label="Installers"
            options={workers}
            getOptionLabel={(option) =>
              `${option.firstName || option.first_name} ${option.lastName || option.last_name
              }`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={option.id} {...rest}>
                  <Avatar sx={{ mr: 2 }}>
                    {`${(option.firstName || option.first_name)?.[0] ?? ''}${(option.lastName || option.last_name)?.[0] ?? ''
                      }`}
                  </Avatar>
                  {`${option.firstName || option.first_name} ${option.lastName || option.last_name
                    }`}
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
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option?.name || ''
            }
            isOptionEqualToValue={(option, value) => {
              const optName = typeof option === 'string' ? option : option?.name;
              const valName = typeof value === 'string' ? value : value?.name;
              return (optName || '').toLowerCase() === (valName || '').toLowerCase();
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assistants"
                placeholder="Type a name and press Enter"
              />
            )}
            onChange={(_, newValue) => {
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
            name="typeCrew"
            label="Crew type"
            options={typeCrews}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            sx={{ mb: 2 }}
          />

          {/* Campos solo para INSTALLATION */}
          {(values.typeWorking?.value?.toLowerCase() === 'installation' &&
            values.typeCrew?.value?.toLowerCase() === 'onhouse') && (
              <>
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
                  inputProps={{ min: 0 }}
                  sx={{ mb: 2 }}
                />
              </>
            )}



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

          <Stack
            alignItems="flex-end"
            sx={{
              mt: 3,
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              sx={{ mr: 2 }}
            >
              {currentInstallationCrew
                ? 'Update installation crew'
                : 'Create installation crew'}
            </LoadingButton>

            <LoadingButton
              type="button"
              variant="outlined"
              onClick={onReturnList}
              disabled={isSubmitting}
            >
              Cancel
            </LoadingButton>
          </Stack>
        </>
      )}
    </Form>
  );
}
