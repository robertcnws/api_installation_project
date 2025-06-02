import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { Table, TableBody, CardHeader, TableContainer } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDateTime } from 'src/utils/format-time';
import { fPercent } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { TableNoData } from 'src/components/table';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function ProjectsStageToday({ title, list, stage, ...other }) {
    // const theme = useTheme();

    const router = useRouter();

    localStorage.setItem('backFromProjectDetails', 'analytics');

    return (
        <Card {...other}>
            <CardHeader
                title={title}
            />
            <Scrollbar sx={{ maxHeight: 230, minHeight: 230 }}>
                {list.length > 0 ? (
                    <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                        {list.map((item, index) => (
                            <Item
                                key={item.id}
                                item={item}
                                stage={stage}
                                router={router}
                                sx={{
                                    // color: colors[index],
                                    px: 2.5,
                                    py: 0.5,
                                    borderRadius: 1
                                }}
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
    );
}

function Item({ item, sx, stage, router, ...other }) {
    const tasks = item?.projectDefaultTasks?.filter(
        p => p.project_default_task.project_stage.name.toLowerCase().indexOf(stage.toLowerCase()) !== -1
    );
    const totals = useMemo(() => tasks.reduce((acc, cur) => acc + cur.percentage, 0), [tasks]);
    const percent = totals / tasks.length;

    const color = percent === 100 ? 'success.main' :
        percent < 100 && percent > 0 ? 'warning.main' : 'background.neutral';
    sx = {
        ...sx,
        color: percent === 100 ? 'success.main' :
            percent < 100 && percent > 0 ? 'warning.main' : 'background.neutral'
    };

    return (
        <Box sx={{ gap: 1, display: 'flex', ...sx }} {...other}>
            <Box
                sx={{
                    width: 6,
                    my: '0px',
                    height: 16,
                    flexShrink: 0,
                    opacity: 0.24,
                    borderRadius: 1,
                    bgcolor: 'currentColor',
                }}
            />

            <Box
                sx={{
                    gap: 1,
                    minWidth: 0,
                    display: 'flex',
                    flex: '1 1 auto',
                    flexDirection: 'column',
                }}
            >
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Link
                        variant="subtitle2"
                        color={item.hasPermission ? "error" : "inherit"}
                        noWrap sx={{ color: 'text.primary', cursor: 'pointer' }}
                        href='#'
                        onClick={(e) => {
                            e.preventDefault();
                            localStorage.setItem('projectId', item.id);
                            router.push(paths.dashboard.project.details(item.id));
                        }}
                    >
                        {item.name}
                    </Link>
                    {item.hasPermission && (
                        <Label
                            color='warning'
                            variant='outlined'
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


                <Box
                    sx={{
                        gap: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        typography: 'caption',
                        color: 'text.secondary',
                    }}
                >
                    <Iconify width={16} icon="solar:calendar-date-bold" />
                    Updated: {fDateTime(item.lastModifiedTime)}
                </Box>

                <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
                    <LinearProgress
                        color="warning"
                        variant="determinate"
                        value={percent}
                        sx={{
                            width: 1,
                            height: 6,
                            bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
                            [` .${linearProgressClasses.bar}`]: { bgcolor: 'currentColor' },
                        }}
                    />
                    <Box
                        component="span"
                        sx={{
                            width: 80,
                            typography: 'caption',
                            color: { color },
                            fontWeight: 'fontWeightMedium',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}
                    >
                        {fPercent(percent)} <Typography sx={{ fontSize: '10px', ml: 0.5, mt: 0.3 }}>{stage}</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
