import axios from 'axios';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Box, Button, Dialog, Tooltip, MenuItem, MenuList, Typography, DialogActions, LinearProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { getServiceInstaller } from 'src/utils/service-tasks-utils';
import { filteredDescriptionJson } from 'src/utils/project-tasks-utils';
import { extractDimensions } from 'src/utils/generate-installation-guide-pdf';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { useServiceByIdQuery } from 'src/_mock/__services';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

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

export function ServiceDetailsView({
    serviceId,
    onCloseModal = null
}) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const router = useRouter();

    const morePopover = usePopover();

    const {
        loadedServices,
        loadedTracks,
        loadedMeasurements,
        loadedProjects,
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

    const associatedMeasurement = useMemo(
        () => loadedMeasurements?.find(measurement => measurement.service?.id === itemById?.id) || null,
        [loadedMeasurements, itemById]
    );

    const associatedProject = useMemo(
        () => loadedProjects?.find(p => p?.salesOrder?.salesorder_id === itemById?.salesOrder?.salesorder_id) || null,
        [loadedProjects, itemById]
    );

    const DETAILS_TABS = [
        { label: 'Overview', value: 'overview' },
        { label: 'Tasks', value: 'tasks' },
        // { label: 'Attachments', value: 'attachments' },
        { label: 'Comments & History', value: 'comments' },
        ...((associatedProject || associatedMeasurement) && !onCloseModal) ? [
            {
                label: <>
                    <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={morePopover.onOpen}>
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
                                        localStorage.setItem('backFromProjectDetails', 'serviceDetails');
                                        localStorage.setItem('backFromProjectDetailsServiceId', itemById?.id);
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
                            {associatedMeasurement && associatedMeasurement?.id && (
                                <MenuItem
                                    onClick={() => {
                                        morePopover.onClose();
                                        localStorage.setItem('measurementId', associatedMeasurement?.id);
                                        localStorage.setItem('backFromMeasurementDetails', 'service');
                                        localStorage.setItem('backFromMeasurementDetailsProjectId', '');
                                        localStorage.setItem('backFromMeasurementDetailsServiceId', itemById?.id);
                                        router.push(paths.dashboard.measurement.details(associatedMeasurement?.id));
                                    }}
                                >
                                    <Iconify icon="tdesign:measurement-1" />
                                    Measurements
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

    const [allIssuesCompleted, setAllIssuesCompleted] = useState(false);

    const [someItemsSelected, setSomeItemsSelected] = useState(false);

    const [selectedListItems, setSelectedListItems] = useState([]);

    const [isSubmiting, setIsSubmiting] = useState(false);

    const [serviceType, setServiceType] = useState(itemById?.serviceType);

    const [serviceNotes, setServiceNotes] = useState(itemById?.notes);

    const [serviceAddress, setServiceAddress] = useState(itemById?.address);

    const [servicePlace, setServicePlace] = useState(itemById?.servicePlace);

    const [serviceBooleanValues, setServiceBooleanValues] = useState({
        hasToPay: itemById?.hasToPay || false,
        byFactory: itemById?.byFactory || false,
    });

    const items = useMemo(() => itemById?.issuedProducts, [itemById]);

    const listItems = useMemo(() => items?.filter((product) => product.line_item_type === 'goods'), [items]);

    const [listSelectedTracks, setListSelectedTracks] = useState([]);


    useEffect(() => {
        if (itemById?.id) {
            setServiceType(itemById?.serviceType);
            setServiceNotes(itemById?.notes);
            setServiceAddress(itemById?.address);
            setServicePlace(itemById?.servicePlace);
            setServiceBooleanValues({
                hasToPay: itemById?.hasToPay || false,
                byFactory: itemById?.byFactory || false,
            });
        }
    }, [itemById]);


    useEffect(() => {
        if (fetchedService && fetchedService?.id) {
            setItemById(fetchedService);
        }
    }, [fetchedService]);

    useEffect(() => {
        if (loadedTracks && loadedTracks?.length > 0) {
            setListSelectedTracks(loadedTracks);
        }
    }, [loadedTracks]);

    useEffect(() => {
        const socket = new WebSocket(`${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/services/ws/service/${serviceId}/`);
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
        const socket = new WebSocket(`${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/tracks/`);
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
        const tListSelectedTracks = selectedComments ? (listSelectedTracks.filter(
            (track) => track.action.includes(itemById?.id) && !track.action.includes('comment')
        )?.length || 0) : 0;
        return tComments + tListSelectedTracks;
    }, [itemById, listSelectedTracks, selectedComments]);


    const totalTasks = useMemo(() => (
        itemById?.serviceDefaultTasks?.filter((task) => task.service_default_task?.is_active)?.length
        || 0), [itemById]
    );


    const tasks = useMemo(() =>
        itemById?.serviceDefaultTasks?.filter((task) => task.service_default_task?.is_active) || [], [itemById]
    );

    // console.log('itemById?.serviceDefaultTasks', itemById?.serviceDefaultTasks);

    // console.log('tasks', tasks);

    const [openEdit, setOpenEdit] = useState(false);

    const [openEditTask, setOpenEditTask] = useState(false);

    const tabs = useTabs('overview');

    const generateMeasurements = useCallback(
        async () => {

            const arrayDimensions = listItems?.map((i) => {
                const propertiesJson = filteredDescriptionJson(i.description);
                const dimensions = propertiesJson?.Size ? extractDimensions(i.description) : i.description ? extractDimensions(i.description) : null;
                let config = ''
                if (propertiesJson?.Config?.length > 0 || propertiesJson?.config?.length > 0) {
                    config = propertiesJson?.Config || propertiesJson?.config;
                }
                else if (propertiesJson?.Size?.length > 0 || propertiesJson?.size?.length > 0) {
                    const array = propertiesJson?.Size?.split(' ') || propertiesJson?.size?.split(' ');
                    config = array[array.length - 1];
                }
                const sku = propertiesJson?.SKU || propertiesJson?.sku;
                const type = sku?.split(' ')[0] || i?.description.split(' ')[0];
                return {
                    ...i,
                    type,
                    dimensions,
                    config,
                    first_check: false,
                    second_check: false,
                    notes: null,
                };
            });

            const service = { ...itemById };
            delete service.salesOrder;
            delete service.serviceDefaultTasks;
            delete service.serviceAttachments;
            delete service.serviceComments;
            delete service.serviceHistory;
            delete service.stageHistory;
            delete service.currentStage;

            let salesOrder = { ...itemById?.salesOrder };
            delete salesOrder.line_items;
            salesOrder = {
                ...salesOrder,
                line_items: listItems
            };

            try {
                const promise = axios.post(`${CONFIG.apiUrl}/measurements/create/measurement/`, {
                    service: JSON.stringify(service),
                    installer: JSON.stringify(getServiceInstaller(itemById, CONFIG)),
                    items: JSON.stringify(arrayDimensions),
                    userReporter: JSON.stringify(userLogged?.data),
                    salesOrder: JSON.stringify(salesOrder),
                    address: itemById?.address,
                });
                const response = await promise;
                toast.promise(promise, {
                    loading: 'Loading...',
                    success: `Measurements generated!`,
                    error: `Error in generating measurements!`,
                });
                return response.data;

            }
            catch (error) {
                console.error(error);
            }

            return null;

        }, [listItems, itemById, userLogged?.data]
    );

    const onDelete = useCallback(
        async (id) => {
            try {
                await axios.delete(`${CONFIG.apiUrl}/services/delete/service/${id}/`, {
                    data: {
                        userReporter: userLogged?.data
                    },
                });
                toast.success('Delete success!');
                if (onCloseModal) {
                    onCloseModal();
                } else {
                    router.push(paths.dashboard.service.list);
                }
            } catch (error) {
                console.error(error);
            }
        }, [userLogged?.data, router, onCloseModal]);


    const handleUpdateService = useCallback(async () => {
        setIsSubmiting(true);
        try {
            const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${itemById?.id}/add-issued-products/`, {
                salesOrder: selectedSalesOrder,
                userReporter: userLogged?.data,
                issuedProducts: selectedListItems.filter((i) => i.selected),
                hasToPay: serviceBooleanValues?.hasToPay,
                byFactory: serviceBooleanValues?.byFactory,
                address: serviceAddress,
                notes: serviceNotes,
                servicePlace,
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
    }, [
        selectedSalesOrder,
        selectedListItems,
        userLogged,
        openSalesOrderModal,
        itemById?.id,
        serviceBooleanValues?.hasToPay,
        serviceBooleanValues?.byFactory,
        serviceAddress,
        servicePlace,
        serviceNotes,
    ]);


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

    const [titleLinearProgress, setTitleLinearProgress] = useState(`Loading data from service ${item?.name ? item?.name : ''}...`);

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
                            <ServiceDetailsToolbar
                                service={itemById}
                                tabs={tabs}
                                componentLink={onCloseModal ? 'modal' : 'page'}
                                backLink={
                                    (() => {
                                        if (onCloseModal) return onCloseModal;
                                        const backFrom = localStorage.getItem('backFromServiceDetails');
                                        switch (backFrom) {
                                            case 'analytics':
                                                return paths.dashboard.general.analytics;
                                            case 'calendarDashboard':
                                                return paths.dashboard.general.calendar;
                                            case 'measurements':
                                                return paths.dashboard.measurement.list;
                                            case 'measurementDetails':
                                                return paths.dashboard.measurement.details(localStorage.getItem('backFromServiceDetailsMeasurementId'));
                                            case 'services':
                                                return paths.dashboard.service.list;
                                            default:
                                                return paths.dashboard.project.list;
                                        }
                                    })()
                                }
                                editLink={paths.dashboard.service.edit(`${itemById?.id}`)}
                                openEdit={tabs.value === 'overview' ? openEdit : tabs.value === 'tasks' ? openEditTask : null}
                                setOpenEdit={tabs.value === 'overview' ? setOpenEdit : tabs.value === 'tasks' ? setOpenEditTask : null}
                                type={(tabs.value === 'overview' || tabs.value === 'more') ? 'service' : tabs.value === 'tasks' ? 'tasks' : null}
                                onDelete={() => onDelete(itemById?.id)}
                                onGenerateMeasurements={() => generateMeasurements()}
                            />
                            {renderTabs}

                            {(tabs.value === 'overview' || tabs.value === 'more') &&
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

                        <Dialog open={openSalesOrderModal.value} onClose={openSalesOrderModal.onFalse} fullWidth maxWidth="xl">
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
                                    serviceNotes={serviceNotes}
                                    setServiceNotes={setServiceNotes}
                                    serviceBooleanValues={serviceBooleanValues}
                                    setServiceBooleanValues={setServiceBooleanValues}
                                    serviceAddress={serviceAddress}
                                    setServiceAddress={setServiceAddress}
                                    servicePlace={servicePlace}
                                    setServicePlace={setServicePlace}
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
                )}
        </>
    );
}
