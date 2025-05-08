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
import { Chip, ListItem } from '@mui/material';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function DefaultMaterialNewEditForm({ currentDefaultMaterialId, onReturnList }) {

  const {
    loadedDefaultMaterials,
    loadedDefaultGuideProducts,
  } = useDataContext();

  const currentDefaultMaterial = useMemo(() => {
    if (currentDefaultMaterialId && loadedDefaultMaterials) {
      return loadedDefaultMaterials.find((defaultMaterial) => defaultMaterial.id === currentDefaultMaterialId);
    }
    return null;
  }, [currentDefaultMaterialId, loadedDefaultMaterials]);

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const NewDefaultMaterialSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    price: zod
      .number()
      .min(1, { message: 'Price must be greater than zero.' }),
    quantity: zod
      .number()
      .min(1, { message: 'Quantity must be greater than zero.' }),
    isPackaged: zod.boolean().optional(),
    packageQuantity: zod
      .number()
      .optional()
      .nullable(),
    defaultGuideProducts: zod
      .array(
        zod.object({
          id: zod.string(),
          name: zod.string(),
          description: zod.string().optional(),
          price: zod.number(),
          order: zod.number(),
        }))
      .min(1, { message: 'Select at least one guide product' }),
    description: schemaHelper.editor().optional().nullable(),
  }).refine(
    (data) => {
      if (data.isPackaged) {
        return (data.packageQuantity ?? 0) > 0;
      }
      return true;
    },
    {
      message: 'Package quantity must be greater than zero when packaged',
      path: ['packageQuantity'],
    }
  );

  const defaultValues = useMemo(
    () => ({
      name: currentDefaultMaterial?.name || '',
      description: currentDefaultMaterial?.description || '',
      price: currentDefaultMaterial?.price || 0,
      quantity: currentDefaultMaterial?.quantity || 0,
      isPackaged: currentDefaultMaterial?.isPackaged || false,
      packageQuantity: currentDefaultMaterial?.packageQuantity || 0,
      defaultGuideProducts: currentDefaultMaterial?.defaultGuideProducts || [],
    }),
    [currentDefaultMaterial]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewDefaultMaterialSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {

    const defaultMaterialId = currentDefaultMaterial ? currentDefaultMaterial.id : null;
    const url = defaultMaterialId ? `${CONFIG.apiUrl}/projects/edit/default-material/${defaultMaterialId}/` :
      `${CONFIG.apiUrl}/projects/create/default-material/`;

    try {
      await axios.post(url, {
        name: data.name,
        price: data.price,
        description: stripHtmlUsingDOM(data.description),
        quantity: data.quantity,
        isPackaged: data.isPackaged,
        packageQuantity: data.isPackaged ? data.packageQuantity : null,
        defaultGuideProducts: JSON.stringify(data.defaultGuideProducts),
        userReporter: JSON.stringify(userLogged?.data),
      });
      reset();
      toast.success(defaultMaterialId ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.defaultMaterial.list);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.error ? err.response.data.error : err.response.data.detail);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>

      <Field.Text name="name" label="Name" placeholder="Name" />
      <Field.Text name="price" label="Price" placeholder="Price" type="number" sx={{ mt: 2 }} />
      <Field.Text name="quantity" label="Quantity" placeholder="Quantity" type="number" sx={{ mt: 2 }} />
      <Field.Autocomplete
        sx={{ mt: 2 }}
        multiple
        name="defaultGuideProducts"
        placeholder="+ Guide products associated"
        control={methods.control}
        disableCloseOnSelect
        options={loadedDefaultGuideProducts || []}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, item) => (
          <ListItem {...props} key={item.id}>
            {item.name}
          </ListItem>
        )}
        renderTags={(selected, getTagProps) =>
          selected.map((item, index) => (
            <Chip
              {...getTagProps({ index })}
              key={item.id}
              size="small"
              variant="soft"
              label={item.name}
            />
          ))
        }
      />
      <Field.Switch name="isPackaged" label="Is Packaged?" sx={{ mt: 2 }} />
      {methods.watch('isPackaged') && (
        <Field.Text name="packageQuantity" label="Package Quantity" placeholder="Package Quantity" type="number" sx={{ mt: 2 }} disabled={!methods.watch('isPackaged')} />
      )}
      <Box sx={{ width: 80, color: 'text.secondary', mr: 2, mt: 2 }}>
        Description
      </Box>
      <Field.Editor name="description" placeholder="Description..." />
      <Stack alignItems="flex-end" sx={{ mt: 3, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ mr: 2 }}>
          {!currentDefaultMaterial ? 'Create material' : 'Update material'}
        </LoadingButton>
        <LoadingButton type="button" variant="outlined" onClick={onReturnList} disabled={isSubmitting}>
          Cancel
        </LoadingButton>
      </Stack>
    </Form>
  );
}
