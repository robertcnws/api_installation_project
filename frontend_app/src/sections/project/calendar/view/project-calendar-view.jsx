import Calendar from '@fullcalendar/react'; // => request placed at the top

import { useMemo, useEffect } from 'react';
import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';

import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import DialogTitle from '@mui/material/DialogTitle';
import { Box, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fDate, fIsAfter, fIsBetween } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/_calendar';
import { updateEvent, useGetProjectEvents } from 'src/actions/calendar';

import { Iconify } from 'src/components/iconify';

import { useDataContext } from 'src/auth/context/data/data-context';

import { StyledCalendar } from '../styles';
import { useEvent } from '../hooks/use-event';
import { useCalendar } from '../hooks/use-calendar';
import { ProjectCalendarForm } from '../project-calendar-form';
import { ProjectCalendarToolbar } from '../project-calendar-toolbar';
import { ProjectCalendarFilters } from '../project-calendar-filters';
import { ProjectCalendarFiltersResult } from '../project-calendar-filters-result';





// ----------------------------------------------------------------------

export function ProjectCalendarView({ projects, isOnlyWeek }) {

  const theme = useTheme();

  const openFilters = useBoolean();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    listPermissions,
  } = useDataContext();

  const installProjects = useMemo(() => projects?.filter((project) => project.startDate).map((p) => ({
    ...p,
    id: `${p.id}-installation`,
    originalName: p.name,
    title: `Installation ${p.name}`,
    type: 'installation',
    namedType: 'installation',
    icon: 'fluent-emoji-high-contrast:man-mechanic',
  })), [projects]);

  const inspectionProjects = useMemo(
    () => projects?.filter((project) => project.hasPermission && project.inspectionDate).map((p) => ({
      ...p,
      id: `${p.id}-inspection`,
      originalName: p.name,
      title: `Inspection ${p.name}`,
      type: 'inspection',
      namedType: 'inspection',
      icon: 'icon-park-outline:inspection',
    })), [projects]);

  const finishPermissionProjects = useMemo(
    () => projects?.filter((project) => project.hasPermission && project.finishPermissionDate).map((p) => ({
      ...p,
      id: `${p.id}-finishPermission`,
      originalName: p.name,
      title: `Finish Permission ${p.name}`,
      type: 'finishPermission',
      namedType: 'finish permission',
      icon: 'ep:finished',
    })), [projects]);


  const {
    events: installEvents, eventsLoading: installEventsLoading
  } = useGetProjectEvents(installProjects, 'installation');

  const {
    events: inspectionEvents, eventsLoading: inspectionEventsLoading
  } = useGetProjectEvents(inspectionProjects, 'inspection');

  const {
    events: finishPermissionEvents, eventsLoading: finishPermissionEventsLoading
  } = useGetProjectEvents(finishPermissionProjects, 'finishPermission');

  const events = [...installEvents, ...inspectionEvents, ...finishPermissionEvents];
  const eventsLoading = installEventsLoading || inspectionEventsLoading || finishPermissionEventsLoading;

  const filters = useSetState({
    colors: [],
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const renderEventContent = (eventInfo) => {
    const customTitle = eventInfo.event._def.extendedProps.customTitle || eventInfo.event._def.extendedProps.name;
    const iconClass = eventInfo.event._def.extendedProps.icon;

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {iconClass && (
          <Iconify
            icon={iconClass}
            sx={{ mr: 1 }}
          />
        )}
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            maxWidth: '100%'
          }}
        >
          {customTitle}
        </span>
      </div>
    );
  }

  const {
    calendarRef,
    //
    view,
    date,
    //
    onDatePrev,
    onDateNext,
    onDateToday,
    onDropEvent,
    onChangeView,
    onSelectRange,
    onClickEvent,
    onResizeEvent,
    onInitialView,
    //
    openForm,
    onOpenForm,
    onCloseForm,
    //
    selectEventId,
    selectedRange,
    //
    onClickEventInFilters,
  } = useCalendar();

  const currentEvent = useEvent(events, selectEventId, selectedRange, openForm);

  useEffect(() => {
    const newView = isOnlyWeek ? 'listWeek' : null;
    Promise.resolve().then(() => {
      onInitialView(newView);
    });
  }, [onInitialView, isOnlyWeek]);

  const canReset =
    filters.state.colors.length > 0 || (!!filters.state.startDate && !!filters.state.endDate);

  const dataFiltered = applyFilter({ inputData: events, filters: filters.state, dateError });

  const renderResults = (
    <ProjectCalendarFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
      sx={{ mb: { xs: 3, md: 5 } }}
    />
  );

  const flexProps = { flex: '0 0 auto', display: 'flex', flexDirection: 'column' };

  return (
    <>
      <DashboardContent sx={{ ...flexProps }}>
        {/* <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: { xs: 3, md: 5 } }}
        >
          <Typography variant="h4">Calendar</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={onOpenForm}
          >
            New event
          </Button>
        </Stack> */}

        {canReset && renderResults}

        <Card sx={{ ...flexProps, height: '100%', minWidth: '105%', ml: '-5.3%' }}>
          <StyledCalendar sx={{ ...flexProps, '.fc.fc-media-screen': { flex: '0 0 auto' }, minHeight: '100%' }}>
            <ProjectCalendarToolbar
              isOnlyWeek={isOnlyWeek}
              date={fDate(date)}
              view={isOnlyWeek ? 'listWeek' : view}
              canReset={canReset}
              loading={eventsLoading}
              onNextDate={onDateNext}
              onPrevDate={onDatePrev}
              onToday={onDateToday}
              onChangeView={onChangeView}
              onOpenFilters={openFilters.onTrue}
            />

            <Calendar
              weekends
              editable
              droppable
              selectable={false}
              rerenderDelay={10}
              allDayMaintainDuration
              eventResizableFromStart
              ref={calendarRef}
              initialDate={date}
              initialView={isOnlyWeek ? 'listWeek' : view}
              dayMaxEventRows={5}
              eventDisplay="block"
              events={dataFiltered}
              eventContent={renderEventContent}
              headerToolbar={false}
              select={onSelectRange}
              // eventClick={
              //   verifyPermissions(
              //     listPermissions,
              //     CONFIG.permissions.system,
              //     CONFIG.permissions.moduleProjects,
              //     CONFIG.permissions.operationEditCalendar
              //   ) ||
              //     listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.projectManager) ? onClickEvent : null
              // }
              eventClick={onClickEvent}
              aspectRatio={3}
              eventDrop={(arg) => {
                onDropEvent(arg, updateEvent);
              }}
              eventResize={(arg) => {
                onResizeEvent(arg, updateEvent);
              }}
              plugins={[
                listPlugin,
                dayGridPlugin,
                timelinePlugin,
                timeGridPlugin,
                interactionPlugin,
              ]}
            />
          </StyledCalendar>
        </Card>
      </DashboardContent>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={openForm}
        onClose={onCloseForm}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
        PaperProps={{
          sx: {
            display: 'flex',
            overflow: 'hidden',
            flexDirection: 'column',
            '& form': { minHeight: 0, display: 'flex', flex: '1 1 auto', flexDirection: 'column' },
          },
        }}
      >
        <DialogTitle sx={{ minHeight: 76 }}>
          {openForm && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box className="dialog-title-icon">
                <Iconify icon="mdi:calendar" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {currentEvent?.id ? 'Edit' : 'Add'} {currentEvent?.namedType} event
              </Typography>
            </Box>
          )}
        </DialogTitle>

        <ProjectCalendarForm
          currentEvent={currentEvent}
          colorOptions={CALENDAR_COLOR_OPTIONS}
          onClose={onCloseForm}
        />
      </Dialog>

      <ProjectCalendarFilters
        events={events}
        filters={filters}
        canReset={canReset}
        dateError={dateError}
        open={openFilters.value}
        onClose={openFilters.onFalse}
        onClickEvent={onClickEventInFilters}
        colorOptions={CALENDAR_COLOR_OPTIONS}
      />
    </>
  );
}

function applyFilter({ inputData, filters, dateError }) {
  const { colors, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  inputData = stabilizedThis.map((el) => el[0]);

  if (colors.length) {
    inputData = inputData.filter((event) => colors.includes(event.color));
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((event) => fIsBetween(event.start, startDate, endDate));
    }
  }

  return inputData;
}
