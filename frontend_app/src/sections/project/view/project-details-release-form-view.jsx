import axios from 'axios';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import { Box, Button } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { generateReleaseFormReport } from 'src/utils/generate-release-form-pdf';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectDetailsContentOverview } from '../project-details-content-overview';

// ----------------------------------------------------------------------

export function ProjectDetailsReleaseFormView({
  project,
  refetchProject,
  listPermissions,
  openDialogs,
  setOpenDialogs,
}) {

  const FINAL_RELEASE_FORM_OPTIONS = [
    { label: 'All Products (Windows, doors, hardware, screens) are installed and working/ operating properly', value: 'allProductsMarked' },
    { label: 'All windows hardware/screens are installed and working/operating properly', value: 'allWindowsMarked' },
    { label: 'All screw covers/caps are installed on ALL window(s)/door(s)', value: 'allScrewMarked' },
    { label: 'All trash has been removed', value: 'allTrashMarked' },
  ];

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const ProjectReleaseSchema = zod.object({
    releaseFormOptions: zod
      .array(zod.string())
      .optional()
      .nullable(),
    feedback: zod
      .string()
      .optional()
      .nullable(),
  });

  const defaultValues = useMemo(() => ({
    releaseFormOptions: Object.entries(project || {})
      .filter(([key, value]) =>
        ['allWindowsMarked', 'allProductsMarked', 'allScrewMarked', 'allTrashMarked'].includes(key) && value === true
      )
      .map(([key]) => key),

    feedback: project?.feedback || '',
  }), [project]);

  const methods = useForm({
    resolver: zodResolver(ProjectReleaseSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
    isSubmitting
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [project, reset, defaultValues]);


  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();
      formData.append('allWindowsMarked', data.releaseFormOptions.includes('allWindowsMarked'));
      formData.append('allProductsMarked', data.releaseFormOptions.includes('allProductsMarked'));
      formData.append('allScrewMarked', data.releaseFormOptions.includes('allScrewMarked'));
      formData.append('allTrashMarked', data.releaseFormOptions.includes('allTrashMarked'));
      formData.append('feedback', data.feedback);
      formData.append('userReporter', JSON.stringify(userLogged?.data));

      const promise = axios.post(`${CONFIG.apiUrl}/projects/update/project/${project?.id}/change-release-form/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Release Form updated successfully!',
        error: 'Release Form updated error!',
      });

      await promise;

    } catch (error) {
      console.error(error);
    }
  });

  const renderContent = (
    <Card sx={{ p: 3, gap: 1, display: 'flex', flexDirection: 'column', maxHeight: !isMobile ? 655 : 'auto', minHeight: !isMobile ? 655 : 'auto', overflow: 'auto' }}>
      {[
        {
          label: 'MARK IF THE FOLLOWING HAS BEEN COMPLETED:',
          value: (
            <>
              <Stack spacing={1} direction="column">
                <Field.MultiCheckbox column="true" name="releaseFormOptions" options={FINAL_RELEASE_FORM_OPTIONS} sx={{ gap: 2 }} />
              </Stack>
              <br />
            </>
          ),
          icon: <Iconify icon="ri:mark-pen-fill" />,
        },
        {
          label: 'FEEDBACK:',
          value: (
            <Stack spacing={1} direction="column">
              <Field.Text multiline rows={3} name="feedback" placeholder="Write your feedback here..." />
            </Stack>
          ),
          icon: <Iconify icon="fluent-mdl2:feedback" />,
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
          disabled={!isDirty}
        >
          Save
        </LoadingButton>
        <Button
          variant="outlined"
          onClick={() => generateReleaseFormReport({ project })}
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
  );
}
