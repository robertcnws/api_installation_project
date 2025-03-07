import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useContext, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import { Box, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';


import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';
import { generateInstallationGuideFormReport, createScopeArray } from 'src/utils/generate-installation-guide-pdf';
import { fCurrency } from 'src/utils/format-number';
import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

export function ProjectDetailsInstallationGuideFormView({
  project,
  refetchProject,
  listPermissions,
}) {

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const listItems = useMemo(() => project?.salesOrder?.line_items?.filter((product) => product.item_type !== 'sales_and_purchases'), [project]);

  const [materials, setMaterials] = useState(
    project?.projectMaterials.length > 0 ?
      project?.projectMaterials :
      [
        {
          id: 1,
          name: '',
          quantity: 1,
          ticket: '',
          cost: 0,
          store: '',
          notes: '',
        }
      ],
  );

  const [productsData, setProductsData] = useState([]);

  // Cargar productos iniciales
  useEffect(() => {
    if (listItems.length > 0) {
      const items = createScopeArray({ listItems }).filter((item) => item.quantity > 0).map((item) => ({
        ...item,
        isNew: false,
      }));
      const lastItems = items.map((item) => {
        const product = project?.projectGuideProducts?.find((p) => p.id === item.id);
        const finalItem = {
          ...item,
          notes: product?.notes || '',
        }
        const productCustom = project?.projectGuideProducts?.find((p) => p.itemId === item.itemId);
        if (productCustom) {
          finalItem.price = productCustom.price;
          finalItem.quantity = productCustom.quantity;
        }
        return finalItem;
      });
      setProductsData(lastItems);
    }
  }, [listItems, project]);

  const totalPrice = useMemo(() => (
    productsData.reduce((acc, product) => acc + (product.price * product.quantity || 0), 0)
  ), [productsData]);

  const handleAddProduct = () => {
    setProductsData((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: 'OTHER: ',
        price: 0,
        quantity: 1,
        notes: '',
        isNew: true,
      }
    ]);
  };

  const handleRemoveProduct = (id) => {
    setProductsData((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProductChange = (id, field, value) => {
    setProductsData((prev) => (
      prev.map((item) => (
        item.id === id ? { ...item, [field]: value } : item
      ))
    ));
  };

  const canAddProduct = useMemo(() => {
    if (productsData.length === 0) return true;
    const lastProduct = productsData[productsData.length - 1];
    return lastProduct.name.trim() !== '' && lastProduct.price > 0 && lastProduct.quantity > 0;
  }, [productsData]);

  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: 'OTHER: ',
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
    if (materials.length === 0) return true;
    const lastMaterial = materials[materials.length - 1];
    return lastMaterial.name.trim() !== '' &&
      lastMaterial.quantity > 0 &&
      lastMaterial.cost > 0 &&
      lastMaterial.store.trim() !== '' &&
      lastMaterial.ticket.trim() !== '';
  }, [materials]);

  const totalCost = useMemo(() => (
    materials.reduce((acc, material) => acc + (material.cost * material.quantity || 0), 0)
  ), [materials]);

  const ProjectInstallationGuideSchema = zod.object({
    workScope: zod.string().optional(),
    otherNotes: zod.string().optional(),
  });

  const defaultValues = useMemo(() => ({
    workScope: project?.workScope || '',
    otherNotes: project?.projectMaterialsOtherNotes || '',
  }), [project]);

  const methods = useForm({
    resolver: zodResolver(ProjectInstallationGuideSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
    isSubmitting
  } = methods;

  const isFormValid = useMemo(() => {
    const areProductsValid = productsData.every((product) =>
      product.name.trim() !== '' &&
      product.quantity > 0 &&
      product.price > 0
    );

    const areMaterialsValid = materials.every((material) =>
      material.name.trim() !== '' &&
      material.quantity > 0 &&
      material.cost > 0 &&
      material.store.trim() !== '' &&
      material.ticket.trim() !== ''
    );

    return isDirty && areProductsValid && areMaterialsValid;
  }, [isDirty, productsData, materials]);

  useEffect(() => {
    reset(defaultValues);
  }, [project, reset, defaultValues]);


  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();
      formData.append('workScope', data.workScope);
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

  const renderOverview = (
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', maxHeight: !isMobile ? 655 : 'auto', minHeight: !isMobile ? 655 : 'auto', overflow: 'auto' }}>
      {[
        {
          label: 'Work Scope & Description',
          value: (
            <>
              <Stack spacing={1} direction="column">
                <Field.Text name="workScope" placeholder="Write your work scope & description here..." />
              </Stack>
              <br />
              <br />
            </>
          ),
          icon: <Iconify icon="arcticons:radarscope" />,
        },
        {
          label: 'Items:',
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
                            <TableCell>Pay per unit</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ mt: 1 }}>Notes</Typography>
                                <IconButton variant="outlined" color='success' onClick={handleAddProduct} disabled={!canAddProduct} sx={{ border: '1px solid' }}>
                                  <Iconify icon="bi:plus" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Typography>Items</Typography>
                              <IconButton variant="outlined" color='success' onClick={handleAddProduct} disabled={!canAddProduct} sx={{ border: '1px solid' }}>
                                <Iconify icon="bi:plus" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        )}
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productsData.map((product, index) => (
                        <TableRow key={product.id}>
                          {!isMobile ? (
                            <>
                              <TableCell sx={{ width: 300 }}>
                                {
                                  product.isNew ? (
                                    <TextField
                                      value={product.name}
                                      placeholder="Enter name..."
                                      sx={{ width: 300 }}
                                      onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                                    />
                                  ) : product.name
                                }
                              </TableCell>
                              <TableCell sx={{ width: product.isNew ? 100 : 50 }}>
                                {
                                  (product.isNew || !product.predefined) ? (
                                    <TextField
                                      type="number"
                                      min="0"
                                      value={product.price || ''}
                                      placeholder="Enter price"
                                      sx={{ width: 100 }}
                                      onChange={(e) => handleProductChange(product.id, 'price', Math.max(0, e.target.value))}
                                    />
                                  ) : product.price
                                }
                              </TableCell>
                              <TableCell sx={{ width: 50 }}>
                                {
                                  product.isNew ? (
                                    <TextField
                                      type="number"
                                      min="0"
                                      value={product.quantity || ''}
                                      placeholder="Qty"
                                      sx={{ width: 50 }}
                                      onChange={(e) => handleProductChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                    />
                                  ) : product.quantity
                                }
                              </TableCell>
                              <TableCell align="right" sx={{ width: 100 }}>
                                {fCurrency(product.price * product.quantity)}
                              </TableCell>
                              <TableCell sx={{ width: 600 }}>
                                <TextField
                                  value={product.notes}
                                  placeholder="Enter notes..."
                                  sx={{ width: 600 }}
                                  onChange={(e) => handleProductChange(product.id, 'notes', e.target.value)}
                                />
                              </TableCell>
                            </>
                          ) : (
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Product: </Typography>
                                {
                                  product.isNew ? (
                                    <TextField
                                      value={product.name}
                                      placeholder="Enter name..."
                                      sx={{ width: 200 }}
                                      onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                                    />
                                  ) : <Label color="default">{product.name}</Label>
                                }<br />
                                <Typography variant="h6">Price: </Typography>
                                {
                                  (product.isNew || !product.predefined) ? (
                                    <TextField
                                      type="number"
                                      min="0"
                                      value={product.price || ''}
                                      placeholder="Enter price"
                                      sx={{ width: 200 }}
                                      onChange={(e) => handleProductChange(product.id, 'price', Math.max(0, e.target.value))}
                                    />
                                  ) : <Label color="default">{product.price}</Label>
                                }<br />
                                <Typography variant="h6">Quantity: </Typography>
                                {
                                  product.isNew ? (
                                    <TextField
                                      type="number"
                                      min="0"
                                      value={product.quantity || ''}
                                      placeholder="Qty"
                                      sx={{ width: 200 }}
                                      onChange={(e) => handleProductChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                    />
                                  ) : <Label color="default">{product.quantity}</Label>
                                }<br />
                                <Typography variant="h6">Total: </Typography>
                                <Label color="success">{fCurrency(product.price * product.quantity)}</Label><br />
                                <Typography variant="h6">Notes: </Typography>
                                <TextField
                                  multiline
                                  rows={3}
                                  value={product.notes}
                                  placeholder="Enter notes..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleProductChange(product.id, 'notes', e.target.value)}
                                />
                              </Box>
                            </TableCell>
                          )}
                          {(index === productsData.length - 1) ? (
                            <TableCell sx={{ width: 100, verticalAlign: !isMobile ? 'none' : 'bottom' }} align="left">
                              <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', justifyContent: 'space-between' }}>
                                <IconButton variant="outlined" color='success' onClick={handleAddProduct} disabled={!canAddProduct} sx={{ border: '1px solid' }}>
                                  <Iconify icon="bi:plus" />
                                </IconButton>
                                {product.isNew && (
                                  <IconButton variant="outlined" color='error' onClick={() => handleRemoveProduct(product.id)} sx={{ border: '1px solid' }}>
                                    <Iconify icon="bi:trash" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          ) : (
                            <TableCell />
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter sx={{ bgcolor: 'grey.300' }}>
                      <TableRow>
                        <TableCell colSpan={!isMobile ? 3 : 0} align="left" sx={{ fontSize: '15px' }}><b>TOTAL:</b></TableCell>
                        <TableCell sx={{ fontSize: '15px' }} align="right"><b>{fCurrency(totalPrice)}</b></TableCell>
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
          label: 'Materials:',
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
                            <TableCell>Ticket #</TableCell>
                            <TableCell>Cost</TableCell>
                            <TableCell>Store</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Typography sx={{ mt: 1 }}>Notes</Typography>
                                <IconButton variant="outlined" color='success' onClick={handleAddMaterial} disabled={!canAddMaterial} sx={{ border: '1px solid' }}>
                                  <Iconify icon="bi:plus" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Typography>Materials</Typography>
                              <IconButton variant="outlined" color='success' onClick={handleAddMaterial} disabled={!canAddMaterial} sx={{ border: '1px solid' }}>
                                <Iconify icon="bi:plus" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        )}
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.map((product, index) => (
                        <TableRow key={product.id}>
                          {!isMobile ? (
                            <>
                              <TableCell sx={{ width: 150 }}>
                                <TextField
                                  value={product.name}
                                  placeholder="Enter name..."
                                  sx={{ width: 150 }}
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
                                  onChange={(e) => handleMaterialChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 100 }}>
                                <TextField
                                  value={product.ticket}
                                  placeholder="Enter ticket..."
                                  sx={{ width: 100 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'ticket', e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 100 }}>
                                <TextField
                                  type="number"
                                  min="0"
                                  value={product.cost || ''}
                                  placeholder="Qty"
                                  sx={{ width: 100 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'cost', Math.max(0, e.target.value))}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 150 }}>
                                <TextField
                                  value={product.store}
                                  placeholder="Enter store..."
                                  sx={{ width: 150 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'store', e.target.value)}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 500 }}>
                                <TextField
                                  value={product.notes}
                                  placeholder="Enter notes..."
                                  sx={{ width: 500 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'notes', e.target.value)}
                                />
                              </TableCell>
                            </>
                          ) : (
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Material:</Typography>
                                <TextField
                                  value={product.name}
                                  placeholder="Enter name..."
                                  sx={{ width: 200 }}
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
                                  onChange={(e) => handleMaterialChange(product.id, 'quantity', Math.max(0, e.target.value))}
                                /><br />
                                <Typography variant="h6">Ticket #:</Typography>
                                <TextField
                                  value={product.ticket}
                                  placeholder="Enter ticket..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'ticket', e.target.value)}
                                /><br />
                                <Typography variant="h6">Cost:</Typography>
                                <TextField
                                  type="number"
                                  min="0"
                                  value={product.cost || ''}
                                  placeholder="Qty"
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'cost', Math.max(0, e.target.value))}
                                /><br />
                                <Typography variant="h6">Store:</Typography>
                                <TextField
                                  value={product.store}
                                  placeholder="Enter store..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'store', e.target.value)}
                                /><br />
                                <Typography variant="h6">Notes:</Typography>
                                <TextField
                                  multiline
                                  rows={3}
                                  value={product.notes}
                                  placeholder="Enter notes..."
                                  sx={{ width: 200 }}
                                  onChange={(e) => handleMaterialChange(product.id, 'notes', e.target.value)}
                                />
                              </Box>
                            </TableCell>
                          )}
                          <TableCell sx={{ width: 100, verticalAlign: !isMobile ? 'none' : 'bottom' }} align="left">
                            <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', justifyContent: 'space-between' }}>
                              {(index === materials.length - 1) && (
                                <IconButton variant="outlined" color='success' onClick={handleAddMaterial} disabled={!canAddMaterial} sx={{ border: '1px solid' }}>
                                  <Iconify icon="bi:plus" />
                                </IconButton>
                              )}
                              <IconButton variant="outlined" color='error' onClick={() => handleRemoveMaterial(product.id)} sx={{ border: '1px solid' }}>
                                <Iconify icon="bi:trash" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}

                    </TableBody>
                    <TableFooter sx={{ bgcolor: 'grey.300' }}>
                      <TableRow>
                        <TableCell colSpan={!isMobile ? 3 : 0} align="left" sx={{ fontSize: '15px' }}><b>TOTAL Cost:</b></TableCell>
                        <TableCell sx={{ fontSize: '15px' }} align="center"><b>{fCurrency(totalCost)}</b></TableCell>
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
          label: 'Other notes',
          value: (
              <Stack spacing={1} direction="column">
                <Field.Text multiline rows={2} name="otherNotes" placeholder="Write your other notes here..." />
              </Stack>
          ),
          icon: <Iconify icon="pixelarticons:notes-plus" />,
        },
      ].map((item) => (
        <Stack key={item.label} spacing={1.5} direction="row">
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
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting}
          disabled={!isFormValid}
        >
          Save
        </LoadingButton>
        <Button
          variant="outlined"
          onClick={() => generateInstallationGuideFormReport({ project })}
        >
          Generate Report
        </Button>
      </Stack>
    </Card >
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
    <Grid container spacing={3}>
      <Grid xs={12} md={12}>
        <Form methods={methods} onSubmit={onSubmit}>
          {renderOverview}
        </Form>
      </Grid>
    </Grid >
  );
}
