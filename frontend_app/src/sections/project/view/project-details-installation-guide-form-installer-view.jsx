import axios from 'axios';
import { z as zod } from 'zod';
import isEqual from 'lodash.isequal';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import { Box, Table, Button, TableRow, TableBody, TableCell, TableHead, TextField, IconButton, TableFooter, TableContainer, Divider, DialogTitle, DialogContent, DialogActions, Dialog } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { createScopeArray, generateInstallationGuideFormReport } from 'src/utils/generate-installation-guide-pdf';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectEditModalNotesView } from './project-edit-modal-notes-view';
import { ProjectDetailsContentOverview } from '../project-details-content-overview';


// ----------------------------------------------------------------------

export function ProjectDetailsInstallationGuideFormInstallerView({
  project,
  refetchProject,
  listPermissions,
  openDialogs,
  setOpenDialogs,
}) {

  const [openForm, setOpenForm] = useState({
    description: false,
    items: false,
    otherNotes: false,
    materials: false,
  });

  const userLogged = useMemo(() => sessionStorage.getItem('userLogged'), []);

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
          <Divider key="divider" sx={{ borderStyle: 'dashed' }} />
          <Button variant="outlined" onClick={() => generateInstallationGuideFormReport({ currentProject: project, userLogged })}>
            <Iconify icon="icon-park-outline:file-pdf-one" />
            View Report
          </Button>
        </Box>
      </Card >
    </>
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

    </>
  );
}
