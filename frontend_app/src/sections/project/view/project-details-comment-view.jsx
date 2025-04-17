import { useMemo, useState, useEffect, useContext, useCallback } from "react";

import { Box, Checkbox, FormControlLabel } from "@mui/material";

import { fIsAfter } from "src/utils/format-time";

import { LoadingContext } from "src/auth/context/loading-context";

import { ProjectDetailsCommentList } from "./project-details-comment-list";
import { ProjectDetailsCommentInput } from "./project-details-comment-input";

export const ProjectDetailsCommentView = ({
    project,
    refetchProject,
    listSelectedTracks,
    selectedComments,
    setSelectedComments,
}) => {

    const { isMobile } = useContext(LoadingContext);

    const comments = useMemo(() => project?.projectComments, [project]);

    const [tracks, setTracks] = useState([]);

    const sortedComments = useMemo(() => [...(comments || [])].sort((a, b) =>
        fIsAfter(b.last_modified_time, a.last_modified_time) ? 1 : -1
    ), [comments]);

    const onSelectComments = useCallback((e) => {
        setSelectedComments(e.target.checked);
    }, [setSelectedComments]);

    useEffect(() => {
        if (!selectedComments) {
            setTracks(listSelectedTracks || []);
        } else {
            setTracks([]);
        }
    }, [listSelectedTracks, selectedComments]);

    return (
        <>
            {(comments?.length > 0 || listSelectedTracks?.length > 0) && (
                <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mt: -5, mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedComments}
                                    onClick={onSelectComments}
                                    inputProps={{ id: 'row-checkbox-comments', 'aria-label': 'row-checkbox' }}
                                />
                            }
                            label="View only comments"
                        />
                    </Box>
                    <Box sx={{ flexDirection: 'column', gap: 3, ml: 2, maxHeight: isMobile ? '100%' : 430, overflowY: 'auto' }}>
                        <ProjectDetailsCommentList
                            comments={sortedComments}
                            project={project}
                            refetchProject={refetchProject}
                            // listSelectedTracks={!selectedComments ? (listSelectedTracks || []) : []}
                            listSelectedTracks={tracks}
                        />
                    </Box>
                </>
            )}
            <ProjectDetailsCommentInput project={project} refetchProject={refetchProject} />
        </>
    );

}