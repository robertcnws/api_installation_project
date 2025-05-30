import { Box, IconButton, MenuItem, MenuList, TextField, Tooltip, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { CustomPopover, usePopover } from "src/components/custom-popover";
import { Iconify } from "src/components/iconify";
import { fDate } from "src/utils/format-time";

export function AttachmentNavigationComponent({
    dataFiltered,
    setDisplayAttachments,
    displayData,
    setDisplayData,
    stageName,
    funcGetAttachments,
    objType = 'Installation',
}) {

    const indexInFilteredList = useMemo(() => {
        if (dataFiltered.length > 0) {
            return dataFiltered.findIndex(obj => obj.id === displayData?.id);
        }
        return -1;
    }, [dataFiltered, displayData]);

    const popoverList = usePopover();

    const [searchText, setSearchText] = useState('');

    const searchedFilteredList = useMemo(() => {
        const lower = searchText.toLowerCase();
        return dataFiltered.filter(inst =>
            inst.name.toLowerCase().includes(lower) ||
            String(inst.number).toLowerCase().includes(lower)
        );
    }, [dataFiltered, searchText]);

    // const attachments = useMemo(() => {
    //     if (displayData) {
    //         const files = funcGetAttachments(displayData, stageName);
    //         return files?.project?.concat(files?.tasks);
    //     }
    //     return [];
    // }, [displayData, stageName]);


    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left' }}>
            {indexInFilteredList - 1 >= 0 && (
                <Tooltip title={`Previous ${objType.toLowerCase()}: ${dataFiltered?.[indexInFilteredList - 1]?.name}`} arrow>
                    <IconButton
                        sx={{
                            '&:hover': {
                                boxShadow: 'none',
                                backgroundColor: 'transparent',
                            },
                        }}
                        onClick={() => {
                            const currentProject = dataFiltered?.[indexInFilteredList - 1];
                            setDisplayData(currentProject)
                            const files = funcGetAttachments(currentProject, stageName);
                            setDisplayAttachments(files?.project?.concat(files?.tasks) || files?.service );
                        }} color='default'>
                        <Iconify icon="mdi-light:skip-previous" />
                    </IconButton>
                </Tooltip>
            )}
            {indexInFilteredList + 1 < dataFiltered?.length && (
                <Tooltip title={`Next ${objType.toLowerCase()}: ${dataFiltered?.[indexInFilteredList + 1]?.name}`} arrow>
                    <IconButton
                        sx={{
                            '&:hover': {
                                boxShadow: 'none',
                                backgroundColor: 'transparent',
                            },
                        }}
                        onClick={() => {
                            const currentProject = dataFiltered?.[indexInFilteredList + 1];
                            setDisplayData(currentProject)
                            const files = funcGetAttachments(currentProject, stageName);
                            setDisplayAttachments(files?.project?.concat(files?.tasks) || files?.service );
                        }} color='default'>
                        <Iconify icon="mdi-light:skip-next" />
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip title={`List ${objType.toLowerCase()}s`} arrow>
                <IconButton
                    sx={{
                        '&:hover': {
                            boxShadow: 'none',
                            backgroundColor: 'transparent',
                        },
                    }}
                    onClick={popoverList.onOpen}
                    color='default'>
                    <Iconify icon="pepicons-pencil:next-track" />
                </IconButton>
            </Tooltip>
            <CustomPopover
                open={popoverList.open}
                anchorEl={popoverList.anchorEl}
                onClose={popoverList.onClose}
                slotProps={{ arrow: { placement: 'left-top' } }}
                PaperProps={{
                    style: {
                        maxHeight: 300,
                    }
                }}
            >
                <Box sx={{ p: 1 }}>
                    <TextField
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search by name or #"
                        size="small"
                        fullWidth
                    />
                </Box>
                <MenuList sx={{
                    maxHeight: 300,
                    overflowY: 'auto'
                }}>
                    {searchedFilteredList.length > 0 ? (
                        searchedFilteredList?.map((obj) => (
                            <MenuItem
                                key={obj?.id}
                                onClick={() => {
                                    popoverList.onClose();
                                    setDisplayData(obj)
                                    const files = funcGetAttachments(obj, stageName);
                                    setDisplayAttachments(files?.project?.concat(files?.tasks) || files?.service );
                                }}
                            >
                                <Tooltip
                                    title={
                                        <>
                                            <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                {`${objType}`}: {obj?.name}
                                            </Typography>
                                            <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                                                {`${objType}`} Date: {fDate(obj?.startDate) || 'N/A'}
                                            </Typography>
                                        </>
                                    }
                                    placement="right"
                                    arrow
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left', gap: 2 }}>
                                        <Iconify icon="grommet-icons:services" />
                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                            {obj?.name}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>No matches</MenuItem>
                    )}
                </MenuList>
            </CustomPopover>
        </Box>
    )
}