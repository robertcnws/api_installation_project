import React from 'react';

import { Box, List, Button, Divider, ListItem, Typography, ListItemText } from '@mui/material';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

function ProjectEditTaskViewTaskList({
    projectData,
    loadedTasks,
    setLoadedTasks,
    allTasks,
    setAllTasks,
}) {
    const groupedTasks = allTasks.reduce((acc, task) => {
        const statusName = task.project_default_task?.project_stage?.name;
        if (!acc[statusName]) {
            acc[statusName] = [];
        }
        acc[statusName].push(task);
        return acc;
    }, {});

    const projectPercentage =
        (allTasks.length > 0
            ? allTasks.reduce((sum, task) => sum + (task.percentage || 0), 0) / allTasks.length
            : 0).toFixed(2);


    const handleFinishTask = (task) => {
        task.status = 'finished';
        task.percentage = 100;
        setLoadedTasks((prevTasks) => {
            const newTasks = prevTasks.map((prevTask) => {
                if (prevTask.project_default_task.id === task.project_default_task.id) {
                    return task;
                }
                return prevTask;
            }
            );
            return newTasks;
        }
        );
        setAllTasks((prevTasks) => {
            const newTasks = prevTasks.map((prevTask) => {
                if (prevTask.id === task.id) {
                    return task;
                }
                return prevTask;
            }
            );
            return newTasks;
        }
        );
    };

    return (
            <Box component="span" sx={{ width: '100%', color: 'text.secondary', mr: 2, maxHeight: 250, overflow: 'auto', border: 1, borderColor: 'divider' }}>
                {Object.entries(groupedTasks).map(([status, tasksInGroup]) => {
                    const totalPercentage = tasksInGroup.reduce((sum, task) => sum + (task.percentage || 0), 0);
                    const avgPercentage = tasksInGroup.length > 0 ? Math.round(totalPercentage / tasksInGroup.length) : 0;

                    return (
                        <Box key={status} sx={{ mb: 0.5, p: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mt: 0.5 }}>
                                <Label
                                    color={avgPercentage === 100 ? 'success' :
                                        avgPercentage >= 50 && avgPercentage < 100 ? 'info' :
                                            avgPercentage > 0 && avgPercentage < 50 ? 'warning' : 'error'
                                    }
                                // sx={{ textTransform: 'uppercase' }}
                                >
                                    {`${status} - Total Progress: ${avgPercentage}%`}
                                </Label>
                            </Box>
                            <List dense sx={{ mt: -1 }}>
                                {tasksInGroup.map((task, index) => (
                                    <ListItem key={index} sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        '&:hover': {
                                            backgroundColor: 'background.neutral',
                                        },
                                    }}
                                    >
                                        <ListItemText
                                            icon={
                                                <Iconify icon="octicon:tracked-by-closed-completed-16" />
                                            }
                                            primary={`${task.number} -- ${task.project_default_task.name}`}
                                            secondary={
                                                <Typography variant="caption"
                                                    sx={{
                                                        color: task.percentage === 100 ? 'success.main' :
                                                            task.percentage >= 50 && task.percentage < 100 ? 'info.main' :
                                                                task.percentage > 0 && task.percentage < 50 ? 'warning.main' : 'error.main'
                                                    }}>
                                                    {`Progress: ${task.percentage || 0}%`}
                                                </Typography>
                                            }
                                        />
                                        {task.percentage > 0 && (
                                            <Button variant="contained" size="small" color="primary" sx={{
                                                '&:hover': {
                                                    backgroundColor: 'primary.dark',
                                                },
                                            }}>
                                                <Iconify icon="octicon:tracked-by-closed-completed-16" /> Finish
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                            <Divider sx={{ mt: 0 }} />
                        </Box>
                    );
                })}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 0.5 }}>
                    <Label
                        color={projectPercentage === 100 ? 'success' :
                            projectPercentage >= 50 && projectPercentage < 100 ? 'info' :
                                projectPercentage > 0 && projectPercentage < 50 ? 'warning' : 'error'
                        }
                        sx={{ textTransform: 'uppercase' }}
                    >
                        {`Project ${projectData?.name} Total Progress: ${projectPercentage}%`}
                    </Label>
                </Box>
            </Box>
        );
    }

    export default ProjectEditTaskViewTaskList;
