import React, { useContext } from 'react';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';

import { LoadingContext } from 'src/auth/context/loading-context';

import PrettifiedJson from './prettified-json';

// ----------------------------------------------------------------------

export function TrackTableRow({ row }) {

  const { isMobile } = useContext(LoadingContext);

  return (
    <TableRow hover tabIndex={-1} sx={{ cursor: 'pointer' }}>

        {!isMobile ? (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.userReporter.first_name} {row.userReporter.last_name}</TableCell>

            <TableCell sx={{ minWidth: 300, maxWidth: 300 }}>{row.action}</TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDateTime(row.createdTime)}</TableCell>

            <TableCell sx={{ minWidth: 500, maxWidth: 500 }}>
              <PrettifiedJson data={row.managedData} maxLength={200} />
            </TableCell>

          </>
        ) : (
          <TableCell >
            User: <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
            >
              <u>{row.userReporter.first_name} {row.userReporter.last_name}</u>
            </Label><br />
            Action: <br/>
              <u>{row.action}</u>
            <br />
            Date: <Label
              sx={{ cursor: 'pointer' }}
              variant="soft"
              color='default'
            >
              {fDateTime(row.createdTime)}
            </Label><br />
            Manage Data: <br/>
              <PrettifiedJson data={row.managedData} maxLength={200} />
          </TableCell>
        )}
      </TableRow>
  );
}
