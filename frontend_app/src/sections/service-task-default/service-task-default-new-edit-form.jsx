import axios from 'axios';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import React, { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Chip, Switch } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { stripHtmlUsingDOM } from 'src/utils/helper';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ServiceTaskDefaultStageStatus } from './service-task-default-stage-status';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ServiceTaskDefaultNewEditForm({ currentDefaultTaskId, onReturnList }) {

  const { loadedServiceStages, loadedServiceDefaultTasks } = useDataContext();

  const lastOrder = useMemo(() => {
    if (loadedServiceDefaultTasks && loadedServiceDefaultTasks.length > 0) {
      return loadedServiceDefaultTasks.reduce((max, task) => (task.order > max ? task.order : max), 0);
    }
    return 0;
  }, [loadedServiceDefaultTasks]);

  const current = useMemo(() => {
    if (currentDefaultTaskId && loadedServiceDefaultTasks && loadedServiceDefaultTasks.length > 0) {
      return loadedServiceDefaultTasks.find((task) => task.id === currentDefaultTaskId);
    }
    return null;
  }, [currentDefaultTaskId, loadedServiceDefaultTasks]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [stages, setStages] = useState(null);

  useEffect(() => {
    if (loadedServiceStages && loadedServiceStages.length > 0) {
      setStages(loadedServiceStages);
    }
  }, [loadedServiceStages]);

  const NewSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    serviceStageStatus: zod.string(),
    serviceStage: zod.object({
      id: zod.string(),
      name: zod.string(),
      order: zod.number(),
      description: zod.string().optional().nullable(),
    }),
    order: zod.number()
      .int({ message: 'Order must be an integer.' })
      .min(1, { message: 'Order must be greater than zero.' }),
    description: schemaHelper.editor().optional().nullable(),
    hasAttachments: zod.boolean().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: current?.name || '',
      description: current?.description || '',
      order: current?.order || lastOrder + 1,
      serviceStage: current?.serviceStage || null,
      serviceStageStatus: current?.serviceStageStatus || 'not started',
      hasAttachments: current?.hasAttachments ?? false,
    }),
    [current, lastOrder]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {

    const stageId = current ? current.id : null;
    const url = stageId ? `${CONFIG.apiUrl}/services/edit/default-task/${stageId}/` : `${CONFIG.apiUrl}/services/create/default-task/`;

    try {
      await axios.post(url, {
        name: data.name,
        order: data.order,
        description: stripHtmlUsingDOM(data.description),
        serviceStage: data.serviceStage,
        serviceStageStatus: data.serviceStageStatus,
        userReporter: userLogged?.data,
        hasAttachments: data.hasAttachments,
      });
      reset();
      toast.success(stageId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.serviceTask.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" control={control} />
      <Field.Text name="order" label="Order" placeholder="Order" type="number" control={control} sx={{ mt: 2 }} />
      <Field.Autocomplete
        name="serviceStage"
        label="Service Stage"
        placeholder="Service Stage"
        control={control}
        // disableCloseOnSelect
        options={loadedServiceStages || []}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) =>
          value.id ? option.id === value.id : option.id === value._id
        }
        sx={{ mt: 2 }}
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
      <Box sx={{ width: 200, color: 'text.secondary', mr: 2, mt: 2 }}>
        Linked Status
      </Box>
      <Controller
        name="serviceStageStatus"
        control={control}
        render={({ field }) => (
          <ServiceTaskDefaultStageStatus
            linkedStatus={field.value}
            onChangeLinkedStatus={field.onChange}
          />
        )}
      />
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left', justifyContent: 'flex-start', mt: 2 }}>
        <Box sx={{ color: 'text.secondary', mr: 2 }}>
          Has Attachments?
        </Box>
        <Controller
          name="hasAttachments"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <Switch
              {...field}
              color="primary"
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              sx={{ mt: -1 }}
            />
          )}
        />
      </Box>
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." control={control} />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {!currentDefaultTaskId ? 'Create service task' : 'Update service task'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
