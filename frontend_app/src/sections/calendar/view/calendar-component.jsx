import Calendar from '@fullcalendar/react'; // => request placed at the top

import listPlugin from '@fullcalendar/list';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import { useMemo, useState, useEffect } from 'react';
import interactionPlugin from '@fullcalendar/interaction';

import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import DialogTitle from '@mui/material/DialogTitle';
import { Box, Paper, Popper, Typography, LinearProgress } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fDate, fIsAfter, fIsBetween } from 'src/utils/format-time';
import { getProjectInstallers } from 'src/utils/project-tasks-utils';
import { getServiceInstaller } from 'src/utils/service-tasks-utils';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { CALENDAR_COLOR_OPTIONS } from 'src/_mock/_calendar';
import { updateEvent, useGetProjectEvents } from 'src/actions/calendar';

import { Iconify } from 'src/components/iconify';

import { useDataContext } from 'src/auth/context/data/data-context';

import { StyledCalendar } from '../styles';
import { useEvent } from '../hooks/use-event';
import { CalendarForm } from '../calendar-form';
import { useCalendar } from '../hooks/use-calendar';
import { CalendarToolbar } from '../calendar-toolbar';
import { CalendarFilters } from '../calendar-filters';
import { CalendarFiltersResult } from '../calendar-filters-result';
import { CalendarNoteForm } from '../calendar-note-form';

function useSocketList(url, setItems) {
    useEffect(() => {
        const socket = new WebSocket(url);

        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'created' || message.type === 'updated') {
                setItems((prevData) => {
                    const idx = prevData.findIndex(
                        (item) => String(item.id) === String(message.item.id)
                    );

                    if (idx !== -1) {
                        const updated = [...prevData];
                        updated[idx] = message.item;
                        return updated;
                    }

                    return [message.item, ...prevData];
                });
            } else if (message.type === 'deleted') {
                setItems((prevData) =>
                    prevData.filter((item) => String(item.id) !== String(message.item.id))
                );
            }
        };

        return () => {
            try {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
            } catch (e) {
                console.error('Error closing socket', e);
            }
        };
    }, [url, setItems]);
}

// ----------------------------------------------------------------------
// Helper para measurements
// ----------------------------------------------------------------------

function getMeasurementContextText(measurement) {
    if (measurement.project?.name) {
        return `Installation ${measurement.project.name}`;
    }
    if (measurement.service?.name) {
        return `Service ${measurement.service.name}`;
    }
    if (measurement.customer?.name) {
        return `Customer ${measurement.customer.name}`;
    }
    return '';
}

// ----------------------------------------------------------------------

export function CalendarComponent({
    height=770,
    isOnlyWeek = false,
}) {

    const {
        loadedProjects,
        refetchProjects,
        loadingProjects,
        loadedServices,
        refetchServices,
        loadingServices,
        loadedMeasurements,
        refetchMeasurements,
        loadingMeasurements,
        loadedCalendarNotes,
        refetchCalendarNotes,
        loadingCalendarNotes,
    } = useDataContext();

    const [projects, setProjects] = useState([]);
    const [services, setServices] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [calendarNotes, setCalendarNotes] = useState([]);
    // const [workOrders, setWorkOrders] = useState([]);

    useEffect(() => {
        if (refetchProjects) refetchProjects();
        if (refetchServices) refetchServices();
        if (refetchMeasurements) refetchMeasurements();
        if (refetchCalendarNotes) refetchCalendarNotes();
    }, [refetchProjects, refetchServices, refetchMeasurements, refetchCalendarNotes]);

    useEffect(() => {
        setProjects(loadedProjects || []);
    }, [loadedProjects]);

    useEffect(() => {
        setServices(loadedServices || []);
    }, [loadedServices]);

    useEffect(() => {
        setMeasurements(loadedMeasurements || []);
    }, [loadedMeasurements]);

    useEffect(() => {
        setCalendarNotes(loadedCalendarNotes || []);
    }, [loadedCalendarNotes]);

    useSocketList(
        `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/projects/`,
        setProjects
    );

    useSocketList(
        `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/services/ws/services/`,
        setServices
    );

    useSocketList(
        `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/measurements/ws/measurements/`,
        setMeasurements
    );

    useSocketList(
        `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/project-calendar-notes/`,
        setCalendarNotes
    );

    const theme = useTheme();

    const openFilters = useBoolean();

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const {
        listPermissions,
    } = useDataContext();

    // const installProjects = useMemo(() => projects?.filter((project) => project.startDate).map((p) => ({
    //   ...p,
    //   id: `${p.id}-installation`,
    //   originalName: p.name,
    //   title: `Installation ${p.name}`,
    //   type: 'installation',
    //   namedType: 'installation',
    //   icon: 'fluent-emoji-high-contrast:man-mechanic',
    // })) || [], [projects]);

    const allActiveWorkOrders = useMemo(
        () => projects?.flatMap(
            (project) => (project.workOrders || [])
                .map((workOrder) => ({
                    ...workOrder,
                    woId: workOrder.id,
                    woName: workOrder.name,
                    projectName: project.name,
                    projectNumber: project.number,
                    projectId: project.id,
                    userManager: project.userManager,
                    project,
                })
                ).filter((workOrder) => !workOrder.is_finished) || []
        ), [projects]
    );

    // console.log('allActiveWorkOrders', allActiveWorkOrders);

    const installProjects = useMemo(
        () => {
            const installs = allActiveWorkOrders?.filter((workOrder) => workOrder.work_type.name.toLowerCase() === 'installation')

            return installs.map((wo) => ({
                ...wo,
                id: `${wo.projectId}-${wo.id}-installation`,
                name: wo.projectName,
                originalName: `${wo.projectName} - WO Installation`,
                userInstaller: wo.user_assignee,
                title: `Installation ${wo.projectName}`,
                type: 'installation',
                namedType: 'installation',
                icon: 'fluent-emoji-high-contrast:man-mechanic',
            }));
        },
        [allActiveWorkOrders]
    );

    const finishProjects = useMemo(
        () => {
            const installs = allActiveWorkOrders?.filter((workOrder) => workOrder.work_type.name.toLowerCase() === 'finish')

            return installs.map((wo) => ({
                ...wo,
                id: `${wo.projectId}-${wo.id}-finish`,
                name: wo.projectName,
                originalName: `${wo.projectName} - WO Finish`,
                userInstaller: wo.user_assignee,
                title: `Finish ${wo.projectName}`,
                type: 'finish',
                namedType: 'finish',
                icon: 'gis:flag-finish-b-o',
            }));
        },
        [allActiveWorkOrders]
    );

    const calendarNotesProjects = useMemo(() => calendarNotes?.filter((cn) => cn.startDate).map((p) => ({
        ...p,
        id: `${p.id}-calendarNote`,
        objectId: p.id,
        originalName: p.name,
        title: `Note ${p.name}`,
        type: 'calendarNote',
        namedType: 'calendar note',
        icon: 'si:ai-note-duotone',
    })) || [], [calendarNotes]);

    // const inspectionProjects = useMemo(
    //   () => projects?.filter((project) => project.hasPermission && project.inspectionDate).map((p) => ({
    //     ...p,
    //     id: `${p.id}-inspection`,
    //     originalName: p.name,
    //     title: `Inspection ${p.name}`,
    //     type: 'inspection',
    //     namedType: 'inspection',
    //     icon: 'icon-park-outline:inspection',
    //   })) || [], [projects]);

    const inspectionProjects = useMemo(
        () => {
            const inspections = allActiveWorkOrders?.filter(
                (workOrder) => workOrder.work_type?.name.toLowerCase() === 'inspection' &&
                    workOrder.inspection_type?.name.toLowerCase() === 'book and fasteners'
            );

            return inspections.map((wo) => ({
                ...wo,
                id: `${wo.projectId}-${wo.id}-inspection`,
                name: wo.projectName,
                originalName: `${wo.projectName} - WO Inspection`,
                userInstaller: wo.user_assignee,
                title: `Inspection ${wo.projectName}`,
                type: 'inspection',
                namedType: 'inspection',
                icon: 'icon-park-outline:inspection',
            }));
        },
        [allActiveWorkOrders]
    );

    // const finishPermissionProjects = useMemo(
    //   () => projects?.filter((project) => project.hasPermission && project.finishPermissionDate).map((p) => ({
    //     ...p,
    //     id: `${p.id}-finishPermission`,
    //     originalName: p.name,
    //     title: `Finish Permission ${p.name}`,
    //     type: 'finishPermission',
    //     namedType: 'finish permission',
    //     icon: 'ep:finished',
    //   })) || [], [projects]);


    const finishPermissionProjects = useMemo(
        () => {
            const finishes = allActiveWorkOrders?.filter(
                (workOrder) => workOrder.work_type?.name.toLowerCase() === 'inspection' &&
                    workOrder.inspection_type?.name.toLowerCase() === 'final'
            );

            return finishes.map((wo) => ({
                ...wo,
                id: `${wo.projectId}-${wo.id}-finishPermission`,
                name: wo.projectName,
                originalName: `${wo.projectName} - WO Final Inspection`,
                userInstaller: wo.user_assignee,
                title: `Finish Permission ${wo.projectName}`,
                type: 'finishPermission',
                namedType: 'finish permission',
                icon: 'ep:finished',
            }));
        },
        [allActiveWorkOrders]
    );

    const eventsServices = useMemo(
        () => services?.filter((s) => s.startDate).map((service) => ({
            ...service,
            id: `${service.id}-service`,
            originalName: service.name,
            description: service.serviceNotes,
            title: `Service ${service.name}`,
            start: service.startDate,
            end: service.endDate,
            // allDay: true,
            type: 'service',
            namedType: 'service',
            icon: 'carbon:user-service',
        })) || [], [services]);

    const eventsFirstDateMeasurements = useMemo(
        () =>
            measurements
                ?.filter((m) => m.firstDate)
                .map((measurement) => {
                    const contextText = getMeasurementContextText(measurement);

                    return {
                        ...measurement,
                        id: `${measurement.id}-measurement`,
                        name: `${measurement.number} First Check Measurement for ${contextText}`,
                        originalName: `${measurement.number} First Check Measurement for ${contextText}`,
                        description: `${measurement.number} First Check Measurement for ${contextText}`,
                        title: `${measurement.number} First Check Measurement`,
                        start: measurement.firstDate,
                        end: measurement.firstDate,
                        allDay: true,
                        type: 'firstCheckMeasurement',
                        namedType: 'first check measurement',
                        icon: 'tdesign:measurement',
                    };
                }) || [],
        [measurements]
    );

    const eventsSecondDateMeasurements = useMemo(
        () =>
            measurements
                ?.filter((m) => m.checkDate)
                .map((measurement) => {
                    const contextText = getMeasurementContextText(measurement);

                    return {
                        ...measurement,
                        id: `${measurement.id}-measurement`,
                        name: `${measurement.number} Second Check Measurement for ${contextText}`,
                        originalName: `${measurement.number} Second Check Measurement for ${contextText}`,
                        description: `${measurement.number} Second Check Measurement for ${contextText}`,
                        title: `${measurement.number} Second Check Measurement`,
                        start: measurement.checkDate,
                        end: measurement.checkDate,
                        allDay: true,
                        type: 'secondCheckMeasurement',
                        namedType: 'second check measurement',
                        icon: 'tdesign:measurement-1',
                    };
                }) || [],
        [measurements]
    );

    // const workOrderProjects = useMemo(
    //   () => {
    //     const allActiveWorkOrders =
    //       projects
    //         ?.flatMap((project) =>
    //           (project.workOrders || []).map((workOrder) => ({
    //             ...workOrder,
    //             projectName: project.name,
    //             projectNumber: project.number,
    //             projectId: project.id,
    //             userManager: project.userManager,
    //           }))
    //         )
    //         .filter((workOrder) => !workOrder.is_finished) || [];

    //     return allActiveWorkOrders.map((wo) => ({
    //       ...wo,
    //       id: `${wo.projectId}-${wo.id}-workOrder`,
    //       customTitle: `WO ${wo.projectName} - ${wo.name}`,
    //       originalName: `${wo.projectName} - ${wo.name}`,
    //       title: `Work Order ${wo.projectName} - ${wo.name}`,
    //       type: 'workOrder',
    //       namedType: 'work order',
    //       icon: 'pajamas:work-item-maintenance',
    //     }));
    //   },
    //   [projects]
    // );

    const {
        events: installEvents, eventsLoading: installEventsLoading
    } = useGetProjectEvents(installProjects, 'installation');

    const {
        events: finishEvents, eventsLoading: finishEventsLoading
    } = useGetProjectEvents(finishProjects, 'finish');

    const {
        events: calendarNoteEvents, eventsLoading: calendarNoteEventsLoading
    } = useGetProjectEvents(calendarNotesProjects, 'calendarNote');

    // const {
    //   events: workOrderEvents, eventsLoading: workOrderEventsLoading
    // } = useGetProjectEvents(workOrderProjects, 'workOrder');

    const {
        events: inspectionEvents, eventsLoading: inspectionEventsLoading
    } = useGetProjectEvents(inspectionProjects, 'inspection');

    const {
        events: finishPermissionEvents, eventsLoading: finishPermissionEventsLoading
    } = useGetProjectEvents(finishPermissionProjects, 'finishPermission');

    const {
        events: serviceEvents, eventsLoading: serviceEventsLoading
    } = useGetProjectEvents(eventsServices, 'service');

    const {
        events: firstDateMeasurementEvents, eventsLoading: firstDateMeasurementEventsLoading
    } = useGetProjectEvents(eventsFirstDateMeasurements, 'firstCheckMeasurement');

    const {
        events: secondDateMeasurementEvents, eventsLoading: secondDateMeasurementEventsLoading
    } = useGetProjectEvents(eventsSecondDateMeasurements, 'secondCheckMeasurement');

    const events = useMemo(
        () => [
            ...installEvents,
            ...finishEvents,
            ...calendarNoteEvents,
            // ...workOrderEvents,
            ...inspectionEvents,
            ...finishPermissionEvents,
            ...serviceEvents,
            ...firstDateMeasurementEvents,
            ...secondDateMeasurementEvents
        ], [
        installEvents,
        finishEvents,
        calendarNoteEvents,
        // workOrderEvents,
        inspectionEvents,
        finishPermissionEvents,
        serviceEvents,
        firstDateMeasurementEvents,
        secondDateMeasurementEvents
    ]);

    const eventsLoading = (
        installEventsLoading ||
        calendarNoteEventsLoading ||
        // workOrderEventsLoading ||
        inspectionEventsLoading ||
        finishPermissionEventsLoading ||
        serviceEventsLoading ||
        firstDateMeasurementEventsLoading ||
        secondDateMeasurementEventsLoading
    );

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
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {iconClass && (
                    <Iconify
                        icon={iconClass}
                        sx={{ mr: 1 }}
                    />
                )}
                <Box
                    component='span'
                    sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        maxWidth: '100%',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                    }}
                >
                    {customTitle}
                </Box>
            </Box>
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
        <CalendarFiltersResult
            filters={filters}
            totalResults={dataFiltered.length}
            sx={{ mb: { xs: 2, md: 3 } }}
        />
    );

    const flexProps = { flex: '0 0 auto', display: 'flex', flexDirection: 'column' };

    const [titleLinearProgress, setTitleLinearProgress] = useState('Loading calendar events...');

    const [tooltipAnchor, setTooltipAnchor] = useState(null);
    const [tooltipInfo, setTooltipInfo] = useState({});

    const handleEventMouseEnter = (info) => {

        setTooltipAnchor(info.el);

        const { type } = info.event.extendedProps;
        const { namedType } = info.event.extendedProps;

        const projectInstaller = type === 'service' ?
            getServiceInstaller(info.event.extendedProps, CONFIG) :
            type === 'installation' || type === 'inspection' || type === 'finishPermission' || type === 'finish' ?
                info.event.extendedProps.user_assignee :
                type === 'firstCheckMeasurement' ?
                    info.event.extendedProps.firstAssignee :
                    info.event.extendedProps.checkAssignee


        const title = info.event.extendedProps.customTitle
            || info.event._def.title
            || info.event._def.publicId;
        const startDate = info.event.start;
        const endDate = info.event.end;
        const installer = info.event.extendedProps.userInstaller || projectInstaller;
        const responsible = info.event.extendedProps.userManager;
        const { description } = info.event.extendedProps;

        setTooltipInfo({
            title,
            startDate,
            endDate,
            installer,
            description,
            responsible,
            namedType,
        });
    };

    const handleEventMouseLeave = () => {
        setTooltipAnchor(null);
        setTooltipInfo({});
    };

    const openTooltip = Boolean(tooltipAnchor);
    const id = openTooltip ? 'calendar-event-tooltip' : undefined;

    return (
        <>
            {
                (loadedProjects?.length === 0 || loadingProjects || loadedServices?.length === 0 || loadingServices) ? (
                    <Box
                        sx={{
                            width: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '80vh',
                            margin: 'auto'
                        }}
                    >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {titleLinearProgress}
                        </Typography>
                        <LinearProgress
                            key="error"
                            sx={{
                                mb: 2,
                                width: '100%',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'black',
                                },
                                backgroundColor: '#e0e0e0',
                            }}
                        />
                    </Box>
                ) : (

                    <Box sx={{ width: '100%', p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>

                        {canReset && renderResults}

                        <Card sx={{
                            ...flexProps,
                            height: '100%',
                            minWidth: '100%',
                            minHeight: filters.state.colors.length === 0 && !filters.state.startDate && !filters.state.endDateDate ? height : height - 100,
                            overflow: 'visible'
                        }}>
                            <StyledCalendar sx={{ ...flexProps, '.fc.fc-media-screen': { flex: '0 0 auto' }, minHeight: '100%', height: '100%' }}>
                                <CalendarToolbar
                                    date={fDate(date)}
                                    view={view}
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
                                    eventMouseEnter={handleEventMouseEnter}
                                    eventMouseLeave={handleEventMouseLeave}
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
                                    height={filters.state.colors.length === 0 && !filters.state.startDate && !filters.state.endDateDate ? 700 : 600}
                                />

                                <Popper
                                    id={id}
                                    open={openTooltip}
                                    anchorEl={tooltipAnchor}
                                    placement="top"
                                    // sx={{ zIndex: (theme) => theme.zIndex.tooltip + 2000 }}
                                    modifiers={[
                                        { name: 'offset', options: { offset: [0, 10] } },
                                        { name: 'preventOverflow', options: { boundary: document.body } }
                                    ]}
                                >
                                    <Paper elevation={1} sx={{ p: 1, bgcolor: 'black', color: 'white', }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                                            <Typography variant="caption">
                                                {tooltipInfo.namedType?.toUpperCase()}: {tooltipInfo.title}
                                            </Typography>
                                            {tooltipInfo.installer?.name && (
                                                <Typography variant="caption">
                                                    Assignee(s): {tooltipInfo.installer?.name}
                                                </Typography>
                                            )}
                                            {tooltipInfo.responsible?.name && (
                                                <Typography variant="caption">
                                                    Responsible: {tooltipInfo.responsible?.name}
                                                </Typography>
                                            )}
                                            {/* {tooltipInfo.description && (
                          <Typography variant="caption" sx={{ maxWidth: 400 }}>
                            {tooltipInfo.description}
                          </Typography>
                        )} */}
                                        </Box>
                                    </Paper>
                                </Popper>
                            </StyledCalendar>
                        </Card>
                        <Dialog
                            fullWidth
                            maxWidth={currentEvent?.type !== 'calendarNote' ? 'sm' : 'md'}
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
                                            Manage {currentEvent?.namedType} event
                                        </Typography>
                                    </Box>
                                )}
                            </DialogTitle>

                            {currentEvent && currentEvent?.type !== 'calendarNote' && (
                                <CalendarForm
                                    currentEvent={currentEvent}
                                    colorOptions={CALENDAR_COLOR_OPTIONS}
                                    onClose={onCloseForm}
                                />
                            )}
                            {currentEvent && currentEvent?.type === 'calendarNote' && (
                                <CalendarNoteForm
                                    currentEvent={currentEvent}
                                    onClose={onCloseForm}
                                />
                            )}
                        </Dialog>

                        <CalendarFilters
                            events={events}
                            filters={filters}
                            canReset={canReset}
                            dateError={dateError}
                            open={openFilters.value}
                            onClose={openFilters.onFalse}
                            onClickEvent={onClickEventInFilters}
                            colorOptions={CALENDAR_COLOR_OPTIONS}
                        />
                    </Box>
                )}
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
