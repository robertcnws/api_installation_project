import axios from 'axios';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Button, Dialog, Typography, DialogActions } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { useServiceByIdQuery } from 'src/_mock/__services';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { ServiceDetailsToolbar } from 'src/sections/service/service-details-toolbar';
import { ServiceDetailsContent } from 'src/sections/service/view/service-details-content';
import { ServiceDetailsTaskView } from 'src/sections/service/view/service-details-task-view';
import { ServiceEditModalAddressView } from 'src/sections/service/service-edit-modal-address-view';
import { ServiceDetailsCommentView } from 'src/sections/service/view/service-details-comment-view';
import { ServiceEditModalRefNumberView } from 'src/sections/service/service-edit-modal-ref-number-view';
import { ServiceDetailsAttachmentView } from 'src/sections/service/view/service-details-attachment-view';
import { ServiceEditModalPhoneNumberView } from 'src/sections/service/service-edit-modal-phone-number-view';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ServiceEditModalNotesView } from '../service-edit-modal-notes-view';
import { ServiceDetailsContentOverview } from '../service-details-content-overview';
import { ServiceEditModalAttachmentsView } from '../service-edit-modal-attachments-view';

// ----------------------------------------------------------------------

export function ServiceDetailsView({ serviceId }) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const router = useRouter();

    const {
        loadedServices,
        loadedTracks,
    } = useDataContext();

    const [openDialogs, setOpenDialogs] = useState({
        userManager: false,
        date: false,
        address: false,
        phoneNumber: false,
        refNumber: false,
        installationTeam: false,
        newIssue: false,
        editIssue: false,
        editNotes: false,
        editAttachments: false,
    });

    const item = useMemo(() => loadedServices?.find((service) => service.id === serviceId), [loadedServices, serviceId]);

    const { data: fetchedService, refetch: refetchService } = useServiceByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [itemById, setItemById] = useState(fetchedService);

    const DETAILS_TABS = [
        { label: 'Overview', value: 'overview' },
        { label: 'Tasks', value: 'tasks' },
        // { label: 'Attachments', value: 'attachments' },
        { label: 'Comments & History', value: 'comments' },
    ];


    const [openValidationDialog, setOpenValidationDialog] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');

    const selectedSalesOrder = useMemo(() => itemById?.salesOrder || {}, [itemById]);

    const openSalesOrderModal = useBoolean(false);

    const [allIssuesCompleted, setAllIssuesCompleted] = useState(false);

    const [someItemsSelected, setSomeItemsSelected] = useState(false);

    const [selectedListItems, setSelectedListItems] = useState([]);

    const [isSubmiting, setIsSubmiting] = useState(false);

    const [serviceType, setServiceType] = useState(itemById?.serviceType);

    const [listSelectedTracks, setListSelectedTracks] = useState([]);


    useEffect(() => {
        if (fetchedService) {
            setItemById(fetchedService);
        }
    }, [fetchedService]);

    useEffect(() => {
        if (loadedTracks) {
            setListSelectedTracks(loadedTracks);
        }
    }, [loadedTracks]);

    useEffect(() => {
        const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/services/ws/service/${serviceId}/`);
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
    }, [serviceId]);


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


    const qtyServiceAttachments = useMemo(
        () => itemById?.serviceAttachments?.length || 0,
        [itemById]
    );

    const qtyTaskAttachments = useMemo(
        () => itemById?.serviceDefaultTasks?.reduce(
            (acc, task) => acc + (task.service_task_attachments ? task.service_task_attachments.length : 0), 0
        ) || 0,
        [itemById]
    );

    const totalAttachments = useMemo(() => qtyServiceAttachments + qtyTaskAttachments, [qtyServiceAttachments, qtyTaskAttachments]);

    const [selectedComments, setSelectedComments] = useState(false);

    const totalComments = useMemo(() => {
            const tComments = itemById?.serviceComments?.length || 0
            const tListSelectedTracks = !selectedComments ? (listSelectedTracks.filter(
                (track) => track.action.includes(itemById?.id) && !track.action.includes('comment')
            )?.length || 0) : 0;
            return tComments + tListSelectedTracks;
        }, [itemById, listSelectedTracks, selectedComments]);


    const totalTasks = useMemo(() => (
        itemById?.serviceDefaultTasks?.filter((task) => task.service_default_task.is_active)?.length
        || 0), [itemById]
    );


    const tasks = useMemo(() =>
        itemById?.serviceDefaultTasks?.filter((task) => task.service_default_task.is_active) || [], [itemById]
    );

    const [openEdit, setOpenEdit] = useState(false);

    const [openEditTask, setOpenEditTask] = useState(false);

    const tabs = useTabs('overview');

    const onDelete = useCallback(
        async (id) => {
            try {
                await axios.delete(`${CONFIG.apiUrl}/services/delete/service/${id}/`, {
                    data: {
                        userReporter: userLogged?.data
                    },
                });
                toast.success('Delete success!');
                router.push(paths.dashboard.service.list);
            } catch (error) {
                console.error(error);
            }
        }, [userLogged?.data, router]);


    const handleUpdateService = useCallback(async () => {
        setIsSubmiting(true);
        try {
            const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${itemById?.id}/add-issued-products/`, {
                salesOrder: selectedSalesOrder,
                userReporter: userLogged?.data,
                issuedProducts: selectedListItems.filter((i) => i.selected),
            });

            toast.promise(promise, {
                loading: 'Updating service...',
                success: 'Service updated!',
                error: 'Error to update service',
            });

            await promise;

            setIsSubmiting(false);

            openSalesOrderModal.onFalse();

        } catch (error) {
            setIsSubmiting(false);
            console.error(error);
        }
    }, [selectedSalesOrder, selectedListItems, userLogged, openSalesOrderModal, itemById?.id]);


    const handleChangeProperties = useCallback(async (property, value) => {
        try {
            const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${itemById?.id}/change-properties/`, {
                [property]: value,
                userReporter: JSON.stringify(userLogged?.data),
            });

            toast.promise(promise, {
                loading: 'Updating service...',
                success: 'Service updated!',
                error: 'Error to update service',
            });

            await promise;

        } catch (error) {
            setIsSubmiting(false);
            console.error(error);
        }
    }, [itemById?.id, userLogged?.data]);




    const renderTabs = (
        <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
            {DETAILS_TABS.map((tab) => (
                <Tab
                    key={tab.value}
                    iconPosition="end"
                    value={tab.value}
                    label={tab.label}
                    icon={
                        (tab.value === 'tasks' || tab.value === 'attachments' || tab.value === 'comments') ? (
                            ((tab.value === 'tasks' && totalTasks > 0) ||
                                (tab.value === 'attachments' && totalAttachments > 0) ||
                                (tab.value === 'comments' && totalComments > 0))
                                ? (
                                    <Label variant="filled" color="primary">
                                        {tab.value === 'tasks' ? totalTasks :
                                            tab.value === 'attachments' ? totalAttachments : totalComments}
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
                    onClick={() => {
                        if ((tab.value === 'tasks' ||
                            tab.value === 'attachments' ||
                            tab.value === 'comments') && !itemById?.userManager?.username) {
                            setOpenValidationDialog(true);
                            setValidationMessage('You need to add a RESPONSIBLE to perform this action');
                        }
                    }}
                />
            ))}
        </Tabs>
    );

    return (
        <>
            <DashboardContent>
                <ServiceDetailsToolbar
                    service={itemById}
                    backLink={
                        localStorage.getItem('backFromServiceDetails') === 'analytics' ? paths.dashboard.general.analytics :
                            localStorage.getItem('backFromProjectDetails') === 'calendarDashboard' ? paths.dashboard.general.calendar : paths.dashboard.service.list
                    }
                    editLink={paths.dashboard.service.edit(`${itemById?.id}`)}
                    openEdit={tabs.value === 'overview' ? openEdit : tabs.value === 'tasks' ? openEditTask : null}
                    setOpenEdit={tabs.value === 'overview' ? setOpenEdit : tabs.value === 'tasks' ? setOpenEditTask : null}
                    type={tabs.value === 'overview' ? 'service' : tabs.value === 'tasks' ? 'tasks' : null}
                    onDelete={() => onDelete(itemById?.id)}
                />
                {renderTabs}

                {tabs.value === 'overview' &&
                    <ServiceDetailsContent
                        service={itemById}
                        refetchService={refetchService}
                        setOpenEdit={setOpenEdit}
                        openDialogs={openDialogs}
                        setOpenDialogs={setOpenDialogs}
                        openSalesOrderModal={openSalesOrderModal}
                        handleChangeProperties={handleChangeProperties}
                    />
                }

                {(tabs.value === 'tasks' && itemById?.userManager?.username) &&
                    <ServiceDetailsTaskView
                        service={itemById}
                        refetchService={refetchService}
                        tasks={tasks ?? []}
                    />
                }

                {(tabs.value === 'attachments' && itemById?.userManager?.username) &&
                    <ServiceDetailsAttachmentView
                        service={itemById}
                        refetchService={refetchService}
                        openDialogs={openDialogs}
                        setOpenDialogs={setOpenDialogs}
                    />
                }

                {(tabs.value === 'comments' && itemById?.userManager?.username) &&
                    <ServiceDetailsCommentView
                        service={itemById}
                        refetchService={refetchService}
                        listSelectedTracks={listSelectedTracks.filter((track) => track.action.includes(itemById?.id))}
                        selectedComments={selectedComments}
                        setSelectedComments={setSelectedComments}
                    />
                }

            </DashboardContent>

            <ServiceEditModalAddressView
                isEdit={itemById?.address}
                serviceId={itemById?.id}
                open={openDialogs.address}
                onClose={() => setOpenDialogs({ ...openDialogs, address: false })}
            />
            <ServiceEditModalPhoneNumberView
                isEdit={itemById?.salesOrder?.customer?.phone || itemById?.salesOrder?.customer?.mobile}
                serviceId={itemById?.id}
                open={openDialogs.phoneNumber}
                onClose={() => setOpenDialogs({ ...openDialogs, phoneNumber: false })}
            />
            <ServiceEditModalRefNumberView
                isEdit={itemById?.address}
                serviceId={itemById?.id}
                open={openDialogs.refNumber}
                onClose={() => setOpenDialogs({ ...openDialogs, refNumber: false })}
            />

            <ServiceEditModalNotesView
                service={itemById}
                open={openDialogs.editNotes}
                onClose={() => setOpenDialogs({ ...openDialogs, editNotes: false })}
            />

            <ServiceEditModalAttachmentsView
                service={itemById}
                open={openDialogs.editAttachments}
                onClose={() => setOpenDialogs({ ...openDialogs, editAttachments: false })}
            />

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

            <Dialog open={openSalesOrderModal.value} onClose={openSalesOrderModal.onFalse} fullWidth maxWidth="lg">
                <Scrollbar style={{ height: '70%' }}>
                    <ServiceDetailsContentOverview
                        salesOrder={selectedSalesOrder}
                        setSomeItemsSelected={setSomeItemsSelected}
                        setAllIssuesCompleted={setAllIssuesCompleted}
                        selectedListItems={selectedListItems}
                        setSelectedListItems={setSelectedListItems}
                        service={itemById}
                        serviceType={serviceType}
                        setServiceType={setServiceType}
                    />
                </Scrollbar>
                <DialogActions>
                    <Button
                        variant="contained"
                        disabled={!someItemsSelected || !allIssuesCompleted}
                        onClick={handleUpdateService}
                    >
                        Update Service
                    </Button>
                    <Button variant="outlined" onClick={openSalesOrderModal.onFalse}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
