import React from 'react';

import Typography from '@mui/material/Typography';

import { capitalize, getIconByName, transformText, filterManagedData, extractOutsideParentheses } from 'src/utils/helper';

import { Iconify } from 'src/components/iconify';

import MeasurementDetailsCommentListJsonDisplay from './measurement-details-comment-list-json-display';

export function MeasurementDetailsCommentListTrackInfo({ comment }) {
    const extractedAction = extractOutsideParentheses(comment.action);
    const iconData = getIconByName(extractedAction);
    const finalAction = transformText(extractedAction);
    const capitalizedAction = capitalize(finalAction);
    const userFullname = `${comment.userReporter?.first_name} ${comment.userReporter?.last_name}`

    const filteredManagedData = comment.managedData
        ? filterManagedData(
            comment.managedData,
            iconData.includeFields,
            iconData.excludeFields
        )
        : null;

    const removingKeys = [
        'id',
        'last_modified_time',
        '__typename',
        'staff',
        'active',
        'avatar',
    ];

    // const filteredManagedDataWithoutIds = filteredManagedData
    //     ? removeKeysBySubstring(filteredManagedData, removingKeys)
    //     : {};

    const filteredManagedDataWithoutIds = filteredManagedData

    // const managedDataEntries = filteredManagedDataWithoutIds
    //     ? Object.entries(filteredManagedDataWithoutIds).filter(
    //         ([key]) => !key.toLowerCase().includes('id')
    //     )
    //     : [];

    return (
        <Typography component="div" variant="body2" sx={{ fontSize: 'small', mr: 15 }}>
            <Iconify icon={iconData.icon} /> {capitalizedAction}
            {comment.managedData && (
                <>
                    <br />
                    <MeasurementDetailsCommentListJsonDisplay
                        data={filteredManagedDataWithoutIds}
                        action={capitalizedAction}
                        name={userFullname}
                        level={0}
                    />
                </>
            )}
        </Typography>
    );
}
