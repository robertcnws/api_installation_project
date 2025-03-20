import React, { useContext } from 'react';

import { Stack } from '@mui/material';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

// ----------------------------------------------------------------------

export function ServiceTableRowSalesorders({ row, onViewRow }) {

    const { isMobile } = useContext(LoadingContext);

    const popover = usePopover();

    return (
        <>
            <TableRow hover tabIndex={-1} sx={{ cursor: 'pointer' }}>

                {!isMobile ? (
                    <>
                        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>{row?.salesorder_number}</TableCell>

                        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>{row?.customer_name}</TableCell>

                        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>{fDate(row?.date)}</TableCell>

                        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
                            <Label
                                variant="soft"
                                color={
                                    (row?.status === 'fulfilled' && 'warning' || row?.status === 'confirmed' && 'success' || row?.status === 'cancelled' && 'error' || 'info')
                                }
                                sx={{ cursor: 'pointer' }}
                                onClick={() => onViewRow()}
                            >
                                <u>{row?.status}</u>
                            </Label>
                        </TableCell>

                    </>
                ) : (
                    <TableCell >
                        SO #: <Label
                            variant="soft"
                            color='default'
                            sx={{ cursor: 'pointer' }}
                            onClick={() => onViewRow()}
                        >
                            <u>{row?.salesorder_number}</u>
                        </Label><br />
                        Customer: <Label
                            variant="soft"
                            color='default'
                            sx={{ cursor: 'pointer' }}
                            onClick={() => onViewRow()}
                        >
                            <u>{row?.customer_name}</u>
                        </Label><br />
                        Date: <Label
                            sx={{ cursor: 'pointer' }}
                            variant="soft"
                            color='default'
                            onClick={() => onViewRow()}
                        >
                            {fDate(row?.date)}
                        </Label><br />
                        Status: <Label
                            sx={{ cursor: 'pointer' }}
                            variant="soft"
                            color={(row?.status === 'fulfilled' && 'warning' || row?.status === 'confirmed' && 'success' || row?.status === 'cancelled' && 'error' || 'info')}
                            onClick={() => onViewRow()}
                        >
                            <u>{row?.status}</u>
                        </Label>
                    </TableCell>
                )}
                <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
                    <Stack direction="row" alignItems="center">
                        <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                            <Iconify icon="eva:more-vertical-fill" />
                        </IconButton>
                    </Stack>
                </TableCell>
            </TableRow>


            <CustomPopover
                open={popover.open}
                anchorEl={popover.anchorEl}
                onClose={popover.onClose}
                slotProps={{ arrow: { placement: 'right-top' } }}
            >
                <MenuList>
                    <MenuItem
                        onClick={() => {
                            onViewRow();
                            popover.onClose();
                        }}
                    >
                        <Iconify icon="ph:pencil-line" />
                        View SO
                    </MenuItem>

                </MenuList>
            </CustomPopover>
        </>
    );
}
