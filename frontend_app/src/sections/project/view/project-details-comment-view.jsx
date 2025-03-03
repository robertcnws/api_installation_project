import { useMemo, useContext } from "react";

import { Box } from "@mui/material";

import { LoadingContext } from "src/auth/context/loading-context";
import { fIsAfter } from "src/utils/format-time";
import { ProjectDetailsCommentList } from "./project-details-comment-list";
import { ProjectDetailsCommentInput } from "./project-details-comment-input";




export const ProjectDetailsCommentView = ({ project, refetchProject }) => {

    const { isMobile } = useContext(LoadingContext);

    const comments = useMemo(() => project?.projectComments, [project]);

    return (
        <>
            {comments?.length > 0 && (
                <Box sx={{ flexDirection: 'row', gap: 3, ml: 2, maxHeight: isMobile ? '100%' : 350, overflowY: 'auto' }}>
                    <ProjectDetailsCommentList
                        comments={[...comments].sort((a, b) => fIsAfter(b.last_modified_time, a.last_modified_time) ? 1 : -1)}
                        project={project}
                        refetchProject={refetchProject}
                    />
                </Box>
            )}
            <ProjectDetailsCommentInput project={project} refetchProject={refetchProject} />
        </>
    );

}