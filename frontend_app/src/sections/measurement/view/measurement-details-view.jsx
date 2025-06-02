import axios from 'axios';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Box, Tooltip, MenuItem, MenuList, Typography, LinearProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { useMeasurementByIdQuery } from 'src/_mock/__measurements';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { MeasurementDetailsToolbar } from 'src/sections/measurement/measurement-details-toolbar';
import { MeasurementDetailsContent } from 'src/sections/measurement/view/measurement-details-content';
import { MeasurementDetailsCommentView } from 'src/sections/measurement/view/measurement-details-comment-view';
import { MeasurementDetailsAttachmentView } from 'src/sections/measurement/view/measurement-details-attachment-view';

import { useDataContext } from 'src/auth/context/data/data-context';

import { MeasurementEditModalDatesView } from '../measurement-edit-modal-dates-view';
import { MeasurementEditModalAddressView } from '../measurement-edit-modal-address-view';
import { MeasurementEditModalUserManagerView } from '../measurement-edit-modal-user-manager-view';
import { MeasurementEditModalPhoneNumberView } from '../measurement-edit-modal-phone-number-view';
import { MeasurementEditModalGeneralNotesView } from '../measurement-edit-modal-general-notes-view';

// ----------------------------------------------------------------------

export function MeasurementDetailsView({ measurementId }) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const router = useRouter();

    const morePopover = usePopover();

    const {
        loadedMeasurements,
        loadedTracks,
        loadedServices,
        loadedProjects,
    } = useDataContext();

    const [openDialogs, setOpenDialogs] = useState({
        firstAssignee: false,
        firstDate: false,
        checkAssignee: false,
        checkDate: false,
        generalNotes: false,
        address: false,
        phoneNumber: false,
    });

    const item = useMemo(() => loadedMeasurements?.find((measurement) => measurement.id === measurementId), [loadedMeasurements, measurementId]);

    const { data: fetchedMeasurement, refetch: refetchMeasurement } = useMeasurementByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [itemById, setItemById] = useState(fetchedMeasurement);

    const associatedProject = useMemo(
        () => loadedProjects?.find(p => p?.id === itemById?.project?.id) || null,
        [loadedProjects, itemById]
    );

    const associatedService = useMemo(
        () => loadedServices?.find(serv => serv?.id === itemById?.service?.id) || null,
        [loadedServices, itemById]
    );

    const DETAILS_TABS = [
        { label: 'Overview', value: 'overview' },
        // { label: 'Tasks', value: 'tasks' },
        // { label: 'Attachments', value: 'attachments' },
        { label: 'Comments & History', value: 'comments' },
        ...(associatedProject || associatedService) ? [
            {
                label: <>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        onClick={morePopover.onOpen}
                    >
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            More
                        </Typography>
                        <Iconify icon="fluent:more-vertical-32-filled" width={16} sx={{ ml: 0.5 }} />
                    </Box>
                    <CustomPopover
                        open={morePopover.open}
                        anchorEl={morePopover.anchorEl}
                        onClose={morePopover.onClose}
                        slotProps={{ arrow: { placement: 'left-top' } }}
                    >
                        <MenuList>
                            {associatedProject && associatedProject?.id && (
                                <MenuItem
                                    key='projects'
                                    onClick={() => {
                                        morePopover.onClose();
                                        localStorage.setItem('projectId', associatedProject?.id);
                                        localStorage.setItem('backFromProjectDetails', 'measurementDetails');
                                        localStorage.setItem('backFromProjectDetailsMeasurementId', itemById?.id);
                                        localStorage.setItem('backFromServiceDetailsMeasurementId', '');
                                        router.push(paths.dashboard.project.details(associatedProject?.id));
                                    }}
                                >
                                    <Tooltip
                                        title={
                                            <>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    Number: {associatedProject?.number}
                                                </Typography>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    Name: {associatedProject?.name}
                                                </Typography>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    Installation date: {fDate(associatedProject?.startDate) || 'N/A'}
                                                </Typography>
                                            </>
                                        }
                                        placement="right"
                                        arrow
                                    >
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Iconify icon="fluent-emoji-high-contrast:man-mechanic" />
                                            <Typography component="span" variant="body2">
                                                Installation {associatedProject?.name}
                                            </Typography>
                                        </Box>
                                    </Tooltip>


                                </MenuItem>
                            )}
                            {associatedService && associatedService?.id && (
                                <MenuItem
                                    key='services'
                                    onClick={() => {
                                        morePopover.onClose();
                                        localStorage.setItem('serviceId', associatedService?.id);
                                        localStorage.setItem('backFromServiceDetails', 'measurementDetails');
                                        localStorage.setItem('backFromProjectDetailsMeasurementId', '');
                                        localStorage.setItem('backFromServiceDetailsMeasurementId', itemById?.id);
                                        router.push(paths.dashboard.service.details(associatedService?.id));
                                    }}
                                >
                                    <Tooltip
                                        title={
                                            <>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    Number: {associatedService?.number}
                                                </Typography>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    Name: {associatedService?.name}
                                                </Typography>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    Start date: {fDate(associatedService?.startDate) || 'N/A'}
                                                </Typography>
                                            </>
                                        }
                                        placement="right"
                                        arrow
                                    >
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Iconify icon="carbon:user-service" />
                                            <Typography component="span" variant="body2">
                                                Service {associatedService?.name}
                                            </Typography>
                                        </Box>
                                    </Tooltip>


                                </MenuItem>
                            )}
                        </MenuList>
                    </CustomPopover >
                </>,
                value: 'more'
            },
        ] : [],
    ];


    const [openValidationDialog, setOpenValidationDialog] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');

    const selectedSalesOrder = useMemo(() => itemById?.salesOrder || {}, [itemById]);

    const openSalesOrderModal = useBoolean(false);

    const [isSubmiting, setIsSubmiting] = useState(false);

    const [listSelectedTracks, setListSelectedTracks] = useState(loadedTracks);


    useEffect(() => {
        if (fetchedMeasurement && fetchedMeasurement.id !== itemById?.id) {
            setItemById(fetchedMeasurement);
        }
    }, [fetchedMeasurement, itemById?.id]);

    useEffect(() => {
        if (loadedTracks.length && listSelectedTracks.length === 0) {
            setListSelectedTracks(loadedTracks);
        }
    }, [loadedTracks, listSelectedTracks.length]);

    useEffect(() => {
        const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/measurements/ws/measurement/${measurementId}/`);
        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            // console.log("WebSocket message:", message);
            if (message.type === 'created' || message.type === 'updated') {
                setItemById((prevData) => {
                    if (prevData?.id === message.item.id) {
                        return message.item;
                    }
                    return prevData;
                });
            }
            else if (message.type === 'deleted') {
                setItemById((prevData) => {
                    if (prevData?.id === message.item.id) {
                        return null;
                    }
                    return prevData;
                });
            }
        };
        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, [measurementId]);


    useEffect(() => {
        const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/tracks/`);
        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            // console.log("WebSocket message:", message);
            if (message.type === 'created' || message.type === 'updated') {
                setListSelectedTracks((prevData) => {
                    if (prevData?.some((track) => track.id === message.item.id)) {
                        return prevData.map((track) => {
                            if (track.id === message.item.id) {
                                return message.item;
                            }
                            return track;
                        });
                    }
                    return [...prevData, message.item];
                }
                );
            }
            else if (message.type === 'deleted') {
                setListSelectedTracks((prevData) => {
                    if (prevData?.some((track) => track.id === message.item.id)) {
                        return prevData.filter((track) => track.id !== message.item.id);
                    }
                    return prevData;
                }
                );
            }
        };
        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, []);


    const qtyMeasurementAttachments = useMemo(
        () => itemById?.measurementAttachments?.length || 0,
        [itemById]
    );

    const qtyTaskAttachments = useMemo(
        () => itemById?.measurementDefaultTasks?.reduce(
            (acc, task) => acc + (task.measurement_task_attachments ? task.measurement_task_attachments.length : 0), 0
        ) || 0,
        [itemById]
    );

    const totalAttachments = useMemo(() => qtyMeasurementAttachments + qtyTaskAttachments, [qtyMeasurementAttachments, qtyTaskAttachments]);

    const [selectedComments, setSelectedComments] = useState(false);

    const totalComments = useMemo(() => {
        const tComments = itemById?.measurementComments?.length || 0
        const tListSelectedTracks = selectedComments ? (listSelectedTracks.filter(
            (track) => track.action.includes(itemById?.id) && !track.action.includes('comment')
        )?.length || 0) : 0;
        return tComments + tListSelectedTracks;
    }, [itemById, listSelectedTracks, selectedComments]);

    const [openEdit, setOpenEdit] = useState(false);

    const [openEditTask, setOpenEditTask] = useState(false);

    const tabs = useTabs('overview');

    const onDelete = useCallback(
        async (id) => {
            try {
                await axios.delete(`${CONFIG.apiUrl}/measurements/delete/measurement/${id}/`, {
                    data: {
                        userReporter: userLogged?.data
                    },
                });
                toast.success('Delete success!');
                router.push(paths.dashboard.measurement.list);
            } catch (error) {
                console.error(error);
            }
        }, [userLogged?.data, router]);


    const renderTabs = (
        <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
            {DETAILS_TABS.map((tab) => (
                <Tab
                    key={tab.value}
                    iconPosition="end"
                    value={tab.value}
                    label={tab.label}
                    icon={
                        (tab.value === 'attachments' || tab.value === 'comments') ? (
                            ((tab.value === 'attachments' && totalAttachments > 0) ||
                                (tab.value === 'comments' && totalComments > 0))
                                ? (
                                    <Label variant="filled" color="primary">
                                        {tab.value === 'attachments' ? totalAttachments : totalComments}
                                    </Label>
                                ) : (
                                    ''
                                )) : (
                            tab.value === 'comments' ? (
                                (tab.value === 'comments' && totalComments > 0) ? (
                                    <Label variant="filled" color="primary">
                                        {totalComments}
                                    </Label>
                                ) : (
                                    ''
                                )) : (
                                ''
                            )
                        )
                    }
                // onClick={() => {
                //     if ((tab.value === 'tasks' ||
                //         tab.value === 'attachments' ||
                //         tab.value === 'comments') && !itemById?.userManager?.username) {
                //         setOpenValidationDialog(true);
                //         setValidationMessage('You need to add a RESPONSIBLE to perform this action');
                //     }
                // }}
                />
            ))}
        </Tabs>
    );

    const [titleLinearProgress, setTitleLinearProgress] = useState(`Loading data from measurement ${item?.number ? item?.number : ''}...`);

    return (
        <>
            {
                (!itemById?.id) ? (
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
                    <>
                        <DashboardContent>
                            <MeasurementDetailsToolbar
                                measurement={itemById}
                                tabs={tabs}
                                backLink={
                                    localStorage.getItem('backFromMeasurementDetails') === 'analytics' ?
                                        paths.dashboard.general.analytics :
                                        localStorage.getItem('backFromMeasurementDetails') === 'project' ?
                                            paths.dashboard.project.details(localStorage.getItem('backFromMeasurementDetailsProjectId')) :
                                            localStorage.getItem('backFromMeasurementDetails') === 'service' ?
                                                paths.dashboard.service.details(localStorage.getItem('backFromMeasurementDetailsServiceId')) :
                                                localStorage.getItem('backFromMeasurementDetails') === 'calendarDashboard' ?
                                                    paths.dashboard.general.calendar :
                                                    paths.dashboard.measurement.list
                                }
                                editLink={paths.dashboard.measurement.edit(`${itemById?.id}`)}
                                openEdit={tabs.value === 'overview' ? openEdit : tabs.value === 'tasks' ? openEditTask : null}
                                setOpenEdit={tabs.value === 'overview' ? setOpenEdit : tabs.value === 'tasks' ? setOpenEditTask : null}
                                type={tabs.value === 'overview' ? 'measurement' : tabs.value === 'tasks' ? 'tasks' : null}
                                onDelete={() => onDelete(itemById?.id)}
                            />
                            {renderTabs}

                            {(tabs.value === 'overview' || tabs.value === 'more') &&
                                <MeasurementDetailsContent
                                    measurement={itemById}
                                    refetchMeasurement={refetchMeasurement}
                                    setOpenEdit={setOpenEdit}
                                    openDialogs={openDialogs}
                                    setOpenDialogs={setOpenDialogs}
                                    openSalesOrderModal={openSalesOrderModal}
                                />
                            }

                            {/* {(tabs.value === 'tasks' && itemById?.userManager?.username) &&
                    <MeasurementDetailsTaskView
                        measurement={itemById}
                        refetchMeasurement={refetchMeasurement}
                        tasks={tasks ?? []}
                    />
                } */}

                            {(tabs.value === 'attachments') &&
                                <MeasurementDetailsAttachmentView
                                    measurement={itemById}
                                    refetchMeasurement={refetchMeasurement}
                                    openDialogs={openDialogs}
                                    setOpenDialogs={setOpenDialogs}
                                />
                            }

                            {(tabs.value === 'comments') &&
                                <MeasurementDetailsCommentView
                                    measurement={itemById}
                                    refetchMeasurement={refetchMeasurement}
                                    listSelectedTracks={listSelectedTracks.filter((track) => track.action.includes(itemById?.id))}
                                    selectedComments={selectedComments}
                                    setSelectedComments={setSelectedComments}
                                />
                            }

                        </DashboardContent>

                        <ConfirmDialog
                            open={openValidationDialog}
                            onClose={() => {
                                setOpenValidationDialog(false)
                                tabs.onChange(null, 'overview')
                            }}
                            title={`Invalid Action to reach: ${tabs.value}`}
                            maxWidth="xs"
                            content={
                                <Typography variant="body2">
                                    <b>{validationMessage}</b>
                                </Typography>
                            }
                        />
                        <MeasurementEditModalDatesView
                            isFirstDate={openDialogs.firstDate}
                            isCheckDate={openDialogs.checkDate}
                            measurement={itemById}
                            open={openDialogs.firstDate || openDialogs.checkDate}
                            onClose={() => {
                                setOpenDialogs((prev) => ({ ...prev, firstDate: false, checkDate: false }));
                            }}
                        />
                        <MeasurementEditModalUserManagerView
                            isFirstAssignee={openDialogs.firstAssignee}
                            isCheckAssignee={openDialogs.checkAssignee}
                            measurement={itemById}
                            open={openDialogs.firstAssignee || openDialogs.checkAssignee}
                            onClose={() => {
                                setOpenDialogs((prev) => ({ ...prev, firstAssignee: false, checkAssignee: false }));
                            }}
                        />
                        <MeasurementEditModalGeneralNotesView
                            measurement={itemById}
                            refetchMeasurement={refetchMeasurement}
                            open={openDialogs.generalNotes}
                            onClose={() => {
                                setOpenDialogs((prev) => ({ ...prev, generalNotes: false }));
                            }}
                        />
                        <MeasurementEditModalAddressView
                            measurement={itemById}
                            open={openDialogs.address}
                            onClose={() => {
                                setOpenDialogs((prev) => ({ ...prev, address: false }));
                            }}
                        />
                        <MeasurementEditModalPhoneNumberView
                            measurement={itemById}
                            open={openDialogs.phoneNumber}
                            onClose={() => {
                                setOpenDialogs((prev) => ({ ...prev, phoneNumber: false }));
                            }}
                        />
                    </>
                )}
        </>
    );
}
