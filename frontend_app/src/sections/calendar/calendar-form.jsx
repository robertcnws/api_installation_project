import axios from 'axios';
import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { Avatar, Typography } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { uuidv4 } from 'src/utils/uuidv4';
import { fDate, fIsAfter } from 'src/utils/format-time';
import { getProjectInstaller } from 'src/utils/project-tasks-utils';
import { getServiceInstaller } from 'src/utils/service-tasks-utils';

import { CONFIG } from 'src/config-global';
import { createEvent } from 'src/actions/calendar';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { isInstaller } from 'src/utils/check-permissions';

// ----------------------------------------------------------------------

export const EventSchema = zod.object({
  title: zod
    .string()
    .min(1, { message: 'Title is required!' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  description: zod
    .string().optional(),
  color: zod.string(),
  allDay: zod.boolean(),
  start: zod.union([zod.string(), zod.number()]),
  end: zod.union([zod.string(), zod.number()]),
});

// ----------------------------------------------------------------------

export function CalendarForm({ currentEvent, colorOptions, onClose }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const router = useRouter();

  const confirmDelete = useBoolean();

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(EventSchema),
    defaultValues: currentEvent,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const dateError = useMemo(() =>
    currentEvent?.type === 'installation' || currentEvent?.type === 'service' ? fIsAfter(values.start, values.end) :
      currentEvent?.type === 'inspection' ?
        fIsAfter(dayjs(currentEvent?.startDate).format('YYYY-MM-DD'), dayjs(values.start).format('YYYY-MM-DD')) :
        fIsAfter(dayjs(currentEvent?.inspectionDate).format('YYYY-MM-DD'), dayjs(values.start).format('YYYY-MM-DD')),
    [currentEvent, values.start, values.end]
  );

  const handleDetails = useCallback(
    (id) => {
      const fieldId = currentEvent?.type === 'service' ? 'serviceId' :
        currentEvent?.type.toLowerCase().indexOf('measurement') !== -1 ? 'measurementId' : 'projectId';
      const field = currentEvent?.type === 'service' ? 'Service' :
        currentEvent?.type.toLowerCase().indexOf('measurement') !== -1 ? 'Measurement' : 'Project';
      localStorage.setItem(fieldId, id);
      localStorage.setItem(`backFrom${field}Details`, 'calendarDashboard');
      if (currentEvent && currentEvent?.type === 'service') {
        router.push(paths.dashboard.service.details(id));
      }
      else if (currentEvent && currentEvent?.type?.toLowerCase().indexOf('measurement') !== -1) {
        router.push(paths.dashboard.measurement.details(id));
      }
      else {
        router.push(paths.dashboard.project.details(id));
      }

    }, [router, currentEvent]);

  const onSubmit = handleSubmit(async (data) => {
    const utcStart = dayjs(data?.start).utc();
    const utcEnd = data?.end ? dayjs(data?.end).utc() : null;
    const eventData = {
      id: currentEvent?.id ? currentEvent?.id : uuidv4(),
      // color: data?.color,
      title: data?.name,
      // allDay: data?.allDay,
      description: data?.description,
      notes: data?.description,
      end: utcEnd ? utcEnd.format('YYYY-MM-DD') : null,
      start: utcStart.format('YYYY-MM-DD'),
      // endDate: currentEvent.type === 'installation' || currentEvent.type === 'service' ? data?.end : null,
      startDate: currentEvent.type === 'installation' || currentEvent.type === 'service' ? utcStart.format('YYYY-MM-DD') : null,
      duration: currentEvent.type === 'installation' || currentEvent.type === 'service' ?
        dayjs(utcEnd.format('YYYY-MM-DD')).diff(dayjs(utcStart.format('YYYY-MM-DD')), 'day') + 1 : null,
      inspectionDate: currentEvent.type === 'inspection' ? utcStart.format('YYYY-MM-DD') : null,
      finishPermissionDate: currentEvent.type === 'finishPermission' ? utcStart.format('YYYY-MM-DD') : null,
      name: currentEvent?.originalName,
    };

    // console.log('eventData', eventData);

    try {
      if (!dateError) {
        if (currentEvent?.id) {
          const eventId = currentEvent?.id.split('-')[0];
          const module = currentEvent?.type === 'service' ? 'service' : 'project';
          await axios.post(`${CONFIG.apiUrl}/${module}s/update/${module}/${eventId}/`, {
            ...eventData,
            userReporter: JSON.stringify(userLogged?.data),
          });
          toast.success('Update success!');
        } else {
          await createEvent(eventData);
          toast.success('Create success!');
        }
        onClose();
        reset();
      }
    } catch (error) {
      console.error(error);
    }
  });

  const onDelete = useCallback(async () => {
    try {
      const eventId = currentEvent?.id.split('-')[0];
      const module = currentEvent?.type === 'service' ? 'service' : 'project';
      await axios.delete(`${CONFIG.apiUrl}/${module}s/delete/${module}/${eventId}/`, {
        data: {
          userReporter: userLogged?.data
        },
      });
      toast.success('Delete success!');
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [currentEvent, onClose, userLogged?.data]);

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        {currentEvent?.type?.toLowerCase().indexOf('measurement') === -1 && (
          <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
            <Stack spacing={3}>
              <Field.Text name="title" label="Title" disabled />

              <Field.Text
                name='description'
                label={currentEvent?.type !== 'service' ? 'Description' : 'Notes'}
                multiline rows={3}
                disabled
              />

              {/* <Field.Switch name="allDay" label="All day" /> */}

              <Field.MobileDateTimePicker
                name="start"
                label={
                  currentEvent?.type === 'installation' || currentEvent?.type === 'service' ? 'Start date' :
                    currentEvent?.type === 'inspection' ? 'Inspection date' : 'Finish date'
                }
                minDate={dayjs(currentEvent?.salesOrder?.date)}
                disabled
              />

              {(currentEvent?.type === 'installation' || currentEvent?.type === 'service') ? (
                <>
                  <Field.MobileDateTimePicker
                    name="end"
                    label="End date"
                    minDate={dayjs(currentEvent?.salesOrder?.date)}
                    slotProps={{
                      textField: {
                        error: dateError,
                        helperText: dateError ? 'End date must be later than start date' : null,
                      },
                    }}
                    disabled
                  />
                  {(currentEvent?.type !== 'service' && getProjectInstaller(currentEvent, CONFIG)?.name) && (
                    <Box sx={{ display: 'flex', mb: 1, p: 1, justifyContent: 'flex-start' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, mt: 1.5 }}>
                        Installer:
                      </Typography>
                      <Label sx={{ display: 'flex', minHeight: 40 }}>
                        <Avatar
                          src={getProjectInstaller(currentEvent, CONFIG).avatarUrl || getProjectInstaller(currentEvent, CONFIG).avatar_url}
                          sx={{ width: 24, height: 24, mr: 1 }} />
                        {getProjectInstaller(currentEvent, CONFIG).name}
                      </Label>
                    </Box>
                  )}
                  {(currentEvent?.type === 'service' && getServiceInstaller(currentEvent, CONFIG)?.name) && (
                    <Box sx={{ display: 'flex', mb: 1, p: 1, justifyContent: 'flex-start' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, mt: 1.5 }}>
                        Service Crew:
                      </Typography>
                      <Label sx={{ display: 'flex', minHeight: 40 }}>
                        <Avatar
                          src={getServiceInstaller(currentEvent, CONFIG).avatarUrl || getServiceInstaller(currentEvent, CONFIG).avatar_url}
                          sx={{ width: 24, height: 24, mr: 1 }} />
                        {getServiceInstaller(currentEvent, CONFIG).name}
                      </Label>
                    </Box>
                  )}
                </>

              ) : (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {
                    currentEvent?.type === 'inspection' ? 'Inspection date' : 'Finish date'
                  } must be the same or after {
                    currentEvent?.type === 'inspection' ? fDate(currentEvent?.startDate) : fDate(currentEvent?.inspectionDate)
                  } ({currentEvent?.type === 'inspection' ? 'Installation date' : 'Inspection date'})
                </Typography>
              )}

              {/* <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                selected={field.value}
                onSelectColor={(color) => field.onChange(color)}
                colors={colorOptions}
              />
            )}
          /> */}
            </Stack>
          </Scrollbar>
        )}

        <DialogActions sx={{ flexShrink: 0 }}>
          {(!!currentEvent?.id && currentEvent?.type.toLowerCase().indexOf('measurement') === -1 &&
            !isInstaller(userLogged?.data?.user_role?.name)) && (
              <Tooltip title="Delete event">
                <IconButton onClick={confirmDelete.onTrue} color="error">
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            )}

          <Box sx={{ flexGrow: 1 }} />

          {/* {currentEvent?.type.toLowerCase().indexOf('measurement') === -1 && (

            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={dateError}
            >
              Save changes
            </LoadingButton>

          )} */}

          <Button
            variant="contained"
            color="info"
            onClick={() => handleDetails(currentEvent?.id.split('-')[0])}
          >
            View Details
          </Button>

          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>


        </DialogActions>
      </Form>
      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete {
              currentEvent?.type !== 'service' ? 'installation project' : 'service'
            }  <strong> {currentEvent?.name} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={onDelete}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}
