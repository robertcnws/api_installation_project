import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Table, Button, Dialog, Divider, TableRow, TableBody, TableCell, TableHead, TableFooter, DialogTitle, DialogContent, DialogActions, TableContainer } from '@mui/material';

import { fCurrency } from 'src/utils/format-number';
import { generateInstallationGuideFormReport } from 'src/utils/generate-installation-guide-pdf';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';




// ----------------------------------------------------------------------

export function ProjectDetailsInstallationGuideFormInstallerView({
  project,
  refetchProject,
  listPermissions,
  openDialogs,
  setOpenDialogs,
}) {

  useEffect(() => {
    refetchProject?.();
  }, [refetchProject]);

  const [openForm, setOpenForm] = useState({
    description: false,
    items: false,
    otherNotes: false,
    materials: false,
    confirmation: false,
  });

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const totalPrice = useMemo(() => (
    project?.projectGuideProducts?.reduce((acc, product) => acc + (product.price * product.quantity || 0), 0)
  ), [project]);

  const renderContent = (
    <>
      <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {project?.description && (
            <Button variant="outlined" onClick={() => setOpenForm({ ...openForm, description: true })}>
              <Iconify icon="fluent:text-description-16-filled" />
              See Description
            </Button>
          )}
          {project?.projectGuideProducts?.length > 0 && (
            <Button variant="outlined" onClick={() => setOpenForm({ ...openForm, items: true })}>
              <Iconify icon="qlementine-icons:items-grid-16" />
              See Items
            </Button>
          )}
          {project?.projectMaterialsOtherNotes && (
            <Button variant="outlined" onClick={() => setOpenForm({ ...openForm, otherNotes: true })}>
              <Iconify icon="garden:notes-stroke-12" />
              See Other Notes
            </Button>
          )}
        </Box>
      </Card >
      <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" onClick={() => setOpenForm({ ...openForm, materials: true })}>
            <Iconify icon="lets-icons:materials" />
            Manage Materials
          </Button>
          {project?.projectMaterials?.length === 0 ? (
            <Label color="error" variant="filled">
              No materials added
            </Label>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project?.projectMaterials?.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell onClick={
                        () => {
                          setSelectedMaterial(material);
                          setOpenForm({ ...openForm, confirmation: true });
                        }
                      }>
                        <u style={{ cursor: 'pointer'}}>{material.name}</u>
                      </TableCell>
                      <TableCell>{material.quantity}</TableCell>
                      <TableCell>{fCurrency(material.cost)}</TableCell>
                      <TableCell>{material.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography variant="h6">
                        Total
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6">
                        {fCurrency(project?.projectMaterials.reduce((acc, material) => acc + (material.quantity * material.cost), 0))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          )}
          <Divider key="divider" sx={{ borderStyle: 'dashed' }} />
          <Button variant="outlined" onClick={() => generateInstallationGuideFormReport({ currentProject: project, userLogged })}>
            <Iconify icon="icon-park-outline:file-pdf-one" />
            View Report
          </Button>
        </Box>
      </Card >
    </>
  );

  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    if (project) {
      setMaterials(project.projectMaterials);
    }
  }, [project]);

  const MaterialSchema = zod.object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    quantity: zod.number().min(1, { message: 'Quantity is required!' }),
    cost: zod.number().min(1, { message: 'Cost is required!' }),
    notes: zod.string().optional(),
  });

  const defaultValues = useMemo(
    () => ({
      name: selectedMaterial?.name || '',
      quantity: selectedMaterial?.quantity || 1,
      cost: selectedMaterial?.cost || 1,
      notes: selectedMaterial?.notes || '',
    }),
    [selectedMaterial]
  );

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(MaterialSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { isSubmitting },
  } = methods;


  useEffect(() => {
    if (selectedMaterial) {
      reset(selectedMaterial);
    }
    reset(defaultValues);
  }, [selectedMaterial, reset, defaultValues]);


  const handleSubmitMaterial = handleSubmit(async (values) => {
    let updatedMaterials;
    const maxIndex = materials.reduce((acc, material) => Math.max(acc, Number(material.id)), 0);
    if (selectedMaterial) {
      const materialIndex = materials.findIndex(
        (material) => material.id === selectedMaterial.id
      );
      updatedMaterials = [...materials];
      updatedMaterials[materialIndex] = {
        ...values,
        id: selectedMaterial.id,
      };
    } else {
      updatedMaterials = [...materials, {
        ...values,
        id: Number(maxIndex) + 1,
      }];
    }
    setMaterials(updatedMaterials);

    try {
      const formData = new FormData();
      formData.append('projectMaterials', JSON.stringify(updatedMaterials));
      formData.append('userReporter', JSON.stringify(userLogged?.data));

      const promise = axios.post(
        `${CONFIG.apiUrl}/projects/update/project/${project?.id}/change-installation-guide-form/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Materials updated successfully!',
        error: 'Materials updated error!',
      });

      await promise;

      refetchProject();
      setOpenForm({ ...openForm, materials: false });
      setSelectedMaterial(null);
      reset(defaultValues);
    } catch (error) {
      console.error(error);
    }
  });


  const handleDeleteMaterial = async () => {
    let updatedMaterials;
    if (selectedMaterial) {
      updatedMaterials = [...materials.filter((material) => material.id !== selectedMaterial.id)];
      setMaterials(updatedMaterials);
      try {
        const formData = new FormData();
        formData.append('projectMaterials', JSON.stringify(updatedMaterials));
        formData.append('userReporter', JSON.stringify(userLogged?.data));

        const promise = axios.post(
          `${CONFIG.apiUrl}/projects/update/project/${project?.id}/change-installation-guide-form/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        toast.promise(promise, {
          loading: 'Loading...',
          success: 'Material deleted successfully!',
          error: 'Material deleted error!',
        });

        await promise;

        refetchProject();
        setOpenForm({ ...openForm, confirmation: false });
        setSelectedMaterial(null);
        reset(defaultValues);
      } catch (error) {
        console.error(error);
      }
    }
  };


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
        <Grid xs={12} md={12}>
          {renderContent}
        </Grid>
      </Grid >

      <Dialog open={openForm.description} onClose={() => setOpenForm({ ...openForm, description: false })}>
        <DialogTitle>
          Description
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1">
              {project?.description}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm({ ...openForm, description: false })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openForm.otherNotes} onClose={() => setOpenForm({ ...openForm, otherNotes: false })}>
        <DialogTitle>
          Other Notes
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1">
              {project?.projectMaterialsOtherNotes}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm({ ...openForm, otherNotes: false })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openForm.items} onClose={() => setOpenForm({ ...openForm, items: false })}>
        <DialogTitle>
          Items
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Item
                    </TableCell>
                    <TableCell>
                      Quantity
                    </TableCell>
                    <TableCell>
                      Unit Price
                    </TableCell>
                    <TableCell>
                      Total Price
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project?.projectGuideProducts?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item.name}
                      </TableCell>
                      <TableCell>
                        {item.quantity}
                      </TableCell>
                      <TableCell>
                        {fCurrency(item.price)}
                      </TableCell>
                      <TableCell>
                        {fCurrency(item.quantity * item.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="h6">
                        Total
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6">
                        {fCurrency(totalPrice)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm({ ...openForm, items: false })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openForm.confirmation} onClose={() => {
        setOpenForm({ ...openForm, materials: false, confirmation: false })
        setSelectedMaterial(null);
        reset();
      }}>
        <DialogTitle>
          Materials Actions
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => {
            setOpenForm({ ...openForm, materials: true, confirmation: false })
          }} color="primary" variant="contained">
            Edit
          </Button>
          <Button onClick={() => {
            handleDeleteMaterial();
            setOpenForm({ ...openForm, materials: false, confirmation: false })
          }} color="error" variant="contained">
            Delete
          </Button>
          <Button onClick={() => {
            setOpenForm({ ...openForm, materials: false, confirmation: false })
            setSelectedMaterial(null);
            reset();
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openForm.materials} onClose={() => setOpenForm({ ...openForm, materials: false })}>
        <Form methods={methods} onSubmit={handleSubmitMaterial}>
          <DialogTitle>
            {selectedMaterial ? 'Edit Material' : 'Add Material'}
          </DialogTitle>
          <DialogContent>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Field.Text type="text" label="Name" name="name" sx={{ mt: 1 }} />
              <Field.Text type="number" label="Quantity" name="quantity" />
              <Field.Text type="number" label="Cost" name="cost" />
              <Field.Text multiline rows={3} type="text" label="Notes" name="notes" />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button type="submit" color="primary" variant="contained">
              {selectedMaterial ? 'Edit' : 'Add'}
            </Button>
            <Button type="button" onClick={() => {
              setOpenForm({ ...openForm, materials: false })
              setSelectedMaterial(null);
              reset();
            }}>
              Close
            </Button>
          </DialogActions>
        </Form>
      </Dialog>



    </>
  );
}
