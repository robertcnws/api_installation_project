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

export function DefaultGuideProductNewEditForm({ currentDefaultGuideProductId, onReturnList }) {

  const { loadedDefaultGuideProducts } = useDataContext();

  const lastOrderDefaultGuideProduct = useMemo(() => {
    if (loadedDefaultGuideProducts && loadedDefaultGuideProducts.length > 0) {
      return loadedDefaultGuideProducts[loadedDefaultGuideProducts.length - 1].order;
    }
    return 0;
  }, [loadedDefaultGuideProducts]);

  const currentDefaultGuideProduct = useMemo(() => {
    if (currentDefaultGuideProductId && loadedDefaultGuideProducts) {
      return loadedDefaultGuideProducts.find((defaultGuideProduct) => defaultGuideProduct.id === currentDefaultGuideProductId);
    }
    return null;
  }, [currentDefaultGuideProductId, loadedDefaultGuideProducts]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const [defaultGuideProducts, setDefaultGuideProducts] = useState(null);

  useEffect(() => {
    if (loadedDefaultGuideProducts && loadedDefaultGuideProducts.length > 0) {
      setDefaultGuideProducts(loadedDefaultGuideProducts);
    }
  }, [loadedDefaultGuideProducts]);

  const NewDefaultGuideProductSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    order: zod
      .number()
      .int({ message: 'Order must be an integer.' })
      .min(1, { message: 'Order must be greater than zero.' }),
    price: zod
      .number()
      .min(1, { message: 'Price must be greater than zero.' }),
    description: schemaHelper.editor().optional().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentDefaultGuideProduct?.name || '',
      description: currentDefaultGuideProduct?.description || '',
      order: currentDefaultGuideProduct?.order || lastOrderDefaultGuideProduct + 1,
      price: currentDefaultGuideProduct?.price || 0,
    }),
    [currentDefaultGuideProduct, lastOrderDefaultGuideProduct]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewDefaultGuideProductSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {

    const defaultGuideProductId = currentDefaultGuideProduct ? currentDefaultGuideProduct.id : null;
    const url = defaultGuideProductId ? `${CONFIG.apiUrl}/projects/edit/default-guide-product/${defaultGuideProductId}/` :
      `${CONFIG.apiUrl}/projects/create/default-guide-product/`;

    try {
      await axios.post(url, {
        name: data.name,
        order: data.order,
        price: data.price,
        description: stripHtmlUsingDOM(data.description),
        userReporter: userLogged?.data,
      });
      reset();
      toast.success(defaultGuideProductId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.defaultGuideProduct.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" />
      <Field.Text name="order" label="Order" placeholder="Order" type="number" sx={{ mt: 2 }} />
      <Field.Text name="price" label="Price" placeholder="Price" type="number" sx={{ mt: 2 }} />
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {!currentDefaultGuideProduct ? 'Create guide product' : 'Update guide product'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
