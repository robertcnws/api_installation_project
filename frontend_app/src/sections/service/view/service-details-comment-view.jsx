import { useMemo, useContext } from "react";

import { Box } from "@mui/material";

import { fIsAfter } from "src/utils/format-time";

import { ServiceDetailsCommentList } from "src/sections/service/service-details-comment-list";
import { ServiceDetailsCommentInput } from "src/sections/service/service-details-comment-input";

import { LoadingContext } from "src/auth/context/loading-context";




export const ServiceDetailsCommentView = ({ service, refetchService }) => {

    const { isMobile } = useContext(LoadingContext);

    const comments = useMemo(() => service?.serviceComments, [service]);

    return (
        <>
            {comments?.length > 0 && (
                <Box sx={{ flexDirection: 'row', gap: 3, ml: 2, maxHeight: isMobile ? '100%' : 350, overflowY: 'auto' }}>
                    <ServiceDetailsCommentList
                        comments={[...comments].sort((a, b) => fIsAfter(b.last_modified_time, a.last_modified_time) ? 1 : -1)}
                        service={service}
                        refetchService={refetchService}
                    />
                </Box>
            )}
            <ServiceDetailsCommentInput service={service} refetchService={refetchService} />
        </>
    );

}