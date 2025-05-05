import { useMemo, useState, useEffect, useContext, useCallback } from "react";

import { Box, Checkbox, FormControlLabel } from "@mui/material";

import { fIsAfter } from "src/utils/format-time";
import { listRolesAndSubroles } from "src/utils/check-permissions";

import { CONFIG } from "src/config-global";

import { MeasurementDetailsCommentList } from "src/sections/measurement/measurement-details-comment-list";
import { MeasurementDetailsCommentInput } from "src/sections/measurement/measurement-details-comment-input";

import { LoadingContext } from "src/auth/context/loading-context";

export const MeasurementDetailsCommentView = ({
    measurement,
    refetchMeasurement,
    listSelectedTracks,
    selectedComments,
    setSelectedComments,
}) => {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const comments = useMemo(() => measurement?.measurementComments, [measurement]);

    const [tracks, setTracks] = useState([]);

    const sortedComments = useMemo(() => [...(comments || [])].sort((a, b) =>
        fIsAfter(b.last_modified_time, a.last_modified_time) ? 1 : -1
    ), [comments]);

    const onSelectComments = useCallback((e) => {
        setSelectedComments(e.target.checked);
    }, [setSelectedComments]);

    useEffect(() => {
        if (!selectedComments) {
            setTracks([]);
        } else {
            setTracks(listSelectedTracks || []);
        }
    }, [listSelectedTracks, selectedComments]);

    return (
        <>
            {(comments?.length > 0 || listSelectedTracks?.length > 0) && (
                <>
                    {listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator) && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mt: -5, mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedComments}
                                        onClick={onSelectComments}
                                        inputProps={{ id: 'row-checkbox-comments', 'aria-label': 'row-checkbox' }}
                                    />
                                }
                                label="View all history"
                            />
                        </Box>
                    )}
                    <Box sx={{ flexDirection: 'column', gap: 3, ml: 2, maxHeight: isMobile ? '100%' : 430, overflowY: 'auto' }}>
                        <MeasurementDetailsCommentList
                            comments={sortedComments}
                            measurement={measurement}
                            refetchMeasurement={refetchMeasurement}
                            // listSelectedTracks={!selectedComments ? (listSelectedTracks || []) : []}
                            listSelectedTracks={tracks}
                        />
                    </Box>
                </>
            )}
            <MeasurementDetailsCommentInput measurement={measurement} refetchMeasurement={refetchMeasurement} />
        </>
    );

}