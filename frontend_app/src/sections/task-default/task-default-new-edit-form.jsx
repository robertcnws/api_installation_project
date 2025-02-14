import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CONFIG } from 'src/config-global';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import { useDataContext } from 'src/auth/context/data/data-context';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';


import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { Chip, MenuItem } from '@mui/material';
import { useUserList } from 'src/_mock/_user';
import { stripHtmlUsingDOM } from 'src/utils/helper';
import { TaskDefaultStageStatus } from './task-default-stage-status';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function TaskDefaultNewEditForm({ currentDefaultTaskId, onReturnList }) {

  const { loadedStages, loadedDefaultTasks } = useDataContext();

  const lastOrder = useMemo(() => {
    if (loadedDefaultTasks && loadedDefaultTasks.length > 0) {
      return loadedDefaultTasks.reduce((max, task) => (task.order > max ? task.order : max), 0);
    }
    return 0;
  }, [loadedDefaultTasks]);

  const current = useMemo(() => {
    if (currentDefaultTaskId && loadedDefaultTasks && loadedDefaultTasks.length > 0) {
      return loadedDefaultTasks.find((task) => task.id === currentDefaultTaskId);
    }
    return null;
  }, [currentDefaultTaskId, loadedDefaultTasks]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [stages, setStages] = useState(null);

  useEffect(() => {
    if (loadedStages && loadedStages.length > 0) {
      setStages(loadedStages);
    }
  }, [loadedStages]);

  const NewSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    projectStageStatus: zod.string(),
    projectStage: zod.object({
      id: zod.string(),
      name: zod.string(),
      order: zod.number(),
      description: zod.string().optional().nullable(),
    }),
    order: zod.number()
      .int({ message: 'Order must be an integer.' })
      .min(1, { message: 'Order must be greater than zero.' }),
    description: schemaHelper.editor().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: current?.name || '',
      description: current?.description || '',
      order: current?.order || lastOrder + 1,
      projectStage: current?.projectStage || null,
      projectStageStatus: current?.projectStageStatus || 'not started',
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
    const url = stageId ? `${CONFIG.apiUrl}/projects/edit/default-task/${stageId}/` : `${CONFIG.apiUrl}/projects/create/default-task/`;

    try {
      await axios.post(url, {
        name: data.name,
        order: data.order,
        description: stripHtmlUsingDOM(data.description),
        projectStage: data.projectStage,
        projectStageStatus: data.projectStageStatus,
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(stageId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.task.list);
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
        name="projectStage"
        label="Installation Stage"
        placeholder="Installation Stage"
        control={control}
        // disableCloseOnSelect
        options={loadedStages || []}
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
        name="projectStageStatus"
        control={control}
        render={({ field }) => (
          <TaskDefaultStageStatus
            linkedStatus={field.value}
            onChangeLinkedStatus={field.onChange}
          />
        )}
      />
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." control={control}/>
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {!currentDefaultTaskId ? 'Create task' : 'Update task'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
