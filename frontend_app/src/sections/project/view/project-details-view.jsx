import { useState, useCallback, useMemo, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';

import { DashboardContent } from 'src/layouts/dashboard';
import { JOB_DETAILS_TABS, JOB_PUBLISH_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';

import { useDataContext } from 'src/auth/context/data/data-context';
import { useProjectByIdQuery } from 'src/_mock/__projects';
import { CONFIG } from 'src/config-global';
import { useBoolean } from 'src/hooks/use-boolean';
import { Typography } from '@mui/material';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { ProjectDetailsToolbar } from '../project-details-toolbar';
import { ProjectDetailsContent } from '../project-details-content';
import { ProjectDetailsTasks } from '../project-details-tasks';
import { ProjectDetailsTaskView } from './project-details-task-view';
import { ProjectEditModalView } from './project-edit-modal-view';
import { ProjectEditModalTaskView } from './project-edit-modal-task-view';
import { ProjectDetailsAttachmentView } from './project-details-attachment-view';
import { ProjectDetailsCommentView } from './project-details-comment-view';







// ----------------------------------------------------------------------

export function ProjectDetailsView({ projectId }) {

    const {
        loadedProjects,
        loadedUsers,
        loadedProjectPermissions,
        loadedStages,
        loadedStagesTask,
        setTableData,
        refetchProjects,
        refetchSalesOrders,
    } = useDataContext();

    const DETAILS_TABS = [
        { label: 'Overview', value: 'overview' },
        { label: 'Tasks', value: 'tasks' },
        { label: 'Attachments', value: 'attachments' },
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
        socket.onopen = () => {
            console.log('WebSocket connected');
        };
        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };
        socket.onclose = (e) => {
            console.log('WebSocket closed', e);
        };
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
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
            itemById?.projectDefaultTasks?.filter((task) => task.project_default_task.project_stage.name !== 'Permission')?.length
            || 0), [itemById]
    );


    const tasks = useMemo(() =>
        itemById?.hasPermission ? itemById?.projectDefaultTasks :
            itemById?.projectDefaultTasks?.filter((task) => task.project_default_task.project_stage.name !== 'Permission') || [], [itemById]
    );

    const [openEdit, setOpenEdit] = useState(false);

    const [openEditTask, setOpenEditTask] = useState(false);

    const tabs = useTabs('overview');



    const renderTabs = (
        <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
            {DETAILS_TABS.map((tab) => (
                <Tab
                    key={tab.value}
                    iconPosition="end"
                    value={tab.value}
                    label={tab.label}
                    icon={
                        tab.value === 'tasks' || tab.value === 'attachments' || tab.value === 'comments' ? (
                            <Label variant="filled" color="primary">
                                {tab.value === 'tasks' ? totalTasks :
                                    tab.value === 'attachments' ? totalAttachments : totalComments}
                            </Label>
                        ) : (
                            ''
                        )
                    }
                    onClick={() => {
                        if ((tab.value === 'tasks' || tab.value === 'attachments' || tab.value === 'comments') && !itemById.userManager?.username) {
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
                    backLink={paths.dashboard.project.root}
                    editLink={paths.dashboard.project.edit(`${itemById?.id}`)}
                    openEdit={tabs.value === 'overview' ? openEdit : tabs.value === 'tasks' ? openEditTask : null}
                    setOpenEdit={tabs.value === 'overview' ? setOpenEdit : tabs.value === 'tasks' ? setOpenEditTask : null}
                    type={tabs.value === 'overview' ? 'project' : tabs.value === 'tasks' ? 'tasks' : null}
                />
                {renderTabs}

                {tabs.value === 'overview' && <ProjectDetailsContent project={itemById} refetchProject={refetchProject} setOpenEdit={setOpenEdit}/>}

                {(tabs.value === 'tasks' && itemById.userManager?.username) && <ProjectDetailsTaskView project={itemById} refetchProject={refetchProject} tasks={tasks ?? []} hasPermission={itemById?.hasPermission} />}

                {(tabs.value === 'attachments' && itemById.userManager?.username) && <ProjectDetailsAttachmentView projectId={itemById?.id} />}

                {(tabs.value === 'comments' && itemById.userManager?.username) && <ProjectDetailsCommentView project={itemById} refetchProject={refetchProject} />}

            </DashboardContent>
            <ProjectEditModalView open={openEdit} onClose={() => setOpenEdit(false)} projectId={itemById?.id} />
            <ProjectEditModalTaskView open={openEditTask} onClose={() => setOpenEditTask(false)} projectId={itemById?.id} />

            <ConfirmDialog
                open={openValidationDialog}
                onClose={() => {
                    setOpenValidationDialog(false)
                    tabs.onChange(null, 'overview')
                }}
                title={`Invalid Action to reach: ${tabs.value}`}
                maxWidth="xs"
                content={
                    <>
                        <Typography variant="body2">
                            <b>You need to add a responsable to perform that action</b>
                        </Typography>
                    </>
                }
            />
        </>
    );
}
