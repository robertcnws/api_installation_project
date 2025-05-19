import axios from 'axios';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Box, Tooltip, MenuItem, MenuList, Typography, LinearProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';

import { fDate } from 'src/utils/format-time';
import { extractDimensions } from 'src/utils/generate-installation-guide-pdf';
import { getProjectInstaller, filteredDescriptionJson } from 'src/utils/project-tasks-utils';
import { isInstaller, isFinancialStaff, isWarehouseStaff, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectEditModalView } from './project-edit-modal-view';
import { ProjectDetailsToolbar } from '../project-details-toolbar';
import { ProjectDetailsContent } from '../project-details-content';
import { ProjectDetailsTaskView } from './project-details-task-view';
import { ProjectEditModalTaskView } from './project-edit-modal-task-view';
import { ProjectDetailsCommentView } from './project-details-comment-view';
import { ProjectDetailsFinancialView } from './project-details-financial-view';
import { ProjectEditModalAddressView } from './project-edit-modal-address-view';
import { ProjectDetailsAttachmentView } from './project-details-attachment-view';
import { ProjectDetailsReleaseFormView } from './project-details-release-form-view';
import { ProjectEditModalRefNumberView } from './project-edit-modal-ref-number-view';
import { ProjectEditModalDescriptionView } from './project-edit-modal-description-view';
import { ProjectEditModalPhoneNumberView } from './project-edit-modal-phone-number-view';
import { ProjectDetailsReleaseFormInstallerView } from './project-details-release-form-installer-view';
import { ProjectDetailsInstallationGuideFormView } from './project-details-installation-guide-form-view';
import { ProjectDetailsInstallationGuideFormInstallerView } from './project-details-installation-guide-form-installer-view';

// ----------------------------------------------------------------------

export function ProjectDetailsView({ projectId }) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const router = useRouter();

    const morePopover = usePopover();

    const {
        loadedProjects,
        listPermissions,
        loadedDefaultGuideProducts,
        loadedDefaultMaterials,
        loadedTracks,
        loadedMeasurements,
        loadedServices,
    } = useDataContext();

    const [openDialogs, setOpenDialogs] = useState({
        userManager: false,
        date: false,
        address: false,
        phoneNumber: false,
        refNumber: false,
        installationTeam: false,
        description: false,
    });

    const item = useMemo(() => loadedProjects?.find((project) => project.id === projectId), [loadedProjects, projectId]);

    const { data: fetchedProject, refetch: refetchProject } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [itemById, setItemById] = useState(fetchedProject);

    const taskFinishInstallation = useMemo(() =>
        itemById?.projectDefaultTasks?.find(
            (t) => t.project_default_task?.name.trim().toLowerCase().includes(CONFIG.tasks.finishInstallation.trim().toLowerCase())
        ),
        [itemById]
    );

    // const listSelectedTracks = useMemo(() => loadedTracks?.filter((track) => track.action.includes(itemById?.id)), [loadedTracks, itemById]);

    const items = useMemo(() => itemById?.salesOrder?.line_items, [itemById]);

    const listItems = useMemo(() => items?.filter((product) => product.line_item_type === 'goods'), [items]);

    const [listSelectedTracks, setListSelectedTracks] = useState([]);

    const associatedMeasurement = useMemo(
        () => loadedMeasurements?.find(measurement => measurement.project?.id === itemById?.id) || null,
        [loadedMeasurements, itemById]
    );

    const associatedServices = useMemo(
        () => loadedServices?.filter(serv => serv.salesOrder?.salesorder_id === itemById?.salesOrder?.salesorder_id) || null,
        [loadedServices, itemById]
    );

    const DETAILS_TABS = [
        { label: 'Overview', value: 'overview' },
        ...!isFinancialStaff(userLogged?.data?.user_role?.name) ? [
            { label: 'Tasks', value: 'tasks' },
        ] : [],
        ...(!isInstaller(userLogged?.data?.user_role?.name) &&
            !isFinancialStaff(userLogged?.data?.user_role?.name) &&
            !isWarehouseStaff(userLogged?.data?.user_role?.name)) ? [
            { label: 'Attachments', value: 'attachments' },
        ] : [],
        ...((listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.installer) ||
            listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.warehouseStaff)) &&
            taskFinishInstallation?.status.toLowerCase().indexOf(CONFIG.taskStatus.finished.toLowerCase()) !== -1) ? [
            { label: 'Release Form', value: 'releaseForm' },
        ] : [],
        ...listRolesAndSubroles(userLogged?.data?.user_role?.name)
            .some(elem => [CONFIG.roles.installer, CONFIG.roles.warehouseStaff]) ? [
            { label: 'Installation Guide', value: 'installationGuide' },
        ] : [],
        ...listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.financialStaff) ? [
            { label: 'Financial', value: 'financial' },
        ] : [],
        { label: 'Comments & History', value: 'comments' },
        ...(associatedMeasurement || associatedServices?.length > 0) ? [
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
                            {associatedMeasurement && associatedMeasurement?.id && (
                                <MenuItem
                                    key='measurements'
                                    onClick={() => {
                                        morePopover.onClose();
                                        localStorage.setItem('measurementId', associatedMeasurement?.id);
                                        localStorage.setItem('backFromMeasurementDetails', 'project');
                                        localStorage.setItem('backFromMeasurementDetailsProjectId', itemById?.id);
                                        localStorage.setItem('backFromMeasurementDetailsServiceId', '');
                                        router.push(paths.dashboard.measurement.details(associatedMeasurement?.id));
                                    }}
                                >
                                    <Iconify icon="tdesign:measurement-1" />
                                    Measurements
                                </MenuItem>
                            )}
                            {associatedServices?.length > 0 && associatedServices?.map((service) => (
                                <MenuItem
                                    key={service?.id}
                                    onClick={() => {
                                        morePopover.onClose();
                                        localStorage.setItem('serviceId', service?.id);
                                        localStorage.setItem('backFromServiceDetails', 'projectDetails');
                                        localStorage.setItem('projectId', itemById?.id);
                                        router.push(paths.dashboard.service.details(service?.id));
                                    }}
                                >
                                    <Tooltip
                                        title={
                                            <>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    {service?.name}
                                                </Typography>
                                                <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                    Start date: {fDate(service?.startDate) || 'N/A'}
                                                </Typography>
                                            </>
                                        }
                                        placement="right"
                                        arrow
                                    >
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Iconify icon="carbon:user-service" />
                                            <Typography component="span" variant="body2">
                                                Service: {service?.number} (v{service?.version})
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                </MenuItem>
                            ))}
                        </MenuList>
                    </CustomPopover >
                </>,
                value: 'more'
            },
        ] : [],
    ];



    const [openValidationDialog, setOpenValidationDialog] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');

    // useEffect(() => {
    //     if (refetchProject) {
    //         refetchProject?.();
    //     }
    //     setItemById(fetchedProject);
    // }, [refetchProject, fetchedProject]);

    useEffect(() => {
        if (fetchedProject && fetchedProject?.id) {
            setItemById(fetchedProject);
        }
    }, [fetchedProject]);

    useEffect(() => {
        if (loadedTracks) {
            setListSelectedTracks(loadedTracks);
        }
    }, [loadedTracks]);

    useEffect(() => {
        const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/project/${projectId}/`);
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
    }, [projectId]);


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
    }, [projectId]);

    const qtyProjectAttachments = useMemo(
        () => itemById?.projectAttachments?.length || 0,
        [itemById]
    );

    const qtyTaskAttachments = useMemo(
        () => itemById?.projectDefaultTasks?.reduce(
            (acc, task) => acc + (task.project_task_attachments ? task.project_task_attachments.length : 0), 0
        ) || 0,
        [itemById]
    );

    const totalAttachments = useMemo(() => qtyProjectAttachments + qtyTaskAttachments, [qtyProjectAttachments, qtyTaskAttachments]);

    const [selectedComments, setSelectedComments] = useState(false);

    const totalComments = useMemo(() => {
        const tComments = itemById?.projectComments?.length || 0
        const tListSelectedTracks = selectedComments ? (listSelectedTracks.filter(
            (track) => track.action.includes(itemById?.id) && !track.action.includes('comment')
        )?.length || 0) : 0;
        return tComments + tListSelectedTracks;
    }, [itemById, listSelectedTracks, selectedComments]);

    const totalTasks = useMemo(() => (
        itemById?.hasPermission ?
            itemById?.projectDefaultTasks?.length :
            itemById?.projectDefaultTasks?.filter((task) => task.project_default_task.project_stage.name !== CONFIG.stages.permission)?.length
            || 0), [itemById]
    );


    const tasks = useMemo(() =>
        itemById?.hasPermission ? itemById?.projectDefaultTasks :
            itemById?.projectDefaultTasks?.filter((task) => task.project_default_task.project_stage.name !== CONFIG.stages.permission) || [], [itemById]
    );

    const [openEdit, setOpenEdit] = useState(false);

    const [openEditTask, setOpenEditTask] = useState(false);

    const currentTab = useMemo(() => {
        if (itemById?.userManager?.username) {
            return localStorage.getItem('projectReminderTab') || 'overview';
        }
        return 'overview';
    }, [itemById]);

    const tabs = useTabs(currentTab);

    const onDelete = useCallback(
        async (id) => {
            try {
                await axios.delete(`${CONFIG.apiUrl}/projects/delete/project/${id}/`, {
                    data: {
                        userReporter: userLogged?.data
                    },
                });
                toast.success('Delete success!');
                router.push(paths.dashboard.project.list);
            } catch (error) {
                console.error(error);
            }
        }, [userLogged?.data, router]);


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

            const project = { ...itemById };
            delete project.salesOrder;
            delete project.projectDefaultTasks;
            delete project.projectAttachments;
            delete project.projectGuideProducts;
            delete project.projectMaterials;
            delete project.projectComments;
            delete project.projectTasks;
            delete project.projectHistory;
            delete project.stageHistory;
            delete project.currentStage;

            try {
                const promise = axios.post(`${CONFIG.apiUrl}/measurements/create/measurement/`, {
                    project: JSON.stringify(project),
                    installer: JSON.stringify(getProjectInstaller(itemById, CONFIG)),
                    items: JSON.stringify(arrayDimensions),
                    userReporter: JSON.stringify(userLogged?.data),
                    salesOrder: JSON.stringify(itemById?.salesOrder),
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
                            !isInstaller(userLogged?.data?.user_role?.name) ? (
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
                        ) : (
                            ''
                        )
                    }
                    onClick={() => {
                        if ((tab.value === 'tasks' ||
                            tab.value === 'attachments' ||
                            tab.value === 'comments' ||
                            tab.value === 'releaseForm' ||
                            tab.value === 'financial' ||
                            tab.value === 'installationGuide') && !itemById?.userManager?.username) {
                            setOpenValidationDialog(true);
                            setValidationMessage('You need to add a RESPONSIBLE to perform this action');
                        }
                        else if (tab.value === 'financial' && (itemById?.projectGuideProducts?.length === 0 || itemById?.projectMaterials?.length === 0)) {
                            setOpenValidationDialog(true);
                            setValidationMessage('You need to save the information in the INSTALLATION GUIDE section to perform this action');
                        }
                        // else if (tab.value === 'more') {
                        //     morePopover.onOpen();
                        // }
                    }}
                />
            ))}
        </Tabs>
    );

    const [titleLinearProgress, setTitleLinearProgress] = useState(`Loading data from installation ${item?.name ? item?.name : ''}...`);

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
                            <ProjectDetailsToolbar
                                project={itemById}
                                backLink={
                                    localStorage.getItem('backFromProjectDetails') === 'analytics' ? paths.dashboard.general.analytics :
                                        localStorage.getItem('backFromProjectDetails') === 'calendarDashboard' ? paths.dashboard.general.calendar :
                                            localStorage.getItem('backFromProjectDetails') === 'measurements' ? paths.dashboard.measurement.list : paths.dashboard.project.list
                                }
                                editLink={paths.dashboard.project.edit(`${itemById?.id}`)}
                                openEdit={tabs.value === 'overview' ? openEdit : tabs.value === 'tasks' ? openEditTask : null}
                                setOpenEdit={tabs.value === 'overview' ? setOpenEdit : tabs.value === 'tasks' ? setOpenEditTask : null}
                                type={tabs.value === 'overview' || tabs.value === 'more' ? 'project' : tabs.value === 'tasks' ? 'tasks' : null}
                                onDelete={() => onDelete(itemById?.id)}
                                onGenerateMeasurements={() => generateMeasurements()}
                                listPermissions={listPermissions}
                            />
                            {renderTabs}

                            {(tabs.value === 'overview' || tabs.value === 'more') &&
                                <ProjectDetailsContent
                                    project={itemById}
                                    refetchProject={refetchProject}
                                    setOpenEdit={setOpenEdit}
                                    listPermissions={listPermissions}
                                    openDialogs={openDialogs}
                                    setOpenDialogs={setOpenDialogs}
                                />
                            }

                            {(tabs.value === 'tasks' && itemById?.userManager?.username) &&
                                <ProjectDetailsTaskView
                                    project={itemById}
                                    refetchProject={refetchProject}
                                    tasks={tasks ?? []}
                                    hasPermission={itemById?.hasPermission}
                                    listPermissions={listPermissions}
                                />
                            }

                            {(tabs.value === 'attachments' && itemById?.userManager?.username) &&
                                <ProjectDetailsAttachmentView
                                    project={itemById}
                                    refetchProject={refetchProject}
                                    listPermissions={listPermissions}
                                    openDialogs={openDialogs}
                                    setOpenDialogs={setOpenDialogs}
                                />
                            }

                            {(tabs.value === 'releaseForm' && itemById?.userManager?.username) && (
                                !isInstaller(userLogged?.data?.user_role?.name) ? (
                                    <ProjectDetailsReleaseFormView
                                        project={itemById}
                                        refetchProject={refetchProject}
                                        listPermissions={listPermissions}
                                        openDialogs={openDialogs}
                                        setOpenDialogs={setOpenDialogs}
                                    />
                                ) : (
                                    <ProjectDetailsReleaseFormInstallerView
                                        project={itemById}
                                        refetchProject={refetchProject}
                                        listPermissions={listPermissions}
                                        openDialogs={openDialogs}
                                        setOpenDialogs={setOpenDialogs}
                                    />
                                ))}

                            {(tabs.value === 'installationGuide' && itemById?.userManager?.username) && (
                                !isInstaller(userLogged?.data?.user_role?.name) ? (
                                    <ProjectDetailsInstallationGuideFormView
                                        project={itemById}
                                        refetchProject={refetchProject}
                                        listPermissions={listPermissions}
                                        openDialogs={openDialogs}
                                        setOpenDialogs={setOpenDialogs}
                                        loadedDefaultGuideProducts={loadedDefaultGuideProducts}
                                        loadedDefaultMaterials={loadedDefaultMaterials}
                                    />
                                ) : (
                                    <ProjectDetailsInstallationGuideFormInstallerView
                                        project={itemById}
                                        refetchProject={refetchProject}
                                        listPermissions={listPermissions}
                                        openDialogs={openDialogs}
                                        setOpenDialogs={setOpenDialogs}
                                        loadedDefaultGuideProducts={loadedDefaultGuideProducts}
                                    />
                                ))}

                            {(tabs.value === 'financial' &&
                                itemById?.userManager?.username &&
                                itemById?.projectGuideProducts?.length > 0 &&
                                itemById?.projectMaterials?.length > 0
                            ) &&
                                <ProjectDetailsFinancialView
                                    project={itemById}
                                    refetchProject={refetchProject}
                                    listPermissions={listPermissions}
                                    openDialogs={openDialogs}
                                    setOpenDialogs={setOpenDialogs}
                                />
                            }

                            {(tabs.value === 'comments' && itemById?.userManager?.username) &&
                                <ProjectDetailsCommentView
                                    project={itemById}
                                    refetchProject={refetchProject}
                                    listPermissions={listPermissions}
                                    listSelectedTracks={listSelectedTracks.filter((track) => track.action.includes(itemById?.id))}
                                    selectedComments={selectedComments}
                                    setSelectedComments={setSelectedComments}
                                />
                            }

                        </DashboardContent>
                        <ProjectEditModalView open={openEdit} onClose={() => setOpenEdit(false)} project={itemById} />
                        <ProjectEditModalTaskView open={openEditTask} onClose={() => setOpenEditTask(false)} projectId={itemById?.id} />
                        <ProjectEditModalAddressView
                            isEdit={itemById?.address}
                            projectId={itemById?.id}
                            open={openDialogs.address}
                            onClose={() => setOpenDialogs({ ...openDialogs, address: false })}
                        />
                        <ProjectEditModalPhoneNumberView
                            isEdit={itemById?.phone || itemById?.salesOrder?.customer?.phone || itemById?.salesOrder?.customer?.mobile}
                            projectId={itemById?.id}
                            open={openDialogs.phoneNumber}
                            onClose={() => setOpenDialogs({ ...openDialogs, phoneNumber: false })}
                        />
                        <ProjectEditModalRefNumberView
                            isEdit={itemById?.address}
                            projectId={itemById?.id}
                            open={openDialogs.refNumber}
                            onClose={() => setOpenDialogs({ ...openDialogs, refNumber: false })}
                        />
                        <ProjectEditModalDescriptionView
                            project={itemById}
                            refetchProject={refetchProject}
                            open={openDialogs.description}
                            onClose={() => setOpenDialogs({ ...openDialogs, description: false })}
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
                    </>
                )}
        </>
    );
}
