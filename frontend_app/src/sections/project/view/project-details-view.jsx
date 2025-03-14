import axios from 'axios';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';

import { isInstaller, listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { useProjectByIdQuery } from 'src/_mock/__projects';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useDataContext } from 'src/auth/context/data/data-context';

import { ProjectEditModalView } from './project-edit-modal-view';
import { ProjectDetailsToolbar } from '../project-details-toolbar';
import { ProjectDetailsContent } from '../project-details-content';
import { ProjectDetailsTaskView } from './project-details-task-view';
import { ProjectEditModalTaskView } from './project-edit-modal-task-view';
import { ProjectDetailsCommentView } from './project-details-comment-view';
import { ProjectEditModalAddressView } from './project-edit-modal-address-view';
import { ProjectDetailsAttachmentView } from './project-details-attachment-view';
import { ProjectDetailsReleaseFormView } from './project-details-release-form-view';
import { ProjectDetailsInstallationGuideFormView } from './project-details-installation-guide-form-view';
import { ProjectDetailsReleaseFormInstallerView } from './project-details-release-form-installer-view';
import { ProjectDetailsInstallationGuideFormInstallerView } from './project-details-installation-guide-form-installer-view';









// ----------------------------------------------------------------------

export function ProjectDetailsView({ projectId }) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const router = useRouter();

    const {
        loadedProjects,
        listPermissions,
    } = useDataContext();

    const [openDialogs, setOpenDialogs] = useState({
        userManager: false,
        date: false,
        address: false,
        installationTeam: false,
    });

    const DETAILS_TABS = [
        { label: 'Overview', value: 'overview' },
        { label: 'Tasks', value: 'tasks' },
        ...!isInstaller(userLogged?.data?.user_role?.name) ? [
            { label: 'Attachments', value: 'attachments' },
        ] : [],
        ...listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.installer) ? [
            { label: 'Release Form', value: 'releaseForm' },
            { label: 'Installation Guide', value: 'installationGuide' },
        ] : [],
        { label: 'Comments', value: 'comments' },
    ];

    const item = useMemo(() => loadedProjects?.find((project) => project.id === projectId), [loadedProjects, projectId]);

    const { data: fetchedProject, refetch: refetchProject } = useProjectByIdQuery(item?.id, {
        skip: !item?.id,
    });

    const [itemById, setItemById] = useState(fetchedProject);

    const [openValidationDialog, setOpenValidationDialog] = useState(false);

    useEffect(() => {
        if (refetchProject) {
            refetchProject?.();
        }
        setItemById(fetchedProject);
    }, [refetchProject, fetchedProject]);

    useEffect(() => {
        if (fetchedProject) {
            setItemById(fetchedProject);
        }
    }, [fetchedProject]);

    useEffect(() => {
        const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/project/${projectId}/`);
        // socket.onopen = () => {
        //     console.log('WebSocket connected');
        // };
        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };
        // socket.onclose = (e) => {
        //     console.log('WebSocket closed', e);
        // };
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
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

    const totalComments = useMemo(() => itemById?.projectComments?.length || 0, [itemById]);

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

    const tabs = useTabs('overview');

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
                                <Label variant="filled" color="primary">
                                    {tab.value === 'tasks' ? totalTasks :
                                        tab.value === 'attachments' ? totalAttachments : totalComments}
                                </Label>
                            ) : (
                                tab.value === 'comments' ? (
                                    <Label variant="filled" color="primary">
                                        {totalComments}
                                    </Label>
                                ) : (
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
                            tab.value === 'installationGuide') && !itemById?.userManager?.username) {
                            setOpenValidationDialog(true);
                        }
                    }}
                />
            ))}
        </Tabs>
    );

    return (
        <>
            <DashboardContent>
                <ProjectDetailsToolbar
                    project={itemById}
                    backLink={
                        localStorage.getItem('backFromProjectDetails') === 'analytics' ? paths.dashboard.general.analytics : paths.dashboard.project.list
                    }
                    editLink={paths.dashboard.project.edit(`${itemById?.id}`)}
                    openEdit={tabs.value === 'overview' ? openEdit : tabs.value === 'tasks' ? openEditTask : null}
                    setOpenEdit={tabs.value === 'overview' ? setOpenEdit : tabs.value === 'tasks' ? setOpenEditTask : null}
                    type={tabs.value === 'overview' ? 'project' : tabs.value === 'tasks' ? 'tasks' : null}
                    onDelete={() => onDelete(itemById?.id)}
                    listPermissions={listPermissions}
                />
                {renderTabs}

                {tabs.value === 'overview' &&
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
                        />
                    ) : (
                        <ProjectDetailsInstallationGuideFormInstallerView
                            project={itemById}
                            refetchProject={refetchProject}
                            listPermissions={listPermissions}
                            openDialogs={openDialogs}
                            setOpenDialogs={setOpenDialogs}
                        />
                    ))}

                {(tabs.value === 'comments' && itemById?.userManager?.username) &&
                    <ProjectDetailsCommentView
                        project={itemById}
                        refetchProject={refetchProject}
                        listPermissions={listPermissions}
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
                        <b>You need to add a responsable to perform that action</b>
                    </Typography>
                }
            />
        </>
    );
}
