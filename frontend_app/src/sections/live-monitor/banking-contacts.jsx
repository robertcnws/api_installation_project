import React, { useContext, useEffect, useMemo, useState } from 'react';
import { LoadingContext } from 'src/auth/context/loading-context';
import { fDate, fDateTime } from 'src/utils/format-time';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import ListItemText from '@mui/material/ListItemText';
import { CustomPopover, usePopover } from 'src/components/custom-popover';
import { Label } from 'src/components/label';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Collapse, MenuItem, MenuList, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';
import { emptyRows, getComparator, TableEmptyRows, TableHeadCustom, TableNoData, TablePaginationCustom } from 'src/components/table';
import { ModalItemSerialsDetails } from './view/modal-item-serials-details';
import { ModalSublistItemsSerials } from './view/modal-sublist-items-serials';
import { BankingContactsToolbar } from './banking-contacts-toolbar';
import { ItemTableFiltersResult } from '../item/item-table-filters-result';


// ----------------------------------------------------------------------

const headersCSV = [
  { label: 'SKU', key: 'sku' },
  { label: 'Date', key: 'createdTime' },
  { label: 'New Serials', key: 'news' },
  { label: 'Lost Serials', key: 'losts' },
];


export function BankingContacts({
  title,
  subheader,
  list,
  openModal,
  setOpenModal,
  handleOpenModal,
  table,
  filters,
  handleFilterName,
  globalDateFilters,
  setStateWidthModal,
  isLive,
  setIsLive,
  ...other
}) {

  const { isMobile } = useContext(LoadingContext);

  const date = fDate(globalDateFilters.state.endDate, 'YYYY-MM-DD');

  const TABLE_HEAD = [
    { id: 'sku', label: 'SKU', width: isMobile ? 200 : 650 },
    { id: 'live', label: 'Received', width: isMobile ? 100 : 200 },
    { id: 'removed', label: 'Removed', width: isMobile ? 100 : 200 },
    { id: 'killed', label: 'Killed', width: isMobile ? 100 : 100 },
    { id: '' },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'sku', label: 'SKU' },
    { id: 'live', label: <Iconify icon="mdi:plus-circle" /> },
    { id: 'removed', label: <Iconify icon="mdi:minus-circle" /> },
    { id: 'killed', label: <Iconify icon="mdi:close-circle" /> },
  ];

  const [modalDataFiltered, setModalDataFiltered] = useState(null);
  const modalItemSerialsDetailsTitle = 'Item Serials Details';
  const modalListItemsSerialsTitle = 'List Items Serials';
  const [isItemTable, setIsItemTable] = useState(false);
  const popover = usePopover();


  useEffect(() => {
    setStateWidthModal('md');
    setIsItemTable(false);
  }, [setStateWidthModal]);

  const listFilteredByState = useMemo(
    () => {
      if (isLive) {
        return list.filter((item) => item.totalLive > 0);
      }
      return list.filter((item) => item.totalRemoved > 0 || item.totalKilled > 0);
    },
    [list, isLive]);

  const dataFiltered = applyFilter({
    inputData: listFilteredByState,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const canReset = !!filters.state.name;

  const [openRowIds, setOpenRowIds] = useState(new Set());

  const toggleRow = (id) => {
    setOpenRowIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderSecondary = (row) => (
    <TableRow sx={{ borderColor: 'red' }}>
      <TableCell sx={{ p: 0, border: 'none' }} colSpan={5}>
        <Collapse
          in={openRowIds.has(row.itemNumber)}
          timeout="auto"
          unmountOnExit
          sx={{ bgcolor: 'background.neutral' }}
          key={`${row.itemNumber}-collapse`}
        >
          <Paper sx={{ m: 1.5 }} key='renderSecondary'>
            {row.logs?.map((item, index) => (
              <React.Fragment key={`${item.senitronId}-${index}`}>
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    p: (theme) => theme.spacing(1, 1, 1, 1),
                    '&:not(:last-of-type)': {
                      borderBottom: (theme) => `solid 2px ${theme.vars.palette.background.neutral}`,
                    },
                  }}
                >
                  <TableContainer sx={{ width: '100%' }}>
                    <Table size="small">
                      <TableBody>
                        {!isMobile ? (
                          <TableRow>
                            <TableCell sx={{ width: 200, fontSize: '9px' }}><Label variant='soft' sx={{ fontSize: '9px' }}>{row.sku}</Label></TableCell>
                            <TableCell sx={{ width: 100, fontSize: '9px' }}>
                              <Label sx={{ fontSize: '9px' }} align='center' variant='soft' color={item.currentStatusName.toLowerCase().includes('remove') ? 'error' :
                                item.currentStatusName.toLowerCase().includes('kill') ? 'warning' : 'success'}>
                                {item.currentStatusName}
                              </Label>
                            </TableCell>
                            <TableCell sx={{ width: 100, fontSize: '9px' }}><Label sx={{ fontSize: '9px' }} variant='soft'>{item.serialNumber}</Label></TableCell>
                            <TableCell sx={{ width: 100, fontSize: '9px' }}><Label sx={{ fontSize: '9px' }} variant='soft'>{fDateTime(item.createdAt)}</Label></TableCell>
                            <TableCell sx={{ width: 200, fontSize: '9px' }}><Label sx={{ fontSize: '9px' }} variant='soft'>{item.lastZone}</Label></TableCell>
                            {/* <TableCell sx={{ width: 200, fontSize: '9px' }}><Label sx={{ fontSize: '9px' }} variant='soft'>{item.reason.substring(0, 25)}</Label></TableCell> */}
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell sx={{ width: 200, fontSize: '9px' }}>
                              <Label variant='soft' sx={{ fontSize: '9px' }}>{row.sku}</Label>
                              <Label sx={{ fontSize: '9px' }} align='center' variant='soft' color={item.currentStatusName.toLowerCase().includes('remove') ? 'error' :
                                item.currentStatusName.toLowerCase().includes('kill') ? 'warning' : 'success'}>
                                {item.currentStatusName}
                              </Label><br />
                              Serial: <Label sx={{ fontSize: '9px' }} variant='soft'>{item.serialNumber}</Label><br />
                              Date: <Label sx={{ fontSize: '9px' }} variant='soft'>{fDateTime(item.createdAt)}</Label><br />
                              Zone: <Label sx={{ fontSize: '9px' }} variant='soft'>{item.lastZone}</Label>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </React.Fragment>
            ))}
          </Paper>
        </Collapse>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Card {...other}>
        <CardHeader
          title={title}
          subheader={subheader}
          action={
            <>
              <Button
                size="small"
                color="inherit"
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
                onClick={() => {
                  setIsItemTable(!isItemTable);
                  setStateWidthModal(!isItemTable ? 'lg' : 'md');
                }}
              >
                View {isItemTable ? 'in List' : 'in Table'}
              </Button>

            </>
          }
        />
        {isItemTable && (
          <BankingContactsToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            dataFiltered={dataFiltered}
            headersCSV={headersCSV}
            title='All SKUs'
          />
        )}

        <Scrollbar sx={{ maxHeight: 394, minHeight: 394 }}>
          {listFilteredByState?.length > 0 ? (
            <Box
              sx={{
                p: 1,
                gap: 3,
                display: 'flex',
                flexDirection: 'column',
                minWidth: !isMobile ? 360 : 280,
              }}
            >
              {!isItemTable ? listFilteredByState.map((item, index) => (
                <Item
                  key={`${item.itemId}-${index}`}
                  item={item}
                  setModalDataFiltered={setModalDataFiltered}
                  handleOpenModal={handleOpenModal}
                  date={date}
                  isLive={isLive}
                />
              )) : (
                <>

                  <Card>
                    {canReset && (
                      <ItemTableFiltersResult
                        filters={filters}
                        totalResults={dataFiltered.length}
                        onResetPage={table.onResetPage}
                        hasNotAll={false}
                        sx={{ p: 2.5, pt: 0 }}
                      />
                    )}

                    <Box sx={{ position: 'relative' }}>

                      <Scrollbar>
                        {dataFiltered?.length > 0 ? (
                          <TableContainer sx={{
                            maxHeight: !canReset ? 375 : !isMobile ? 275 : 300,
                            minHeight: !canReset ? 375 : !isMobile ? 275 : 300,
                          }}>
                            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 960 : 280 }} stickyHeader>
                              <TableHeadCustom
                                order={table.order}
                                orderBy={table.orderBy}
                                headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                                rowCount={dataFiltered.length}
                                // numSelected={table.selected.length}
                                onSort={table.onSort}
                              />
                              <TableBody>
                                {dataFiltered
                                  .slice(
                                    table.page * table.rowsPerPage,
                                    table.page * table.rowsPerPage + table.rowsPerPage
                                  ).map((item, index) => (
                                    <React.Fragment key={`${item.itemNumber}-${index}`}>
                                      <TableRow key={`${item.itemNumber}-${index}`} >
                                        <TableCell sx={{ width: isMobile ? 200 : 650 }}>
                                          {item.sku}
                                          {isMobile && (
                                            <ListItemText
                                              secondary={
                                                <>
                                                  {item.logs?.length > 0 ? (
                                                    <IconButton
                                                      color={openRowIds.has(item.itemNumber) ? 'inherit' : 'default'}
                                                      onClick={() => toggleRow(item.itemNumber)}
                                                      sx={{
                                                        ...(openRowIds.has(item.itemNumber) && { bgcolor: 'action.hover' }),
                                                        fontSize: 'small'
                                                      }}
                                                    >
                                                      Details <Iconify icon={openRowIds.has(item.itemNumber) ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                                                    </IconButton>
                                                  ) : (
                                                    <Label
                                                      variant="soft"
                                                      color="warning"
                                                    >
                                                      No Data
                                                    </Label>
                                                  )}
                                                </>
                                              }
                                              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                            />
                                          )}
                                        </TableCell>
                                        <TableCell sx={{ width: isMobile ? 100 : 200 }}>
                                          <Label variant="soft" color='success'>{calculateTotalStatus({ date, item, status: 'live' })}</Label>
                                        </TableCell>
                                        <TableCell sx={{ width: isMobile ? 100 : 200 }}>
                                          <Label variant="soft" color='error'>{calculateTotalStatus({ date, item, status: 'remove' })}</Label>
                                        </TableCell>
                                        <TableCell sx={{ width: isMobile ? 100 : 200 }}>
                                          <Label variant="soft" color='warning'>{calculateTotalStatus({ date, item, status: 'kill' })}</Label>
                                        </TableCell>
                                        {!isMobile && (
                                          <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
                                            {item.logs?.length > 0 ? (
                                              <IconButton
                                                color={openRowIds.has(item.itemNumber) ? 'inherit' : 'default'}
                                                onClick={() => toggleRow(item.itemNumber)}
                                                sx={{ ...(openRowIds.has(item.itemNumber) && { bgcolor: 'action.hover' }) }}
                                              >
                                                <Iconify icon={openRowIds.has(item.itemNumber) ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                                              </IconButton>
                                            ) : (
                                              <Label
                                                variant="soft"
                                                color="warning"
                                              >
                                                No Data
                                              </Label>
                                            )}
                                          </TableCell>
                                        )}
                                      </TableRow>
                                      {openRowIds.has(item.itemNumber) && renderSecondary(item)}
                                    </React.Fragment>
                                  ))}
                                {dataFiltered.length > 0 && (
                                  <TableCustomPaginationZohoStyleRow
                                    columnsLength={isMobile ? TABLE_HEAD_MOBILE.length : TABLE_HEAD.length}
                                    data={dataFiltered}
                                    page={table.page}
                                    rowsPerPage={table.rowsPerPage}
                                    handleChangePage={(event, newPage) => {
                                      localStorage.setItem('itemPage', newPage);
                                      table.onChangePage(event, newPage);
                                    }}
                                    handleChangeRowsPerPage={(event) => {
                                      localStorage.setItem('itemRowsPerPage', event.target.value);
                                      table.onChangeRowsPerPage(event);
                                    }}
                                    dense={table.dense}
                                    onChangeDense={table.onChangeDense}
                                  />
                                )}

                                <TableNoData notFound={dataFiltered?.length === 0} />
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <TableContainer sx={{ width: '100%', bgcolor: 'background.paper', p: 1 }}>
                            <Table>
                              <TableBody>
                                <TableNoData notFound={dataFiltered.length === 0} sx={{ height: 50 }} />
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Scrollbar>
                    </Box>

                    {/* <TablePaginationCustom
                      page={table.page}
                      dense={table.dense}
                      count={dataFiltered.length}
                      rowsPerPage={table.rowsPerPage}
                      onPageChange={(event, newPage) => {
                        // localStorage.setItem('itemPage', newPage);
                        table.onChangePage(event, newPage);
                      }}
                      onChangeDense={table.onChangeDense}
                      onRowsPerPageChange={(event) => {
                        // localStorage.setItem('itemRowsPerPage', event.target.value);
                        table.onChangeRowsPerPage(event);
                      }}
                    /> */}
                  </Card>

                  {/* <TableContainer sx={{ height: 350 }}>
                    <Table stickyHeader>
                      <TableHead>
                        {TABLE_HEAD.map((head) => (
                          <TableCell key={head.id} align={head.alignRight ? 'right' : 'left'}>
                            {head.label}
                          </TableCell>
                        ))}
                      </TableHead>
                      <TableBody>
                        {list.map((item, index) => (
                          <ItemInTable
                            key={`${item.itemId}-${index}`}
                            item={item}
                            setModalDataFiltered={setModalDataFiltered}
                            handleOpenModal={handleOpenModal}
                            date={date}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer> */}
                </>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableBody>
                  <TableNoData notFound={dataFiltered?.length === 0} />
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Scrollbar>
      </Card>

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
            }}
          >
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ModalItemSerialsDetails
        openModal={openModal}
        setOpenModal={setOpenModal}
        modalDataFiltered={modalDataFiltered}
        modalTitle={modalItemSerialsDetailsTitle}
        headersCSV={headersCSV}
        table={table}
        date={date}
      />

      <ModalSublistItemsSerials
        openModal={openModal}
        setOpenModal={setOpenModal}
        modalDataFiltered={listFilteredByState}
        headersCSV={headersCSV}
        table={table}
        filters={filters}
        handleFilterName={handleFilterName}
        modalTitle={modalListItemsSerialsTitle}
      />
    </>
  );
}

function ItemInTable({ key, item, sx }) {
  return (
    <>
      {item.logs.length > 0 && (
        <TableRow key={key} sx={{ display: 'flex', alignItems: 'center', ...sx }} >
          <TableCell>
            {item.sku}
          </TableCell>
          <TableCell>
            <Label color='success'>{item.totalLive}</Label>
          </TableCell>
          <TableCell>
            <Label color='error'>{item.totalRemoved}</Label>
          </TableCell>
          <TableCell>
            <Label color='warning'>{item.totalKilled}</Label>
          </TableCell>
          <TableCell> </TableCell>
        </TableRow>
      )}
    </>
  );
}

function Item({ item, sx, setModalDataFiltered, handleOpenModal, date, isLive, ...other }) {
  return (
    <Box sx={{ gap: 2, display: 'flex', alignItems: 'center', ...sx }} {...other}>
      <ListItemText
        primary={item.sku}
        secondary={
          <>
            {item.logs.length > 0 && isLive && (
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center', typography: 'body2', color: 'success.main', gap: 1 }}
              >
                <Iconify icon="eva:arrow-ios-upward-fill" width={16} height={16} />
                <span>
                  <b>{
                    calculateTotalStatus({ date, item, status: 'live' })
                  }</b> Received
                </span>
              </Box>
            )}
            {item.logs.length > 0 && !isLive && (
              <>
                <Box
                  component="span"
                  sx={{ display: 'inline-flex', alignItems: 'center', typography: 'body2', color: 'error.main', gap: 1 }}
                >
                  <Iconify icon="eva:arrow-ios-downward-fill" width={16} height={16} />
                  <span>
                    <b>{
                      calculateTotalStatus({ date, item, status: 'remove' }) + calculateTotalStatus({ date, item, status: 'kill' })
                    }</b> Shipped <span style={{ color: 'orange', fontSize: 'smaller' }}> </span>
                    <span style={{ color: 'orange', fontSize: 'smaller' }}>
                      (Removed: <b>{
                        calculateTotalStatus({ date, item, status: 'remove' })
                      }</b>, Kill: <b>{
                        calculateTotalStatus({ date, item, status: 'kill' })
                      }</b>)</span>
                  </span>
                </Box>
              </>
            )}
          </>
        }
      />

      <Tooltip title="See details">
        <IconButton onClick={() => {
          setModalDataFiltered(item);
          handleOpenModal('itemSerialsDetails');
        }}>
          <Iconify icon="solar:transfer-horizontal-bold-duotone" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function calculateTotalStatus({ date, item, status }) {
  return item.logs.reduce((acc, h) => {
    if (h.currentStatusName?.toLowerCase().includes(status)
      && !h.lastStatusName?.toLowerCase().includes(status)
      && !acc.seen.has(h.serialNumber)
      && fDate(h.createdTime, 'YYYY-MM-DD').includes(date)) {
      acc.seen.add(h.serialNumber);
      acc.count += 1;
    }
    return acc;
  }, { count: 0, seen: new Set() }).count
}

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => item.sku?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }
  return inputData;
}
