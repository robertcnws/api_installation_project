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

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ServiceStageNewEditForm({ currentStageId, onReturnList }) {

  const { loadedServiceStages } = useDataContext();

  const lastOrderStage = useMemo(() => {
    if (loadedServiceStages && loadedServiceStages.length > 0) {
      return loadedServiceStages[loadedServiceStages.length - 1].order;
    }
    return 0;
  }, [loadedServiceStages]);

  const currentStage = useMemo(() => {
    if (currentStageId && loadedServiceStages) {
      return loadedServiceStages.find((stage) => stage.id === currentStageId);
    }
    return null;
  }, [currentStageId, loadedServiceStages]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [serviceStages, setServiceStages] = useState(null);

  useEffect(() => {
    if (loadedServiceStages && loadedServiceStages.length > 0) {
      setServiceStages(loadedServiceStages);
    }
  }, [loadedServiceStages]);

  const NewStageSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    order: zod
    .number()
    .int({ message: 'Order must be an integer.' })
    .min(1, { message: 'Order must be greater than zero.' }),
    description: schemaHelper.editor().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentStage?.name || '',
      description: currentStage?.description || '',
      order: currentStage?.order || lastOrderStage + 1,
    }),
    [currentStage, lastOrderStage]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewStageSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {

    const stageId = currentStage ? currentStage.id : null;
    const url = stageId ? `${CONFIG.apiUrl}/services/edit/stage/${stageId}/` : `${CONFIG.apiUrl}/services/create/stage/`;

    try {
      await axios.post(url, {
        name: data.name,
        order: data.order,
        description: stripHtmlUsingDOM(data.description),
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(stageId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.serviceStage.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" />
      <Field.Text name="order" label="Order" placeholder="Order" type="number" sx={{ mt: 2 }}/>
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {!currentStage ? 'Create service stage' : 'Update service stage'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
