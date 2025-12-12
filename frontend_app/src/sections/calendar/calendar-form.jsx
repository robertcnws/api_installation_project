import axios from 'axios';
import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import React, { useMemo, useCallback, useEffect } from 'react';
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
import { isAdministrator, isInstaller } from 'src/utils/check-permissions';
import { getProjectInstallers, getWorkOrderAssistants, getWorkOrderWorkers } from 'src/utils/project-tasks-utils';
import { getServiceInstaller } from 'src/utils/service-tasks-utils';

import { CONFIG } from 'src/config-global';
import { createEvent } from 'src/actions/calendar';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { ProjectEditModalWorkOrderView } from '../project/view/project-edit-modal-work-order-view';

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

  const [selectedEvent, setSelectedEvent] = React.useState(currentEvent);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const router = useRouter();

  const confirmDelete = useBoolean();

  const openWorkOrderForm = useBoolean();

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(EventSchema),
    defaultValues: selectedEvent,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const dateError = useMemo(
    () => fIsAfter(values.start, values.end),
    [values.start, values.end]
  );

  const handleDetails = useCallback(
    (id) => {
      const fieldId = selectedEvent?.type === 'service' ? 'serviceId' :
        selectedEvent?.type.toLowerCase().indexOf('measurement') !== -1 ? 'measurementId' : 'projectId';
      const field = selectedEvent?.type === 'service' ? 'Service' :
        selectedEvent?.type.toLowerCase().indexOf('measurement') !== -1 ? 'Measurement' : 'Project';
      localStorage.setItem(fieldId, id);
      localStorage.setItem(`backFrom${field}Details`, 'calendarDashboard');
      if (selectedEvent && selectedEvent?.type === 'service') {
        router.push(paths.dashboard.service.details(id));
      }
      else if (selectedEvent && selectedEvent?.type?.toLowerCase().indexOf('measurement') !== -1) {
        router.push(paths.dashboard.measurement.details(id));
      }
      else {
        router.push(paths.dashboard.project.details(id));
      }

    }, [router, selectedEvent]);

  const onSubmit = handleSubmit(async (data) => {
    const utcStart = dayjs(data?.start).utc();
    const utcEnd = data?.end ? dayjs(data?.end).utc() : null;
    const eventData = {
      id: selectedEvent?.id ? selectedEvent?.id : uuidv4(),
      // color: data?.color,
      title: data?.name,
      // allDay: data?.allDay,
      description: data?.description,
      notes: data?.description,
      end: utcEnd ? utcEnd.format('YYYY-MM-DD') : null,
      start: utcStart.format('YYYY-MM-DD'),
      // endDate: selectedEvent?.type === 'installation' || selectedEvent?.type === 'service' ? data?.end : null,
      startDate: selectedEvent?.type === 'installation' || selectedEvent?.type === 'service' ? utcStart.format('YYYY-MM-DD') : null,
      duration: selectedEvent?.type === 'installation' || selectedEvent?.type === 'service' ?
        dayjs(utcEnd.format('YYYY-MM-DD')).diff(dayjs(utcStart.format('YYYY-MM-DD')), 'day') + 1 : null,
      inspectionDate: selectedEvent?.type === 'inspection' ? utcStart.format('YYYY-MM-DD') : null,
      finishPermissionDate: selectedEvent?.type === 'finishPermission' ? utcStart.format('YYYY-MM-DD') : null,
      name: selectedEvent?.originalName,
    };

    // console.log('eventData', eventData);

    try {
      if (!dateError) {
        if (selectedEvent?.id) {
          const eventId = selectedEvent?.id.split('-')[0];
          const module = selectedEvent?.type === 'service' ? 'service' : 'project';
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
      const eventId = (
        selectedEvent?.type === 'installation' ||
        selectedEvent?.type === 'inspection' ||
        selectedEvent?.type === 'finishPermission'
      ) ?
        selectedEvent?.id.split('-')[1] :
        selectedEvent?.id.split('-')[0];
      const module = selectedEvent?.type === 'service' ? 'service' : 'project';
      const url = (
        selectedEvent?.type === 'installation' ||
        selectedEvent?.type === 'inspection' ||
        selectedEvent?.type === 'finishPermission'
      ) ?
        `${CONFIG.apiUrl}/projects/delete/project/${selectedEvent?.projectId}/work-order/${eventId}/` :
        `${CONFIG.apiUrl}/${module}s/delete/${module}/${eventId}/`;
      const userReporter = selectedEvent?.type === 'workOrder' ?
        JSON.stringify(userLogged?.data) :
        userLogged?.data;
      await axios.delete(url, {
        data: {
          userReporter,
        },
      });
      toast.success('Delete success!');
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [selectedEvent, onClose, userLogged?.data]);

  useEffect(() => {
    if (!currentEvent) return;

    // si quieres, puedes mapear solo los campos que usa el schema
    const mappedDefaults = {
      title: currentEvent.woName || currentEvent.name || '',
      description: currentEvent.description || '',
      color: currentEvent.color || '',
      allDay: currentEvent.allDay ?? false,
      start: currentEvent.start,
      end: currentEvent.end,
    };

    setSelectedEvent(currentEvent);
    reset(mappedDefaults); // 👈 aquí está la magia
  }, [currentEvent, reset]);
  

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        {selectedEvent?.type?.toLowerCase().indexOf('measurement') === -1 && (
          <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
            <Stack spacing={3}>
              <Field.Text name="title" label="Title" disabled />

              <Field.Text
                name='description'
                label={selectedEvent?.type !== 'service' ? 'Description' : 'Notes'}
                multiline rows={3}
                disabled
              />

              {/* <Field.Switch name="allDay" label="All day" /> */}

              <Field.MobileDateTimePicker
                name="start"
                label={
                  selectedEvent?.type === 'installation' || selectedEvent?.type === 'service' ? 'Start date' :
                    selectedEvent?.type === 'inspection' ? 'Inspection date' : 
                    selectedEvent?.type === 'finish' ? 'Finish date' : 'Finish Inspection date'
                }
                minDate={dayjs(selectedEvent?.salesOrder?.date)}
                disabled
              />

              {(selectedEvent?.type === 'installation' ||
                selectedEvent?.type === 'service' ||
                selectedEvent?.type === 'finishPermission' ||
                selectedEvent?.type === 'inspection' ||
                selectedEvent?.type === 'finish') ? (
                <>
                  <Field.MobileDateTimePicker
                    name="end"
                    label="End date"
                    minDate={dayjs(selectedEvent?.salesOrder?.date)}
                    slotProps={{
                      textField: {
                        error: dateError,
                        helperText: dateError ? 'End date must be later than start date' : null,
                      },
                    }}
                    disabled
                  />
                  {(selectedEvent?.type !== 'service' && getWorkOrderWorkers(currentEvent)) && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', gap: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, mt: 1.5 }}>
                          Installer(s):
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {getWorkOrderWorkers(currentEvent).map((worker) => (
                            <Label sx={{ display: 'flex', minHeight: 40 }} key={worker.id}>
                              <Avatar
                                src={worker.avatarUrl || worker.avatar_url}
                                sx={{ width: 24, height: 24, mr: 1 }} />
                              {worker.firstName || worker.first_name} {worker.lastName || worker.last_name}
                            </Label>
                          ))}
                        </Box>
                      </Box>
                      {getWorkOrderAssistants(currentEvent).length > 0 && (
                        <Box sx={{ display: 'flex', mt: 1, justifyContent: 'flex-start' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, mt: 1.5 }}>
                            Assistant(s):
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {getWorkOrderAssistants(currentEvent).map((worker, index) => (
                              <Label sx={{ display: 'flex', minHeight: 40 }} key={`${worker.id}-${index}`}>
                                <Iconify icon="mdi:account-helper" sx={{ width: 24, height: 24, mr: 1 }} />
                                {worker.name}
                              </Label>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                  {(selectedEvent?.type === 'service' && getServiceInstaller(currentEvent, CONFIG)?.name) && (
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
                    selectedEvent?.type === 'inspection' ? 'Inspection date' : 'Finish date'
                  } must be the same or after {
                    selectedEvent?.type === 'inspection' ? fDate(selectedEvent?.startDate) : fDate(selectedEvent?.inspectionDate)
                  } ({selectedEvent?.type === 'inspection' ? 'Installation date' : 'Inspection date'})
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
          {(!!selectedEvent?.id && selectedEvent?.type.toLowerCase().indexOf('measurement') === -1 &&
            isAdministrator(userLogged?.data?.user_role?.name)) && (
              <Tooltip title="Delete event">
                <IconButton onClick={confirmDelete.onTrue} color="error">
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            )}

          <Box sx={{ flexGrow: 1 }} />

          {/* {selectedEvent?.type.toLowerCase().indexOf('measurement') === -1 && (

            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={dateError}
            >
              Save changes
            </LoadingButton>

          )} */}

          {(
            (selectedEvent?.type === 'installation' ||
            selectedEvent?.type === 'inspection' ||
            selectedEvent?.type === 'finishPermission' ||
            selectedEvent?.type === 'finish') &&
            isAdministrator(userLogged?.data?.user_role?.name)
          ) && (

              <Button
                variant="contained"
                color="primary"
                onClick={() => openWorkOrderForm.onTrue()}
              >
                View Work Order
              </Button>
            )}

          <Button
            variant="contained"
            color="info"
            onClick={() => handleDetails(selectedEvent?.id.split('-')[0])}
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
              selectedEvent?.type !== 'service' ? '' : 'service'
            }  <strong> {selectedEvent?.type !== 'service' ? selectedEvent?.woName : selectedEvent?.name} </strong>?
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
      <ProjectEditModalWorkOrderView
        open={openWorkOrderForm.value}
        onClose={openWorkOrderForm.onFalse}
        workOrder={currentEvent}
        eventSingleId={selectedEvent?.woId}
        project={selectedEvent?.project}
        onCloseCalendar={onClose}
      />
    </>
  );
}
