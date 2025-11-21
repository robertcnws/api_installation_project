import axios from 'axios';
import { z as zod } from 'zod';
import isEqual from 'lodash.isequal';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, Table, Button, Tooltip, TableRow, TableBody, TableCell, TableHead, TextField, IconButton, TableFooter, TableContainer } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { listRolesAndSubroles } from 'src/utils/check-permissions';
import { buildMaterialsReport } from 'src/utils/project-tasks-utils';
import { combineByName, createScopeArray, generateInstallationGuideFormReport } from 'src/utils/generate-installation-guide-pdf';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectEditModalNotesView } from './project-edit-modal-notes-view';
import { ProjectDetailsContentOverview } from '../project-details-content-overview';

// ----------------------------------------------------------------------

export function ProjectDetailsInstallationGuideFormView({
  project,
  refetchProject,
  listPermissions,
  openDialogs,
  setOpenDialogs,
  loadedDefaultGuideProducts,
  loadedDefaultMaterials,
}) {

  useEffect(() => {
    refetchProject?.();
  }, [refetchProject]);

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  // const listItems = useMemo(() => project?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases'), [project]);

  const allItems = useMemo(() => project?.salesOrder?.line_items, [project]);

  const listItems = useMemo(() => allItems?.filter((product) => product.line_item_type === 'goods'), [allItems]);

  const [currentProject, setCurrentProject] = useState(null);

  const [currentItem, setCurrentItem] = useState(null);

  const [currentType, setCurrentType] = useState(null);

  const openNotes = useBoolean();

  const handleOpenNotes = (product) => {
    setCurrentItem(product);
    openNotes.onTrue();
  };

  

  const [materials, setMaterials] = useState(
    project?.projectMaterials.length > 0 ?
      combineByName(project?.projectMaterials) :
      [],
  );

  const [productsData, setProductsData] = useState([]);

  // Cargar productos iniciales
  useEffect(() => {
    if (listItems.length > 0) {
      const items = createScopeArray({ listItems, loadedDefaultGuideProducts }).filter((item) => item.quantity > 0).map((item) => ({
        ...item,
        isNew: false,
        checked: item?.checked || false,
      }));

      const lastItems = items.map((item) => {
        const product = project?.projectGuideProducts?.find((p) => p.id === item.id);

        const finalItem = {
          ...item,
          name: product?.name || item.name,
          price: product?.price || (item.name.toLowerCase().includes('mullion') ? 0 : item.price),
          quantity: product?.quantity || item.quantity,
          notes: product?.notes || '',
          checked: product?.checked || false,
          deleted: product?.deleted || false,
        }
        return finalItem;
      });
      const newItems = project?.projectGuideProducts?.filter((item) => !lastItems.some((i) => i.id === item.id)) || [];

      const joinedItems = [...lastItems, ...newItems];

      const finalItems = joinedItems.filter((item) => !item.deleted);

      setProductsData(combineByName(finalItems.sort((a, b) => a.id - b.id)));
    }
  }, [listItems, project, loadedDefaultGuideProducts]);


  useEffect(() => {
    if (project && productsData?.length > 0 && materials?.length > 0) {
      const current = {
        ...project,
        projectGuideProducts: combineByName(productsData),
        projectMaterials: materials,
      }
      setCurrentProject(current);
    }
  }, [project, productsData, materials]);

  

  useEffect(() => {
    const socket = new WebSocket(`${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/project/${project?.id}/`);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
        setProductsData(
          (prevData) => project?.id === message.item.id ?
            combineByName(message.item.projectGuideProducts).filter((item) => !item.deleted) :
            prevData
        );
        setMaterials((prevData) => project?.id === message.item.id ? message.item.projectMaterials : prevData);
      }
      else if (message.type === 'deleted') {
        setProductsData((prevData) => {
          if (project?.id === message.item.id) {
            return null;
          }
          return prevData;
        });
        setMaterials((prevData) => {
          if (project?.id === message.item.id) {
            return null;
          }
          return prevData;
        });
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [project]);

  useEffect(() => {
    if (project?.projectMaterials?.length === 0) {
      const arrayMaterials = buildMaterialsReport(productsData, loadedDefaultMaterials);
      setMaterials(arrayMaterials);
    }
  }, [project?.projectMaterials, loadedDefaultMaterials, productsData]);


  const totalPrice = useMemo(() => (
    productsData?.reduce((acc, product) => acc + (product.price * product.quantity || 0), 0)
  ), [productsData]);

  const handleAddProduct = () => {
    const lastIndex = productsData.reduce((max, obj) => obj.id > max.id ? obj : max, productsData[0])?.id || 0;
    setProductsData((prev) => [
      ...prev,
      {
        id: lastIndex + 1,
        name: '',
        price: 0,
        quantity: 1,
        notes: '',
        isNew: true,
        checked: false,
      }
    ]);
  };

  const handleRemoveProduct = useCallback(async (id) => {
    try {
      const formData = new FormData();
      formData.append('userReporter', JSON.stringify(userLogged?.data));
      formData.append('product', JSON.stringify(productsData.find((p) => p.id === id)));

      const promise = axios.post(`${CONFIG.apiUrl}/projects/remove/project/${project?.id}/guide-product/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await promise;

    } catch (error) {
      console.error(error);
    }
  }, [userLogged, project, productsData]);

  const handleProductChange = (id, field, value) => {
    setProductsData((prev) => (
      prev.map((item) => (
        item.id === id ? { ...item, [field]: value } : item
      ))
    ));
  };

  const isValidProductRow = (product) => product?.name?.trim() !== '' &&
    (product?.name?.toLowerCase().includes('mullion') ? Number(product?.price) >= 0 : Number(product?.price) > 0) &&
    product?.quantity > 0;

  const canAddProduct = useMemo(() => {
    if (productsData?.length === 0) return true;
    const lastProduct = productsData[productsData.length - 1];
    return lastProduct?.name?.trim() !== '' &&
      (lastProduct?.name?.toLowerCase().includes('mullion') ? Number(lastProduct?.price) >= 0 : Number(lastProduct?.price) > 0) &&
      lastProduct?.quantity > 0;
  }, [productsData]);

  const handleAddMaterial = () => {
    const lastIndex = materials.reduce((max, obj) => obj.id > max.id ? obj : max, materials[0])?.id || 0;
    setMaterials((prev) => [
      ...prev,
      {
        id: lastIndex + 1,
        name: '',
        quantity: 1,
        ticket: '',
        cost: 0,
        store: '',
        notes: '',
        isNew: true,
      }
    ]);
  };

  const handleRemoveMaterial = (id) => {
    setMaterials((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMaterialChange = (id, field, value) => {
    setMaterials((prev) => (
      prev.map((item) => (
        item.id === id ? { ...item, [field]: value } : item
      ))
    ));
  };

  const canAddMaterial = useMemo(() => {
    if (materials?.length === 0) return true;
    const lastMaterial = materials[materials.length - 1];
    return lastMaterial?.name.trim() !== '' &&
      lastMaterial?.quantity > 0 &&
      lastMaterial?.cost > 0;
    // lastMaterial.store.trim() !== '' &&
    // lastMaterial.ticket.trim() !== '';
  }, [materials]);

  const totalCost = useMemo(() => (
    materials.reduce((acc, material) => acc + (material.cost * material.quantity || 0), 0)
  ), [materials]);

  const ProjectInstallationGuideSchema = zod.object({
    workScope: zod.string().optional(),
    otherNotes: zod.string().optional(),
    projectGuideProducts: zod.array(zod.object({}).passthrough()).default([]),
    projectMaterials: zod.array(zod.object({}).passthrough()).default([]),
  });

  const defaultValues = useMemo(() => ({
    workScope: project?.workScope || '',
    otherNotes: project?.projectMaterialsOtherNotes || '',
    projectGuideProducts: combineByName(project?.projectGuideProducts || []),
    projectMaterials: project?.projectMaterials || [],
  }), [project]);

  const methods = useForm({
    resolver: zodResolver(ProjectInstallationGuideSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    setValue,
    isSubmitting,
    control,
    formState: { isDirty },
  } = methods;

  const isFormValid = useMemo(() => {
    const areProductsValid = productsData?.length === 0 || productsData?.every((product) =>
      product?.name?.trim() !== '' &&
      Number(product?.quantity) > 0 &&
      (product?.name?.toLowerCase().includes('mullion') ? Number(product?.price) >= 0 : Number(product?.price) > 0)
    );

    const areMaterialsValid = materials?.length === 0 || materials?.every((material) =>
      material?.name.trim() !== '' &&
      Number(material?.quantity) > 0 &&
      Number(material?.cost) > 0
      // material.store.trim() !== '' &&
      // material.ticket.trim() !== ''
    );

    return areProductsValid && areMaterialsValid;
  }, [productsData, materials]);

  useEffect(() => {
    if (!isDirty) {
      reset(defaultValues);
    }
  }, [isDirty, reset, defaultValues]);

  useEffect(() => {
    setValue('projectGuideProducts', productsData);
  }, [productsData, setValue]);

  useEffect(() => {
    setValue('projectMaterials', materials);
  }, [materials, setValue]);

  const currentValues = useWatch({ control });

  const normalizeProducts = (products = []) =>
    products.map((p) => {
      if (p.name && p.name.toLowerCase().includes('mullion')) {
        return { ...p, price: p.price || 0 };
      }
      return p;
    });

  const sortById = (arr = []) => arr.slice().sort((a, b) => a.id - b.id);

  const normalizeValues = useCallback(
    (values) => ({
      ...values,
      projectGuideProducts: sortById(normalizeProducts(combineByName(values.projectGuideProducts))),
      projectMaterials: sortById(values.projectMaterials || []),
    }), []);

  const normalizedDefaultValues = useMemo(() => normalizeValues(defaultValues), [defaultValues, normalizeValues]);
  const normalizedCurrentValues = useMemo(() => normalizeValues(currentValues), [currentValues, normalizeValues]);

  const normalizedDefault = useMemo(() => JSON.parse(JSON.stringify(normalizedDefaultValues)), [normalizedDefaultValues]);
  const normalizedCurrent = useMemo(() => JSON.parse(JSON.stringify(normalizedCurrentValues)), [normalizedCurrentValues]);

  // console.log('normalizedDefault', normalizedDefault);
  // console.log('normalizedCurrent', normalizedCurrent);
  // console.log('!isEqual(normalizedCurrent, normalizedDefault)', !isEqual(normalizedCurrent, normalizedDefault));

  const isCustomDirty = useMemo(
    () => !isEqual(normalizedCurrent, normalizedDefault),
    [normalizedCurrent, normalizedDefault],
  );

  const allProductsChecked = useMemo(() => productsData?.every((product) => product.checked), [productsData]);


  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();
      // formData.append('workScope', data.workScope);
      formData.append('projectMaterialsOtherNotes', data.otherNotes);
      formData.append('projectGuideProducts', JSON.stringify(productsData));
      formData.append('projectMaterials', JSON.stringify(materials));
      formData.append('userReporter', JSON.stringify(userLogged?.data));

      const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project?.id}/change-installation-guide-form/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Installation Guide Form updated successfully!',
        error: 'Installation Guide Form updated error!',
      });

      await promise;

    } catch (error) {
      console.error(error);
    }
  });

  const handleCheckProduct = async (id) => {
    const product = productsData.find((p) => p.id === id);
    const maxId = productsData.reduce((max, obj) => obj.id > max.id ? obj : max, productsData[0]).id;
    const newProduct = {
      ...product,
      checked: true,
      isNew: false,
      predefined: true,
      id: product.id ? product.id : Number(maxId) + 1,
    };
    try {
      const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project?.id}/check-item-installation-guide/`, {
        product: JSON.stringify(newProduct),
        userReporter: JSON.stringify(userLogged?.data),
      });
      await promise;
      setProductsData((prev) => prev.map((p) => (p.id === id ? newProduct : p)).filter((p) => !p.deleted));
    }
    catch (error) {
      console.error(error);
    }
  };

  const renderContent = (
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', maxHeight: !isMobile ? 655 : 'auto', minHeight: !isMobile ? 655 : 'auto', overflow: 'auto' }}>
      {/* {!isFormValid || !isCustomDirty && ( */}
      {/* <Stack spacing={1} direction="row"> */}

      {/* </Stack> */}
      {/* )} */}
      {[
        {
          label: (
            <Stack spacing={1} direction="row">
              <Typography variant='subtitle2'>Work Scope & Description</Typography>
              <IconButton variant="text" color={project?.description ? "primary" : "warning"} size="small" sx={{
                // ml: -15, 
                minWidth: 15,
                mt: -1,
                '&:hover': {
                  boxShadow: 'none',
                  backgroundColor: 'transparent',
                },
              }}
                onClick={() => setOpenDialogs({ ...openDialogs, description: true })}
              >
                <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
              </IconButton>
            </Stack>
          ),
          value: (
            <>
              <Stack spacing={1} direction="column">
                {/* <Field.Text multiline rows={4} name="workScope" placeholder="Write your work scope & description here..." /> */}
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'justify' }}>
                  {project?.workScope || 'No work scope & description provided.'}
                </Typography>
              </Stack>
              <br />
            </>
          ),
          icon: <Iconify icon="arcticons:radarscope" />,
        },
        {
          label: (
            <Stack spacing={1} direction="row">
              <Typography variant='subtitle2'>Items</Typography>
              {project?.projectGuideProducts?.length === 0 && (
                <Label color="error">This info has not been saved yet...</Label>
              )}
            </Stack>
          ),
          value: (
            <>
              <Stack spacing={1} direction="column">
                <TableContainer>
                  <Table dense="true">
                    <TableHead>
                      <TableRow>
                        {!isMobile ? (
                          <>
                            <TableCell>Item</TableCell>
                            <TableCell>Pay</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell>
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: materials.length === 0 ? 'space-between' : 'flex-end'
                              }}>
                                <Typography sx={{ mt: productsData.length !== 0 ? 0.4 : 1.5 }} variant='subtitle2'>Notes</Typography>
                                {(productsData.length === 0 && !listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mr: -25 }}>
                                    <IconButton variant="outlined" color='success' onClick={handleAddProduct} disabled={!canAddProduct} sx={{
                                      '&:hover': {
                                        boxShadow: 'none',
                                        backgroundColor: 'transparent',
                                      },
                                    }}>
                                      <Iconify icon="lets-icons:add-duotone" sx={{
                                        width: 30,
                                        height: 30,
                                      }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                              <TableCell>
                                <Box sx={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  justifyContent: materials.length === 0 ? 'space-between' : 'flex-end'
                                }}>
                                  <Typography sx={{ mt: productsData.length !== 0 ? 0.4 : 1.5 }} variant='subtitle2'>Checked?</Typography>
                                  {(productsData.length === 0 && listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mr: -20 }}>
                                      <IconButton variant="outlined" color='success' onClick={handleAddProduct} disabled={!canAddProduct} sx={{
                                        '&:hover': {
                                          boxShadow: 'none',
                                          backgroundColor: 'transparent',
                                        },
                                      }}>
                                        <Iconify icon="lets-icons:add-duotone" sx={{
                                          width: 30,
                                          height: 30,
                                        }} />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                            )}
                          </>
                        ) : (
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Typography sx={{ mt: productsData.length === 0 ? 1.5 : 0 }}>Items</Typography>
                              {productsData.length === 0 && (
                                <IconButton variant="outlined" color='success' onClick={handleAddProduct} disabled={!canAddProduct} sx={{
                                  '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'transparent',
                                  },
                                  mr: -18,
                                }}>
                                  <Iconify icon="lets-icons:add-duotone" sx={{ width: 30, height: 30 }} />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        )}
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productsData.map((product, index) => (
                        <TableRow key={`item-${product.id}`}>
                          {!isMobile ? (
                            <>
                              <TableCell sx={{ width: 200 }}>
                                {
                                  (product.isNew ||
                                    !product.checked ||
                                    listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                    <TextField
                                      multiline
                                      minRows={1}
                                      maxRows={2}
                                      value={product.name}
                                      placeholder="Enter name..."
                                      sx={{ width: 200 }}
                                      InputProps={{
                                        sx: { height: '40px' }
                                      }}
                                      onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                                    />
                                  ) : product.name
                                }
                              </TableCell>
                              <TableCell sx={{ width: 70 }}>
                                {
                                  (product.isNew ||
                                    !product.predefined ||
                                    !product.checked ||
                                    listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                    <TextField
                                      type="number"
                                      min={product.name.toLowerCase().includes('mullion') ? 0 : 1}
                                      value={product.price}
                                      placeholder="Price..."
                                      sx={{ width: 70 }}
                                      InputProps={{
                                        sx: { height: '30px' }
                                      }}
                                      onChange={(e) => handleProductChange(product.id, 'price', Math.max(0, e.target.value))}
                                    />
                                  ) : product.price
                                }
                              </TableCell>
                              <TableCell sx={{ width: 50 }}>
                                {
                                  (product.isNew ||
                                    !product.checked ||
                                    listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                    <TextField
                                      type="number"
                                      min="0"
                                      value={product.quantity || ''}
                                      placeholder="Qty"
                                      sx={{ width: 50 }}
                                      InputProps={{
                                        sx: { height: '30px' }
                                      }}
                                      onChange={(e) => handleProductChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                    />
                                  ) : product.quantity
                                }
                              </TableCell>
                              <TableCell align="right" sx={{ width: 100 }}>
                                {fCurrency(product.price * product.quantity)}
                              </TableCell>
                              <TableCell align="right">
                                <Label
                                  color={product.notes ? "warning" : "default"}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    handleOpenNotes(product)
                                    setCurrentType('item')
                                  }}
                                >
                                  {product.notes ? 'Edit Note' : 'Add Note'}
                                </Label>
                              </TableCell>
                              {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                                <TableCell>
                                  <Tooltip title={`Checked: ${product.checked ? 'Yes' : 'No'}`} arrow>
                                    {product.checked ?
                                      <Iconify icon="lets-icons:check-fill" sx={{ width: 20, height: 20, color: 'success.main' }} /> :
                                      <Iconify icon="clarity:error-solid" sx={{ width: 20, height: 20, color: 'error.main' }} />}
                                  </Tooltip>
                                </TableCell>
                              )}
                            </>
                          ) : (
                            <TableCell align="left">
                              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Product: </Typography>
                                {
                                  (product.isNew ||
                                    !product.checked ||
                                    listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                    <TextField
                                      value={product.name}
                                      placeholder="Enter name..."
                                      sx={{ width: 200 }}
                                      InputProps={{
                                        sx: { height: '30px' }
                                      }}
                                      onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                                    />
                                  ) : <Label color="default" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>{product.name}</Label>
                                }<br />
                                <Typography variant="h6">Price: </Typography>
                                {
                                  (product.isNew ||
                                    !product.predefined ||
                                    !product.checked ||
                                    listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                    <TextField
                                      type="number"
                                      min={product.name.toLowerCase().includes('mullion') ? 0 : 1}
                                      value={product.price}
                                      placeholder="Enter price"
                                      sx={{ width: 200 }}
                                      InputProps={{
                                        sx: { height: '30px' }
                                      }}
                                      onChange={(e) => handleProductChange(product.id, 'price', Math.max(0, e.target.value))}
                                    />
                                  ) : <Label color="default" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>{product.price}</Label>
                                }<br />
                                <Typography variant="h6">Quantity: </Typography>
                                {
                                  (product.isNew ||
                                    !product.checked ||
                                    listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) ? (
                                    <TextField
                                      type="number"
                                      min="0"
                                      value={product.quantity || ''}
                                      placeholder="Qty"
                                      sx={{ width: 200 }}
                                      InputProps={{
                                        sx: { height: '30px' }
                                      }}
                                      onChange={(e) => handleProductChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                    />
                                  ) : <Label color="default" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>{product.quantity}</Label>
                                }<br />
                                <Typography variant="h6">Total: </Typography>
                                <Label color="success" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {fCurrency(product.price * product.quantity)}
                                </Label><br />
                                <Typography variant="h6">Notes: </Typography>
                                {/* <TextField
                                  multiline
                                  rows={3}
                                  value={product.notes}
                                  placeholder="Enter notes..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleProductChange(product.id, 'notes', e.target.value)}
                                /> */}
                                <Label
                                  color={product.notes ? "warning" : "default"}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    handleOpenNotes(product)
                                    setCurrentType('item')
                                  }}
                                >
                                  {product.notes ? 'Edit Note' : 'Add Note'}
                                </Label>
                                {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                                  <>
                                    <br /><Typography variant="h6">Checked?: </Typography>
                                    {product.checked ?
                                      <Iconify icon="lets-icons:check-fill" sx={{ width: 20, height: 20, color: 'success.main' }} /> :
                                      <Iconify icon="clarity:error-solid" sx={{ width: 20, height: 20, color: 'error.main' }} />
                                    }
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          )}

                          <TableCell sx={{ verticalAlign: !isMobile ? 'none' : 'bottom' }} align="left">
                            <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', justifyContent: 'flex-end', gap: -1 }}>
                              {(!product.checked &&
                                listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.warehouseStaff) &&
                                isValidProductRow(product)) && (
                                  <IconButton
                                    variant="outlined"
                                    color='default'
                                    onClick={() => handleCheckProduct(product.id)}
                                    sx={{
                                      '&:hover': {
                                        boxShadow: 'none',
                                        backgroundColor: 'transparent',
                                      },
                                    }}>
                                    <Iconify icon="lets-icons:check-ring" sx={{ width: 26, height: 26 }} />
                                  </IconButton>
                                )}
                              {(index === productsData.length - 1) && (
                                <IconButton variant="outlined" color='success' onClick={handleAddProduct} disabled={!canAddProduct} sx={{
                                  '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'transparent',
                                  },
                                }}>
                                  <Iconify icon="icons8:plus" sx={{ width: 28, height: 28 }} />
                                </IconButton>
                              )}
                              {(product.isNew || listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
                                <IconButton variant="outlined" color='warning' onClick={() => handleRemoveProduct(product.id)} sx={{
                                  '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'transparent',
                                  },
                                }}>
                                  <Iconify icon="lsicon:minus-outline" sx={{ width: 25, height: 25 }} />
                                </IconButton>
                              )}

                            </Box>
                          </TableCell>
                          {/* ) : (
                          <TableCell />
                          )} */}
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter sx={{ bgcolor: 'grey.300' }}>
                      <TableRow>
                        <TableCell colSpan={
                          !isMobile ? (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) ? 6 : 5) : 0
                        } align="left" sx={{ fontSize: '15px' }}><b>TOTAL:</b></TableCell>
                        <TableCell sx={{ fontSize: '15px' }} align="right"><b>{fCurrency(totalPrice)}</b></TableCell>
                        {/* <TableCell colSpan={!isMobile ? 2 : 0} align="left" sx={{ fontSize: '15px' }} /> */}
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              </Stack>
              <br />
              <br />
            </>
          ),
          icon: <Iconify icon="qlementine-icons:items-tree-16" />,
        },
        {
          label: (
            <Stack spacing={1} direction="row">
              <Typography variant='subtitle2'>Materials</Typography>
              {project?.projectMaterials?.length === 0 && (
                <Label color="error">This info has not been saved yet...</Label>
              )}
            </Stack>
          ),
          value: (
            <>
              <Stack spacing={1} direction="column">
                <TableContainer>
                  <Table dense="true">
                    <TableHead>
                      <TableRow>
                        {!isMobile ? (
                          <>
                            <TableCell>Name</TableCell>
                            <TableCell>Qty</TableCell>
                            {/* <TableCell>Ticket #</TableCell> */}
                            <TableCell>Unit Price</TableCell>
                            <TableCell>Total Cost</TableCell>
                            {/* <TableCell>Store</TableCell> */}
                            <TableCell align="right">
                              <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: materials.length === 0 ? 'space-between' : 'flex-end'
                              }}>
                                <Typography sx={{ mt: materials.length !== 0 ? 0.4 : 1.5 }} variant='subtitle2'>Notes</Typography>
                                {materials.length === 0 && (
                                  <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', mr: -19 }}>
                                    <IconButton variant="outlined" color='success' onClick={handleAddMaterial} disabled={!canAddMaterial} sx={{
                                      '&:hover': {
                                        boxShadow: 'none',
                                        backgroundColor: 'transparent',
                                      },
                                    }}>
                                      <Iconify icon="lets-icons:add-duotone" sx={{ width: 30, height: 30 }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Typography sx={{ mt: materials.length === 0 ? 1.5 : 0 }}>Materials</Typography>
                              {materials.length === 0 && (
                                <IconButton variant="outlined" color='success' onClick={handleAddMaterial} disabled={!canAddMaterial} sx={{
                                  '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'transparent',
                                  },
                                  mr: -5,
                                }}>
                                  <Iconify icon="lets-icons:add-duotone" sx={{ width: 30, height: 30, mr: -15 }} />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        )}
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.map((product, index) => (
                        <TableRow key={`material-${product.id}`}>
                          {!isMobile ? (
                            <>
                              <TableCell sx={{ width: 200 }}>
                                <TextField
                                  // multiline
                                  // rows={2}
                                  value={product.name}
                                  placeholder="Enter name..."
                                  sx={{ width: 200 }}
                                  InputProps={{
                                    sx: { height: '30px' }
                                  }}
                                  onChange={(e) => handleMaterialChange(product.id, 'name', e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 50 }}>
                                <TextField
                                  type="number"
                                  min="0"
                                  value={product.quantity || ''}
                                  placeholder="Qty"
                                  sx={{ width: 50 }}
                                  InputProps={{
                                    sx: { height: '30px' }
                                  }}
                                  onChange={(e) => handleMaterialChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                />
                              </TableCell>
                              {/* <TableCell sx={{ width: 100 }}>
                                <TextField
                                  multiline
                                  rows={2}
                                  value={product.ticket}
                                  placeholder="Enter ticket..."
                                  sx={{ width: 100 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'ticket', e.target.value)}
                                />
                              </TableCell> */}
                              <TableCell sx={{ width: 100 }}>
                                <TextField
                                  type="number"
                                  min="0"
                                  value={product.cost || ''}
                                  placeholder="Unit price"
                                  sx={{ width: 100 }}
                                  InputProps={{
                                    sx: { height: '30px' }
                                  }}
                                  onChange={(e) => handleMaterialChange(product.id, 'cost', Math.max(0, e.target.value))}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 100 }}>
                                {fCurrency(product.cost * product.quantity)}
                              </TableCell>
                              {/* <TableCell sx={{ width: 100 }}>
                                <TextField
                                  multiline
                                  rows={2}
                                  value={product.store}
                                  placeholder="Enter store..."
                                  sx={{ width: 100 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'store', e.target.value)}
                                />
                              </TableCell> */}
                              <TableCell align='right'>
                                {/* <TextField
                                  multiline
                                  rows={3}
                                  value={product.notes}
                                  placeholder="Enter notes..."
                                  sx={{ width: 100 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'notes', e.target.value)}
                                /> */}
                                <Label
                                  color={product.notes ? "warning" : "default"}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    handleOpenNotes(product)
                                    setCurrentType('material')
                                  }}
                                >
                                  {product.notes ? 'Edit Note' : 'Add Note'}
                                </Label>
                              </TableCell>
                            </>
                          ) : (
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Material:</Typography>
                                <TextField
                                  multiline
                                  rows={2}
                                  value={product.name}
                                  placeholder="Enter name..."
                                  sx={{ width: 200 }}
                                  InputProps={{
                                    sx: { height: '30px' }
                                  }}
                                  onChange={(e) => handleMaterialChange(product.id, 'name', e.target.value)}
                                />

                                <br />
                                <Typography variant="h6">Quantity:</Typography>
                                <TextField
                                  type="number"
                                  min="0"
                                  value={product.quantity || ''}
                                  placeholder="Qty"
                                  sx={{ width: 200 }}
                                  InputProps={{
                                    sx: { height: '30px' }
                                  }}
                                  onChange={(e) => handleMaterialChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                /><br />
                                {/* <Typography variant="h6">Ticket #:</Typography>
                                <TextField
                                  value={product.ticket}
                                  placeholder="Enter ticket..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'ticket', e.target.value)}
                                /><br /> */}
                                <Typography variant="h6">Unit Price:</Typography>
                                <TextField
                                  type="number"
                                  min="0"
                                  value={product.cost || ''}
                                  placeholder="Unit price"
                                  sx={{ width: 200 }}
                                  InputProps={{
                                    sx: { height: '30px' }
                                  }}
                                  onChange={(e) => handleMaterialChange(product.id, 'cost', Math.max(0, e.target.value))}
                                /><br />
                                <Typography variant="h6">Total Cost:</Typography>
                                <Label color="success" sx={{ bgcolor: 'transparent', justifyContent: 'flex-start' }}>
                                  {fCurrency(product.cost * product.quantity)}
                                </Label><br />
                                {/* <Typography variant="h6">Store:</Typography>
                                <TextField
                                  value={product.store}
                                  placeholder="Enter store..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'store', e.target.value)}
                                /><br /> */}
                                <Typography variant="h6">Notes:</Typography>
                                {/* <TextField
                                  multiline
                                  rows={3}
                                  value={product.notes}
                                  placeholder="Enter notes..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'notes', e.target.value)}
                                /> */}
                                <Label
                                  color={product.notes ? "warning" : "default"}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    handleOpenNotes(product)
                                    setCurrentType('material')
                                  }}
                                >
                                  {product.notes ? 'Edit Note' : 'Add Note'}
                                </Label>
                              </Box>
                            </TableCell>
                          )}
                          <TableCell sx={{ verticalAlign: !isMobile ? 'none' : 'bottom' }} align="left">
                            <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', justifyContent: 'flex-end', gap: 0 }}>
                              {(index === materials.length - 1) && (
                                <IconButton variant="outlined" color='success' onClick={handleAddMaterial} disabled={!canAddMaterial} sx={{
                                  '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'transparent',
                                  },
                                }}>
                                  <Iconify icon="icons8:plus" sx={{ width: 28, height: 28 }} />
                                </IconButton>
                              )}
                              <IconButton variant="outlined" color='warning' onClick={() => handleRemoveMaterial(product.id)} sx={{
                                '&:hover': {
                                  boxShadow: 'none',
                                  backgroundColor: 'transparent',
                                },
                              }}>
                                <Iconify icon="lsicon:minus-outline" sx={{ width: 25, height: 25 }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}

                    </TableBody>
                    <TableFooter sx={{ bgcolor: 'grey.300' }}>
                      <TableRow>
                        <TableCell colSpan={!isMobile ? 5 : 0} align="left" sx={{ fontSize: '15px' }}><b>TOTAL Cost:</b></TableCell>
                        <TableCell sx={{ fontSize: '15px' }} align="right"><b>{fCurrency(totalCost)}</b></TableCell>
                        {/* <TableCell colSpan={!isMobile ? 2 : 0} align="left" sx={{ fontSize: '15px' }} /> */}
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              </Stack>
              <br />
              <br />
            </>
          ),
          icon: <Iconify icon="devicon-plain:angularmaterial" />,
        },
        {
          label: (
            <Stack spacing={1} direction="row">
              <Typography variant='subtitle2'>Other Notes</Typography>
            </Stack>
          ),
          value: (
            <Stack spacing={1} direction="column">
              <Field.Text multiline rows={2} name="otherNotes" placeholder="Write your other notes here..." />
            </Stack>
          ),
          icon: <Iconify icon="pixelarticons:notes-plus" />,
        },
      ].map((item, index) => (
        <Stack key={`${index}-${item.label}`} spacing={1.5} direction="row">
          {item?.icon}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <ListItemText
              primary={item.label}
              secondary={item.value}
              primaryTypographyProps={{ typography: 'body2', color: 'text.secondary', mb: 0.5 }}
              secondaryTypographyProps={{
                component: 'span',
                color: 'text.primary',
                typography: 'subtitle2',
              }}
            />
          </Box>
        </Stack>
      ))}
      <Label color="default">
        <Stack direction="column" spacing={0.5}>
          <Typography variant="caption">To enable Save button: <b>1. Fill all fields</b>, <b>2. If all is filled, at least one change</b>, <b>3. Check each item in Items Section</b></Typography>
        </Stack>
      </Label>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting}
          // disabled={!isFormValid || !isCustomDirty || !allProductsChecked || productsData.length === 0 || materials.length === 0}
          disabled={!isFormValid || !isCustomDirty}
        >
          Save
        </LoadingButton>
        <Button
          variant="outlined"
          onClick={() => generateInstallationGuideFormReport({ currentProject, userLogged })}
        >
          Generate Report
        </Button>
      </Stack>
    </Card >
  );

  const renderOverview = (
    <ProjectDetailsContentOverview
      project={project}
      listPermissions={listPermissions}
      openDialogs={openDialogs}
      setOpenDialogs={setOpenDialogs}
    />
  );

  if (project === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Project not found!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid xs={12} md={8}>
          <Form methods={methods} onSubmit={onSubmit}>
            {renderContent}
          </Form>
        </Grid>
        <Grid xs={12} md={4}>
          {renderOverview}
        </Grid>
      </Grid >
      <ProjectEditModalNotesView
        open={openNotes.value}
        onClose={openNotes.onFalse}
        item={currentItem}
        onSubmitNotes={currentType === 'item' ? handleProductChange : handleMaterialChange}
        type={currentType}
      />
    </>
  );
}
