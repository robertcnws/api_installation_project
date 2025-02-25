import { z as zod } from 'zod';
import { useCallback, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';

import { uuidv4 } from 'src/utils/uuidv4';
import { fIsAfter } from 'src/utils/format-time';

import { createEvent, updateEvent, deleteEvent } from 'src/actions/calendar';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ColorPicker } from 'src/components/color-utils';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import axios from 'axios';
import { CONFIG } from 'src/config-global';
import dayjs from 'dayjs';
import { name } from 'dayjs/locale/en';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export const EventSchema = zod.object({
  title: zod
    .string()
    .min(1, { message: 'Title is required!' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  description: zod
    .string()
    .min(1, { message: 'Description is required!' }),
  // .min(50, { message: 'Description must be at least 50 characters' }),
  // Not required
  color: zod.string(),
  allDay: zod.boolean(),
  start: zod.union([zod.string(), zod.number()]),
  end: zod.union([zod.string(), zod.number()]),
});

// ----------------------------------------------------------------------

export function ProjectCalendarForm({ currentEvent, colorOptions, onClose }) {

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

  const dateError = fIsAfter(values.start, values.end);

  const handleDetails = useCallback(
    (id) => {
      localStorage.setItem('projectId', id);
      localStorage.setItem('projectView', 'calendar');
      router.push(paths.dashboard.project.details(id));
    }, [router]);

  const onSubmit = handleSubmit(async (data) => {
    const eventData = {
      id: currentEvent?.id ? currentEvent?.id : uuidv4(),
      // color: data?.color,
      title: data?.title,
      // allDay: data?.allDay,
      description: data?.description,
      end: data?.end,
      start: data?.start,
      endDate: data?.end,
      startDate: data?.start,
      name: data?.title,
    };

    try {
      if (!dateError) {
        if (currentEvent?.id) {
          await axios.post(`${CONFIG.apiUrl}/projects/update/project/${currentEvent?.id}/`, {
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
      await axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${currentEvent?.id}/`, {
        data: { 
          userReporter: userLogged?.data 
        },
      });
      toast.success('Delete success!');
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [currentEvent?.id, onClose, userLogged?.data]);

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
          <Stack spacing={3}>
            <Field.Text name="title" label="Title" />

            <Field.Text name="description" label="Description" multiline rows={3} />

            {/* <Field.Switch name="allDay" label="All day" /> */}

            <Field.MobileDateTimePicker name="start" label="Start date" minDate={dayjs(currentEvent?.salesOrder?.date)} />

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
            />

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

        <DialogActions sx={{ flexShrink: 0 }}>
          {!!currentEvent?.id && (
            <Tooltip title="Delete event">
              <IconButton onClick={confirmDelete.onTrue} color="error">
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={dateError}
          >
            Save changes
          </LoadingButton>

          <Button
            variant="contained"
            color="info"
            onClick={() => handleDetails(currentEvent?.id)}
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
            Are you sure want to delete installation project <strong> {currentEvent?.name} </strong>?
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
