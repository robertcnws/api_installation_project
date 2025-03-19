import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Button, Dialog } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { generateReleaseFormReport } from 'src/utils/generate-release-form-pdf';

import { Iconify } from 'src/components/iconify';

import { ProjectDetailsReleaseFormView } from './project-details-release-form-view';


// ----------------------------------------------------------------------

export function ProjectDetailsReleaseFormInstallerView({
  project,
  refetchProject,
  listPermissions,
  openDialogs,
  setOpenDialogs,
}) {

  const openReleaseForm = useBoolean();

  const renderContent = (
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={openReleaseForm.onTrue}>
          <Iconify icon="clarity:form-line" />
          Complete Release Form
        </Button>
        <Button variant="outlined" onClick={() => generateReleaseFormReport({ project })}>
          <Iconify icon="icon-park-outline:file-pdf-one" />
          View Report
        </Button>
      </Box>
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
    <>
      <Grid container spacing={2}>
        <Grid xs={12} md={12}>
          {renderContent}
        </Grid>
      </Grid >
      <Dialog open={openReleaseForm.value} onClose={openReleaseForm.onFalse} width="lg" maxWidth="lg">
        <ProjectDetailsReleaseFormView 
          project={project} 
          refetchProject={refetchProject} 
          listPermissions={listPermissions} 
          openDialogs={openDialogs} 
          setOpenDialogs={setOpenDialogs}
          onClose={openReleaseForm.onFalse}
        />
      </Dialog>
    </>
  );
}
