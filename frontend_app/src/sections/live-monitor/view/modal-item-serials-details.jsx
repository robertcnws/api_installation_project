import React, { useContext, useMemo } from 'react';
import Table from '@mui/material/Table';
import { Box, Stack, TableContainer, TableRow, TableCell, TableBody, Grid, Typography, ListItemText } from "@mui/material";
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { fDate, fDateTime } from 'src/utils/format-time';
import IconButton from '@mui/material/IconButton';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTheme } from '@mui/material/styles';
import { generatePrintablePDF } from 'src/utils/printable-pdf';
import { LoadingContext } from 'src/auth/context/loading-context';
import ExportCSV from "src/utils/export-csv";
import { TableHeadCustom, TableNoData } from 'src/components/table';
import { uuidv4 } from 'src/utils/uuidv4';


export function ModalItemSerialsDetails({
  openModal,
  setOpenModal,
  modalDataFiltered,
  modalTitle,
  headersCSV,
  table,
  date,
  ...other
}) {

  const popover = usePopover();

  const { isMobile } = useContext(LoadingContext);

  const TABLE_HEAD = [
    { id: 'createdTime', label: 'Date', width: 300 },
    { id: 'news', label: 'Received (Serials)', width: 300 },
    { id: 'removed', label: 'Removed (Serials)', width: 300 },
    { id: 'killed', label: 'Killed (Serials)', width: 300 },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'news', label: <Iconify icon="mdi:plus-circle" />  },
    { id: 'removed', label: <Iconify icon="mdi:minus-circle" /> },
    { id: 'killed', label: <Iconify icon="mdi:close-circle" /> },
  ];

  const handleClose = (modalId) => {
    setOpenModal((prev) => ({ ...prev, [modalId]: false }));
  };

  const handleLength = (value) => value?.length;

  const [mapList, setMapList] = React.useState([]);

  React.useEffect(() => {
    if (modalDataFiltered) {

      const logs = modalDataFiltered?.logs.filter(item => fDate(item.createdTime, 'YYYY-MM-DD') === date) ?? [];

      const groupedByDateTime = logs.reduce((acc, log) => {
        const dateTimeKey = fDateTime(log.createdTime); // Supongamos que fDateTime formatea la fecha y hora

        if (!acc[dateTimeKey]) {
          acc[dateTimeKey] = [];
        }
        acc[dateTimeKey].push(log);

        return acc;
      }, {});

      const lNews = Object.entries(groupedByDateTime).map(([dateTime, lgs]) => {
        const liveLogs = lgs.filter(l => l.currentStatusName?.toLowerCase().includes('live'));
        const serialNumbers = liveLogs.map(l => l.serialNumber);
        const uniqueSerialNumbers = [...new Set(serialNumbers)];
        uniqueSerialNumbers.sort();
        return {
          createdTime: dateTime,
          serialNumbers: uniqueSerialNumbers,
        };
      }).filter(item => item.serialNumbers.length > 0);

      const lRemoved = Object.entries(groupedByDateTime).map(([dateTime, groupLogs]) => {
        const removedLogs = groupLogs.filter(l => l.currentStatusName?.toLowerCase().includes('remove'));
        const serialNumbers = removedLogs.map(l => l.serialNumber);
        const uniqueSerialNumbers = [...new Set(serialNumbers)];
        uniqueSerialNumbers.sort();
        return {
          createdTime: dateTime,
          serialNumbers: uniqueSerialNumbers,
        };
      }).filter(item => item.serialNumbers.length > 0);

      const lKilled = Object.entries(groupedByDateTime).map(([dateTime, groupLogs]) => {
        const killedLogs = groupLogs.filter(l => l.currentStatusName?.toLowerCase().includes('kill'));
        const serialNumbers = killedLogs.map(l => l.serialNumber);
        const uniqueSerialNumbers = [...new Set(serialNumbers)];
        uniqueSerialNumbers.sort();
        return {
          createdTime: dateTime,
          serialNumbers: uniqueSerialNumbers,
        };
      }).filter(item => item.serialNumbers.length > 0);

      const ensureEntry = (createdTime, combined) => {
        if (!combinedMap[createdTime]) {
          combined[createdTime] = {
            createdTime,
            listSerialsNews: [],
            listSerialsRemoved: [],
            listSerialsKilled: []
          };
        }
      }

      const combinedMap = {};

      lNews.forEach(({ createdTime, serialNumbers }) => {
        ensureEntry(createdTime, combinedMap);
        combinedMap[createdTime].listSerialsNews = serialNumbers;
      });

      lRemoved.forEach(({ createdTime, serialNumbers }) => {
        ensureEntry(createdTime, combinedMap);
        combinedMap[createdTime].listSerialsRemoved = serialNumbers;
      });

      lKilled.forEach(({ createdTime, serialNumbers }) => {
        ensureEntry(createdTime, combinedMap);
        combinedMap[createdTime].listSerialsKilled = serialNumbers;
      });

      const finalList = Object.values(combinedMap);

      finalList.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

      setMapList(finalList);

    }
  }, [modalDataFiltered, date]);

  return (
    <>
      <ConfirmDialog
        open={openModal.itemSerialsDetails}
        onClose={() => {
          handleClose('itemSerialsDetails');
        }}
        // title={`${modalTitle} (SKU: ${modalDataFiltered?.sku})`}
        maxWidth='lg'
        content={
          <>
            {modalDataFiltered ? (
              <Box sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={11}>
                    <Stack direction="row" alignItems="center" spacing={1} flexGrow={1} sx={{ width: 1 }}>
                      <ListItemText
                        primary={<Typography variant="h6">{modalTitle} (SKU: {modalDataFiltered?.sku})</Typography>}
                        secondary={<Typography variant="body2">Date: {fDate(modalDataFiltered?.date)}</Typography>}
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={1}>
                    <Stack direction="row" alignItems="flex-end" spacing={1} flexGrow={1} sx={{ width: 1 }}>
                      <IconButton onClick={popover.onOpen}>
                        <Iconify icon="eva:more-vertical-fill" />
                      </IconButton>
                    </Stack>
                  </Grid>
                </Grid>
                <br />

                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table size={table?.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 500 : 280 }} stickyHeader>
                    <TableHeadCustom
                      order={table?.order}
                      orderBy={table?.orderBy}
                      headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                      rowCount={mapList?.length}
                      onSort={table?.onSort}
                    />
                    <TableBody>
                      {/* {mapList?.slice(0, 50).map((row, index) => (
                        <>
                          <TableRow key={`${index}-${fDateTime(row.createdTime)}-${uuidv4(index)}`}>
                            <TableCell>{fDateTime(row.createdTime)}</TableCell>
                            <TableCell sx={{ color: 'success.main' }}>{row.listSerialsNews.join(', ')}</TableCell>
                            <TableCell sx={{ color: 'error.main' }}>{row.listSerialsRemoved.join(', ')}</TableCell>
                            <TableCell sx={{ color: 'warning.main' }}>{row.listSerialsKilled.join(', ')}</TableCell>
                          </TableRow>
                        </>
                      ))} */}
                      {/* {Array.from({ length: max }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>{modalDataFiltered?.differences.news[index] || ''}</TableCell>
                          <TableCell>{modalDataFiltered?.differences.losts[index] || ''}</TableCell>
                        </TableRow>
                      ))} */}
                      <TableRow key='unique_key'>
                        {!isMobile && (
                          <TableCell>{date}</TableCell>
                        )}
                        <TableCell sx={{ color: 'success.main' }}>
                          <div style={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                            {modalDataFiltered?.liveLogsSet.join('\n')}
                          </div>
                        </TableCell>
                        <TableCell sx={{ color: 'error.main' }}>
                          <div style={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                            {modalDataFiltered?.removedLogsSet.join('\n')}
                          </div>
                        </TableCell>
                        <TableCell sx={{ color: 'warning.main' }}>
                          <div style={{ whiteSpace: 'pre-line', fontFamily: 'monospace' }}>
                            {modalDataFiltered?.killedLogsSet.join('\n')}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <TableContainer sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                <Table>
                  <TableBody>
                    <TableNoData notFound={modalDataFiltered?.length === 0} />
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        }
      />
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              // generatePrintablePDF({ data: modalDataFiltered, title: modalTitle });
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>

        </MenuList>
      </CustomPopover>
    </>
  );
}