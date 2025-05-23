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

export function StageNewEditForm({ currentStageId, onReturnList }) {

  const { loadedStages } = useDataContext();

  const lastOrderStage = useMemo(() => {
    if (loadedStages && loadedStages.length > 0) {
      return loadedStages[loadedStages.length - 1].order;
    }
    return 0;
  }, [loadedStages]);

  const currentStage = useMemo(() => {
    if (currentStageId && loadedStages) {
      return loadedStages.find((stage) => stage.id === currentStageId);
    }
    return null;
  }, [currentStageId, loadedStages]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [stages, setStages] = useState(null);

  useEffect(() => {
    if (loadedStages && loadedStages.length > 0) {
      setStages(loadedStages);
    }
  }, [loadedStages]);

  const NewStageSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    otherName: zod.string().min(1, { message: 'Other Name is required!' }),
    order: zod
    .number()
    .int({ message: 'Order must be an integer.' })
    .min(1, { message: 'Order must be greater than zero.' }),
    description: schemaHelper.editor().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentStage?.name || '',
      otherName: currentStage?.otherName || '',
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
    const url = stageId ? `${CONFIG.apiUrl}/projects/edit/stage/${stageId}/` : `${CONFIG.apiUrl}/projects/create/stage/`;

    try {
      await axios.post(url, {
        name: data.name,
        otherName: data.otherName,
        order: data.order,
        description: stripHtmlUsingDOM(data.description),
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(stageId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.stage.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" />
      <Field.Text name="otherName" label="Other Name (Attachments)" placeholder="Other Name (Attachments)" sx={{ mt: 2 }}/>
      <Field.Text name="order" label="Order" placeholder="Order" type="number" sx={{ mt: 2 }}/>
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {!currentStage ? 'Create project stage' : 'Update project stage'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
