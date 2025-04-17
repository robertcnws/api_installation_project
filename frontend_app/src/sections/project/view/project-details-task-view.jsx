
import { useMemo, useState, useEffect } from 'react';

import { Box } from '@mui/material';

import { CONFIG } from 'src/config-global';

import { useDataContext } from 'src/auth/context/data/data-context';

import { KanbanView } from '../kanban/view';

// ----------------------------------------------------------------------

export function ProjectDetailsTaskView({
    project,
    refetchProject,
    tasks,
    hasPermission,
    listPermissions,
}) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const {
        loadedProjectReminders,
    } = useDataContext();

    const [projectReminders, setProjectReminders] = useState([]);

    useEffect(() => {
        if (loadedProjectReminders) {
            setProjectReminders(loadedProjectReminders);
        }
    }, [loadedProjectReminders]);

    useEffect(() => {
        const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/project-reminders/`);
        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'created' || message.type === 'updated') {
                setProjectReminders((prevData) => {
                    if (prevData?.id === message.item.id && message.item.userReporter.id === userLogged?.data.id) {
                        return message.item;
                    }
                    return prevData;
                });
            }
            else if (message.type === 'deleted') {
                setProjectReminders((prevData) => {
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
    }, [userLogged]);


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <KanbanView
                project={project}
                refetchProject={refetchProject}
                tasks={tasks}
                hasPermission={hasPermission}
                listPermissions={listPermissions}
                projectReminders={projectReminders}
            />
        </Box>
    );
}
