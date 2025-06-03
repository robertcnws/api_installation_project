import { Box, Table, Tooltip, TableRow, TableBody, TableCell, TableHead, TextField, IconButton, Typography, TableContainer } from "@mui/material";

import { belongsToWorkingStaff } from "src/utils/check-permissions";

import { Iconify } from "src/components/iconify";

export function MeasurementDetailsContentMarkTable({
    measurement,
    userLogged,
    ABC,
    theme,
    currentMarks,
    setCurrentMarks,
    handleCheck,
    handleAddMark,
    handleIsNotValidMark,
    handleAreNotValidMarks,
    confirmRemove,
    setSelectedMark,
    setSelectedMarkIndex,
    isMobile,
}) {
    return (
        <TableContainer sx={{ maxHeight: !isMobile ? 600 : '100%', overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead sx={{ backgroundColor: theme.palette.grey[200] }}>
                    <TableRow>
                        <TableCell sx={{ width: '5%', fontWeight: 600, color: theme.palette.text.secondary }} align="left">
                            MARK
                        </TableCell>
                        <TableCell sx={{ width: '20%', fontWeight: 600, color: theme.palette.text.secondary }} align="left">
                            TYPE
                        </TableCell>
                        <TableCell sx={{ width: '15%', fontWeight: 600, color: theme.palette.text.secondary }} align="left">
                            CONFIG
                        </TableCell>
                        <TableCell sx={{ width: '15%', fontWeight: 600, color: theme.palette.text.secondary }} align="left">
                            WIDTH
                        </TableCell>
                        <TableCell sx={{ width: '15%', fontWeight: 600, color: theme.palette.text.secondary }} align="left">
                            HEIGHT
                        </TableCell>
                        <TableCell sx={{ width: '30%', fontWeight: 600, color: theme.palette.text.secondary }} align="left">
                            NOTES
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {currentMarks?.map((mark, index) => (
                        <TableRow key={mark?.line_item_id} hover tabIndex={-1} sx={{ cursor: 'pointer' }}>
                            <TableCell align="left">
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        color: mark?.second_check ? theme.palette.success.main :
                                            mark?.first_check ? theme.palette.warning.main : theme.palette.text.secondary
                                    }}>
                                    {ABC[index]}
                                </Typography>
                            </TableCell>
                            <TableCell align="left" sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                                <TextField
                                    size="small"
                                    value={mark?.type || ''}
                                    variant="outlined"
                                    onChange={(e) => {
                                        setCurrentMarks(prev => {
                                            const newMarks = [...prev];
                                            newMarks[index] = {
                                                ...newMarks[index],
                                                type: e.target.value
                                            };
                                            return newMarks;
                                        });
                                    }}
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.grey[300],
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                        },
                                    }}
                                />
                            </TableCell>
                            <TableCell align="left" sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                                <TextField
                                    size="small"
                                    value={mark?.config || ''}
                                    variant="outlined"
                                    onChange={(e) => {
                                        setCurrentMarks(prev => {
                                            const newMarks = [...prev];
                                            newMarks[index] = {
                                                ...newMarks[index],
                                                config: e.target.value
                                            };
                                            return newMarks;
                                        });
                                    }}
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.grey[300],
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                        },
                                    }}
                                />
                            </TableCell>
                            <TableCell align="left" sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                                <TextField
                                    type="number"
                                    min={0}
                                    size="small"
                                    value={mark?.dimensions?.[0] || 0}
                                    variant="outlined"
                                    onChange={(e) => {
                                        setCurrentMarks(prev => {
                                            const newMarks = [...prev];
                                            newMarks[index] = {
                                                ...newMarks[index],
                                                dimensions: [e.target.value, newMarks[index].dimensions[1]]
                                            };
                                            return newMarks;
                                        });
                                    }}
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.grey[300],
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                        },
                                    }}
                                />
                            </TableCell>
                            <TableCell align="left" sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                                <TextField
                                    type="number"
                                    min={0}
                                    size="small"
                                    value={mark?.dimensions?.[1] || 0}
                                    variant="outlined"
                                    onChange={(e) => {
                                        setCurrentMarks(prev => {
                                            const newMarks = [...prev];
                                            newMarks[index] = {
                                                ...newMarks[index],
                                                dimensions: [newMarks[index].dimensions[0], e.target.value]
                                            };
                                            return newMarks;
                                        });
                                    }}
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.grey[300],
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                        },
                                    }}
                                />
                            </TableCell>
                            <TableCell align="left" sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                                <TextField
                                    multiline
                                    rows={2}
                                    size="small"
                                    value={mark?.notes || ''}
                                    variant="outlined"
                                    onChange={(e) => {
                                        setCurrentMarks(prev => {
                                            const newMarks = [...prev];
                                            newMarks[index] = {
                                                ...newMarks[index],
                                                notes: e.target.value
                                            };
                                            return newMarks;
                                        });
                                    }}
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.grey[300],
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: theme.palette.success.main,
                                            },
                                        },
                                    }}
                                />
                            </TableCell>
                            <TableCell align="left" sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {(!measurement?.project?.id && !measurement?.service?.id && belongsToWorkingStaff(userLogged?.data?.uer_role?.name)) && (
                                        <Tooltip title="First check" placement="top" arrow>
                                            <span>
                                                <IconButton
                                                    sx={{
                                                        cursor: !mark?.first_check && !handleIsNotValidMark(mark) ? 'pointer' : 'not-allowed',
                                                        '&.Mui-disabled': {
                                                            cursor: 'not-allowed !important',
                                                            pointerEvents: 'auto',
                                                        }
                                                    }}
                                                    size="small"
                                                    onClick={!mark?.first_check && !handleIsNotValidMark(mark) ? () => {
                                                        handleCheck(mark, 'first');
                                                    } : undefined}
                                                    disabled={mark?.first_check}
                                                >
                                                    <Iconify
                                                        icon="pajamas:check-xs"
                                                        width={20}
                                                        height={20}
                                                        color={!mark?.first_check && !handleIsNotValidMark(mark) ? theme.palette.warning.main : theme.palette.grey[300]}
                                                    />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    )}
                                    {belongsToWorkingStaff(userLogged?.data?.uer_role?.name) && (
                                        <>
                                            <Tooltip
                                                title="Second check"
                                                placement="top"
                                                arrow
                                            >
                                                <span>
                                                    <IconButton
                                                        sx={{
                                                            cursor: (mark?.first_check || measurement?.project?.id || measurement?.service?.id) &&
                                                                !mark?.second_check &&
                                                                !handleIsNotValidMark(mark) ? 'pointer' : 'not-allowed',
                                                            '&.Mui-disabled': {
                                                                cursor: 'not-allowed !important',
                                                                pointerEvents: 'auto',
                                                            }
                                                        }}
                                                        size="small"
                                                        onClick={
                                                            (mark?.first_check || measurement?.project?.id || measurement?.service?.id) &&
                                                                !mark?.second_check &&
                                                                !handleIsNotValidMark(mark) ? () => {
                                                                    handleCheck(mark, 'second');
                                                                } : undefined
                                                        }
                                                        disabled={
                                                            (!mark?.first_check && (!measurement?.project?.id && !measurement?.service?.id)) ||
                                                            mark?.second_check ||
                                                            handleIsNotValidMark(mark)
                                                        }
                                                    >
                                                        <Iconify
                                                            icon="solar:check-read-outline"
                                                            width={20}
                                                            height={20}
                                                            color={
                                                                (mark?.first_check || measurement?.project?.id || measurement?.service?.id) &&
                                                                    !mark?.second_check &&
                                                                    !handleIsNotValidMark(mark) ?
                                                                    theme.palette.success.main : theme.palette.grey[300]
                                                            }
                                                        />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            {currentMarks.length > 1 && (
                                                <Tooltip title="Remove" placement="top" arrow>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedMark(mark);
                                                                setSelectedMarkIndex(index);
                                                                confirmRemove.onTrue();
                                                            }}
                                                        >
                                                            <Iconify icon="eva:minus-fill" width={20} height={20} color={theme.palette.error.main} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                        <TableCell />
                        <TableCell />
                        <TableCell />
                        <TableCell align="left">
                            {(belongsToWorkingStaff(userLogged?.data?.uer_role?.name)) && (
                                <Tooltip title="Add" placement="top" arrow>
                                    <span>
                                        <IconButton
                                            sx={{
                                                cursor: !handleAreNotValidMarks() ? 'pointer' : 'not-allowed',
                                                '&.Mui-disabled': {
                                                    cursor: 'not-allowed !important',
                                                    pointerEvents: 'auto',
                                                },
                                                color: !handleAreNotValidMarks() ? theme.palette.secondary.main : theme.palette.grey[300],
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                            }}
                                            size="small"
                                            onClick={!handleAreNotValidMarks() ? () => {
                                                handleAddMark();
                                            } : undefined}
                                            disabled={handleAreNotValidMarks()}>
                                            <Iconify
                                                icon="eva:plus-fill"
                                                width={20}
                                                height={20}
                                                color={!handleAreNotValidMarks() ? theme.palette.secondary.main : theme.palette.grey[300]}
                                            /> Add
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow />
                </TableBody>

            </Table>
        </TableContainer>
    )
}