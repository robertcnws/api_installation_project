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

export function ServiceIssueNewEditForm({ currentServiceIssueId, onReturnList }) {

  const { loadedServiceIssues } = useDataContext();

  const currentServiceIssue = useMemo(() => {
    if (currentServiceIssueId && loadedServiceIssues) {
      return loadedServiceIssues.find((serviceIssue) => serviceIssue.id === currentServiceIssueId);
    }
    return null;
  }, [currentServiceIssueId, loadedServiceIssues]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [serviceIssues, setServiceIssues] = useState(null);

  useEffect(() => {
    if (loadedServiceIssues && loadedServiceIssues.length > 0) {
      setServiceIssues(loadedServiceIssues);
    }
  }, [loadedServiceIssues]);

  const NewServiceIssueSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    description: schemaHelper.editor().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentServiceIssue?.name || '',
      description: currentServiceIssue?.description || '',
    }),
    [currentServiceIssue]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewServiceIssueSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {

    const serviceIssueId = currentServiceIssue ? currentServiceIssue.id : null;
    const url = serviceIssueId ? `${CONFIG.apiUrl}/services/edit/service-issue/${serviceIssueId}/` : `${CONFIG.apiUrl}/services/create/service-issue/`;

    try {
      await axios.post(url, {
        name: data.name,
        order: data.order,
        description: stripHtmlUsingDOM(data.description),
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(serviceIssueId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.serviceIssue.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" />
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {!currentServiceIssue ? 'Create service issue' : 'Update service issue'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
