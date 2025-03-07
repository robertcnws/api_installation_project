import React, { useMemo, useState, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import ListItemText from '@mui/material/ListItemText';
import { Table, MenuItem, MenuList, TableBody, Typography, TableContainer } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fPercent } from 'src/utils/format-number';
import { isInstaller } from 'src/utils/check-permissions';
import { getProjectInstaller, totalPercentageProject } from 'src/utils/project-tasks-utils';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { TableNoData } from 'src/components/table';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

const headersCSV = [
    { label: 'SKU', key: 'sku' },
    { label: 'Date', key: 'createdTime' },
    { label: 'New Serials', key: 'news' },
    { label: 'Lost Serials', key: 'losts' },
];


export function ProjectsToDoToday({
    title,
    subheader,
    list,
    ...other
}) {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const router = useRouter();

    const popover = usePopover();

    const openDialog = useBoolean();

    const [currentStatus, setCurrentStatus] = useState('');

    const [currentItem, setCurrentItem] = useState(null);

    const [currentTasksFiltered, setCurrentTasksFiltered] = useState([]);

    const renderDialog = useCallback(
        ({ item, status }) => {
            const tasks = item.hasPermission ? item.projectDefaultTasks :
                item.projectDefaultTasks.filter(
                    h => h.project_default_task.project_stage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) === -1
                );

            const tasksFiltered = tasks.filter(h => h.status?.toLowerCase().includes(status));
            setCurrentStatus(status);
            setCurrentItem(item);
            setCurrentTasksFiltered(tasksFiltered.sort((a, b) => a.project_default_task.order - b.project_default_task.order));
            openDialog.onTrue();
        }, [openDialog]
    );

    return (
        <>
            <Card {...other}>
                <CardHeader
                    title={title}
                    subheader={subheader}
                />
                <Scrollbar sx={{ maxHeight: 230, minHeight: 230 }}>
                    {list?.length > 0 ? (
                        <Box
                            sx={{
                                p: 1,
                                gap: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 360,
                            }}
                        >
                            {list.map((item, index) => (
                                <Item
                                    key={`${item.id}-${index}`}
                                    item={item}
                                    sx={{ px: 2, py: 0, bgcolor: index % 2 === 0 ? 'background.default' : 'background.paper' }}
                                    router={router}
                                    userLogged={userLogged}
                                    openDialog={openDialog}
                                />
                            ))}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableBody>
                                    <TableNoData notFound={list?.length === 0} sx={{ maxHeight: 200 }} />
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Scrollbar>
            </Card>

            <CustomPopover
                open={popover.open}
                anchorEl={popover.anchorEl}
                onClose={popover.onClose}
                slotProps={{ arrow: { placement: 'right-top' } }}
            >
                <MenuList>
                    <MenuItem
                        onClick={() => {
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="solar:printer-minimalistic-bold" />
                        Print
                    </MenuItem>
                </MenuList>
            </CustomPopover>

            <ConfirmDialog
                title={
                    <>
                        <Typography sx={{ color: 'text.primary' }}>
                            Tasks {currentStatus} in {currentItem?.name}
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                            Responsable: {currentItem?.userManager?.name}
                        </Typography>
                    </>
                }
                open={openDialog.value}
                onClose={openDialog.onFalse}
                maxWidth="md"
                content={
                    <Box
                        key={`${currentItem?.id}-${currentStatus}`}
                        sx={{ gap: 2, display: 'flex', flexDirection: 'column', maxHeight: 300, overflow: 'auto' }}
                    >
                        {currentTasksFiltered?.map(h =>
                            <Box key={`${h.project_default_task.id}-${currentItem?.id}`} sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
                                <ListItemText
                                    key={`${h.id}-${currentItem?.id}`}
                                    primary={h.project_default_task.name}
                                    secondary={
                                        <Typography sx={{
                                            display: 'flex', alignItems: 'center', gap: 1,
                                            color: h.percentage === 100 ? 'success.main' :
                                                h.percentage < 100 && h.percentage > 0 ? 'warning.main' : 'grey.500'
                                        }}>
                                            <Iconify icon={
                                                h.status?.toLowerCase().includes(CONFIG.taskStatus.notStarted) ?
                                                    'mdi:restart-off' :
                                                    h.status?.toLowerCase().includes(CONFIG.taskStatus.inProgress) ?
                                                        'carbon:executable-program' :
                                                        'rivet-icons:inbox-complete'
                                            } width={12} height={12} />
                                            <span style={{
                                                fontSize: 'small',
                                            }}>{fPercent(h.percentage)}</span>
                                            {currentStatus === CONFIG.taskStatus.inProgress && (
                                                <>
                                                    <br />
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}
                                                        key={`${h.project_default_task.id}-${currentItem?.id}-assignees`}>
                                                        Assignee(s):
                                                        {h.users_assignees.map((a, index) => (
                                                            <React.Fragment key={`${a.id}-${h.project_default_task.id}-${currentItem?.id}-${index}-assignees`}>
                                                                <br />
                                                                <b>{a.name}</b>
                                                            </React.Fragment>
                                                        ))}
                                                    </Typography>
                                                </>
                                            )}
                                        </Typography>
                                    }
                                />
                            </Box>
                        )}
                    </Box>
                }
                actions={
                    <Box sx={{ gap: 2, display: 'flex' }}>
                        <IconButton>
                            <Iconify icon="solar:printer-minimalistic-bold" />
                        </IconButton>
                        <IconButton>
                            <Iconify icon="solar:printer-minimalistic-bold" />
                        </IconButton>
                    </Box>
                }
            />
        </>
    );
}

// ----------------------------------------------------------------------

const Item = ({ item, sx, router, userLogged, ...other }) =>
    <Box sx={{ gap: 2, display: 'flex', alignItems: 'center', ...sx }} key={item.id} {...other}>
        <ListItemText
            primary={
                <Box component="span"
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        localStorage.setItem('projectId', item?.id);
                        localStorage.setItem('backFromProjectDetails', 'analytics');
                        router.push(paths.dashboard.project.details(item?.id));
                    }}>
                    <Typography
                        variant="subtitle2"
                        sx={{ color: 'text.primary' }}
                    >
                        {item.name}
                    </Typography>
                    {item.hasPermission && (
                        <Label
                            color='warning'
                            variant="outlined"
                            sx={{
                                textTransform: 'capitalize',
                                fontSize: '9px',
                                p: 0.5
                            }}
                        >
                            Need Permission
                        </Label>
                    )}
                </Box>
            }
            secondary={
                <>
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', typography: 'body2', color: 'text.secondary', gap: 2 }}>
                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                            Installer: {getProjectInstaller(item, CONFIG) ? getProjectInstaller(item, CONFIG).name : 'Not Installer assigned'}
                        </Typography>
                    </Box>
                    <br />
                    {(item.projectDefaultTasks.length > 0 && !isInstaller(userLogged?.data?.user_role?.name)) && (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', typography: 'body2', gap: 2 }}>

                            <Box
                                component="span"
                                key={`${item.id}-percentage`}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    typography: 'body2',
                                    color: 'backgound.neutral',
                                    gap: 0,
                                    cursor: 'pointer'
                                }}
                            >
                                <Label color={
                                    totalPercentageProject(item, CONFIG) === 100 ? 'success' :
                                        totalPercentageProject(item, CONFIG) < 100 && totalPercentageProject(item, CONFIG) > 0 ? 'warning' :
                                            'default'
                                }>
                                    <Iconify icon={
                                        totalPercentageProject(item, CONFIG) === 100 ? 'gis:flag-finish-b-o' :
                                            totalPercentageProject(item, CONFIG) < 100 && totalPercentageProject(item, CONFIG) > 0 ? 'grommet-icons:in-progress' :
                                                'tabler:clock-stop'
                                    } width={16} height={16} />
                                    <span style={{ fontSize: 'x-small' }}>
                                        {
                                            totalPercentageProject(item, CONFIG) === 100 ? 'Finished' :
                                                totalPercentageProject(item, CONFIG) < 100 && totalPercentageProject(item, CONFIG) > 0 ? 'In Progress' :
                                                    'Not Started'
                                        }
                                    </span>
                                </Label>
                            </Box>

                            {/* {calculateTotalStatus({ item, status: CONFIG.taskStatus.notStarted }) > 0 && (
                                    <Box
                                        component="span"
                                        key={`${item.id}-not-started`}
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            typography: 'body2',
                                            color: 'backgound.neutral',
                                            gap: 0,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            renderDialog({ item, status: CONFIG.taskStatus.notStarted });
                                        }}
                                    >
                                        <Iconify icon="mdi:restart-off" width={16} height={16} />
                                        <span style={{ fontSize: 'x-small' }}>
                                            <b>{
                                                calculateTotalStatus({ item, status: CONFIG.taskStatus.notStarted })
                                            }</b> Not Started
                                        </span>
                                    </Box>
                                )}
                                {calculateTotalStatus({ item, status: CONFIG.taskStatus.inProgress }) > 0 && (
                                    <Box
                                        component="span"
                                        key={`${item.id}-in-progress`}
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            typography: 'body2',
                                            color: 'warning.main',
                                            gap: 0,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            renderDialog({ item, status: CONFIG.taskStatus.inProgress });
                                        }}
                                    >
                                        <Iconify icon="carbon:executable-program" width={16} height={16} />
                                        <span style={{ fontSize: 'x-small' }}>
                                            <b>{
                                                calculateTotalStatus({ item, status: CONFIG.taskStatus.inProgress })
                                            }</b> In Progress
                                        </span>
                                    </Box>
                                )}
                                {calculateTotalStatus({ item, status: CONFIG.taskStatus.finished }) > 0 && (
                                    <Box
                                        component="span"
                                        key={`${item.id}-finished`}
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            typography: 'body2',
                                            color: 'success.main',
                                            gap: 0,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            renderDialog({ item, status: CONFIG.taskStatus.finished });
                                        }}
                                    >
                                        <Iconify icon="rivet-icons:inbox-complete" width={16} height={16} />
                                        <span style={{ fontSize: 'x-small' }}>
                                            <b>{
                                                calculateTotalStatus({ item, status: CONFIG.taskStatus.finished })
                                            }</b> Finished
                                        </span>
                                    </Box>
                                )} */}
                        </Box>
                    )}
                </>
            }
        />

        <Tooltip title="See details">
            <IconButton onClick={() => {
                localStorage.setItem('projectId', item?.id);
                localStorage.setItem('backFromProjectDetails', 'analytics');
                router.push(paths.dashboard.project.details(item?.id));
            }}>
                <Iconify icon="solar:transfer-horizontal-bold-duotone" />
            </IconButton>
        </Tooltip>
    </Box>;

function calculateTotalStatus({ item, status }) {
    const tasks = item.hasPermission ? item.projectDefaultTasks :
        item.projectDefaultTasks.filter(
            h => h.project_default_task.project_stage.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) === -1
        );
    return tasks.reduce((acc, h) => {
        if (h.status?.toLowerCase().includes(status)) {
            acc += 1;
        }
        return acc;
    }, 0)
}
