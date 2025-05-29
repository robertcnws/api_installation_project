import axios from 'axios';
import React, { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Chip, Table, Button, Avatar, Tooltip, TableRow, ListItem, TableBody, TableCell, TextField, IconButton, Autocomplete } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { listRolesAndSubroles } from 'src/utils/check-permissions';
import { generateMeasurementReport } from 'src/utils/generate-measurement-report';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { useTable } from 'src/components/table';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { MeasurementDetailsContentComponent } from 'src/sections/measurement/measurement-details-content-component';

import { LoadingContext } from 'src/auth/context/loading-context';

import { MeasurementDetailsContentMarkTable } from '../measurement-details-content-mark-table';
import { MeasurementDetailsContentMarkTableMobile } from '../measurement-details-content-mark-table-mobile';



const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const COLOR_OPTIONS = [
  { id: 1, name: 'White' },
  { id: 2, name: 'Bronze' },
  { id: 3, name: 'Other' },
]



// ----------------------------------------------------------------------

export function MeasurementDetailsContent({
  measurement,
  refetchMeasurement,
  setOpenEdit,
  openDialogs,
  setOpenDialogs,
}) {

  const theme = useTheme();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const table = useTable({ defaultDense: true });

  const { dense } = table;

  const [generalNotes, setGeneralNotes] = useState(measurement?.generalNotes || '');

  const [currentMarks, setCurrentMarks] = useState(measurement?.marks || []);

  const [selectedMark, setSelectedMark] = useState(null);

  const [selectedMarkIndex, setSelectedMarkIndex] = useState(null);

  const [selectedColor, setSelectedColor] = useState(measurement?.color || null);

  const confirmRemove = useBoolean();

  useEffect(() => {
    if (measurement?.marks?.length > 0) {
      setCurrentMarks(measurement.marks);
    }
    else {
      setCurrentMarks([
        {
          type: '',
          config: '',
          dimensions: [0, 0],
          notes: '',
          line_item_id: '0',
          first_check: false,
          second_check: false,
        }
      ]);
    }
  }, [measurement]);

  useEffect(() => {
    if (measurement?.generalNotes) {
      setGeneralNotes(measurement.generalNotes);
    }
  }, [measurement]);

  useEffect(() => {
    if (measurement?.color) {
      setSelectedColor(measurement.color);
    }
  }, [measurement]);


  const handleAddMark = useCallback(() => {
    const maxId = currentMarks?.reduce((max, mark) => {
      const id = BigInt(mark.line_item_id);
      return id > max ? id : max;
    }, 0n) || 0n;

    const newLineItemId = (maxId + 1n).toString();

    const newMark = {
      type: '',
      config: '',
      dimensions: [0, 0],
      notes: '',
      line_item_id: newLineItemId,
      first_check: false,
      second_check: false,
    };

    setCurrentMarks(prev => [...prev, newMark]);
  }, [currentMarks]);

  const handleRemoveMark = useCallback(async () => {

    const updatedMarks = measurement.marks.filter((mark) => mark.line_item_id === selectedMark?.line_item_id);

    try {

      const url = `${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/delete-mark/${selectedMark?.line_item_id}/`;
      let response = '';

      if (updatedMarks.length > 0) {
        const promise = axios.delete(url, {
          data: {
            userReporter: JSON.stringify(userLogged?.data),
          }
        });
        response = await promise;
      }

      else {
        const newMarks = currentMarks.filter((mark) => mark.line_item_id !== selectedMark?.line_item_id);
        setCurrentMarks(newMarks);
      }

      toast.success(response?.data?.message || 'Mark removed successfully!');

      refetchMeasurement?.();

      // setCurrentMarks(updatedMarks);
      confirmRemove.onFalse();

    }
    catch (error) {
      console.error('Error removing mark:', error);
      toast.error(error?.response?.data?.message || 'Error removing mark!');
    }

  }, [currentMarks, selectedMark, confirmRemove, measurement, refetchMeasurement, userLogged]);

  const handleCheck = useCallback(async (mark, checkTime) => {
    try {
      const url = `${CONFIG.apiUrl}/measurements/update/measurement/${measurement.id}/check-mark/`;
      const payload = {
        ...mark,
        first_check: checkTime === 'first' ? true : mark.first_check,
        second_check: checkTime === 'second' ? true : mark.second_check,
      }
      const promise = axios.post(url, {
        userReporter: JSON.stringify(userLogged?.data),
        mark: JSON.stringify(payload)
      });
      const response = await promise;

      toast.success(response?.data?.message || 'Mark checked successfully!');

      refetchMeasurement?.();

      confirmRemove.onFalse();

    }
    catch (error) {
      console.error('Error checking mark:', error);
      toast.error(error?.response?.data?.message || 'Error checking mark!');
    }
  }, [confirmRemove, measurement, refetchMeasurement, userLogged]);


  const handleSetColor = useCallback(async () => {
    const formData = new FormData();
    formData.append('userReporter', JSON.stringify(userLogged?.data));
    formData.append('color', JSON.stringify(selectedColor));

    const url = `${CONFIG.apiUrl}/measurements/update/measurement/${measurement?.id}/change-color/`;

    const promise = axios.post(url, formData);

    try {
      toast.promise(promise, {
        loading: 'Loading...',
        success: `Update Measurement (${measurement.number}) success!`,
        error: `Update Measurement (${measurement.number}) error!`,
      });

      const response = await promise;

      if (!response.data) {
        return;
      }

      refetchMeasurement?.();

    } catch (error) {
      console.error(error);
    }
  }, [measurement, selectedColor, userLogged, refetchMeasurement]);


  const handleIsNotValidMark = useCallback((mark) =>
    !mark.type || mark.type.length === 0 ||
    mark.dimensions?.some(dim => dim <= 0)
    , []);


  const renderFirstContent = (
    <Card sx={{
      p: 1,
      gap: 1,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      mt: -1,
      ml: !isMobile ? -1 : 3,
      mb: 2,
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 1,
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
          <Table size="small" sx={{ width: '100%', p: 0 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontSize: 14, color: theme.palette.text.secondary }} align="left">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                    Color:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1,
                    justifyContent: 'space-between',
                    width: (measurement?.checkAssignee?.id || measurement?.firstAssignee?.id) ? '100%' : '118%'
                  }}>
                    <Autocomplete
                      disabled={!listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff)}
                      sx={{ width: '100%' }}
                      value={selectedColor || null}
                      onChange={(e, newValue) => {
                        setSelectedColor(newValue);
                      }}
                      options={COLOR_OPTIONS}
                      getOptionLabel={(option) => option.name || ''}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderOption={(props, i) => (
                        <ListItem {...props} key={`${i.id}-option`}>
                          {i.name}
                        </ListItem>
                      )}
                      renderTags={(selected, getTagProps) =>
                        selected.map((p, i) => (
                          <Chip
                            {...getTagProps({ i })}
                            key={p.id}
                            size="small"
                            variant="soft"
                            label={p.name}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label="Color"
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              height: '37px',
                              '& input': {
                                padding: '0 8px',
                                height: '37px',
                                lineHeight: '37px'
                              }
                            }
                          }}
                          InputLabelProps={{
                            shrink: true,
                            sx: {
                              top: '-10px',
                              transform: 'translate(14px, 0px) scale(0.75)'
                            }
                          }}
                        />
                      )}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                  {(listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff)) && (
                    <Tooltip title={`Set color to ${measurement?.number}`} arrow>
                      <span>
                        <IconButton
                          variant="text"
                          color={measurement?.color?.id ? "primary" : "warning"}
                          size="small"
                          sx={{
                            ml: 0,
                            maxWidth: 10,
                            cursor: !selectedColor || selectedColor?.id === measurement?.color?.id ? 'not-allowed' : 'pointer',
                            '&.Mui-disabled': {
                              cursor: 'not-allowed !important',
                              pointerEvents: 'auto',
                            }
                          }}
                          disabled={!selectedColor || selectedColor?.id === measurement?.color?.id}
                          onClick={handleSetColor}
                        >
                          <Iconify icon="gg:check-o" color="primary" width={22} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
              {(!measurement?.project?.id && !measurement?.service?.id) && (
                <TableRow>
                  <TableCell sx={{ fontSize: 14, color: theme.palette.text.secondary }} align="left">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                      First Measurement Responsible:
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                      <Avatar alt={measurement?.firstAssignee?.name} src={measurement?.firstAssignee?.avatarUrl} sx={{ width: 24, height: 24, mr: 1 }} />
                      <Typography variant="body2" color="text.primary">
                        <b>{measurement?.firstAssignee?.name ? measurement?.firstAssignee?.name : ''}</b>
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                    {(measurement?.firstAssignee?.name && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (

                      <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => setOpenDialogs({ ...openDialogs, firstAssignee: true })}
                      >
                        <Iconify icon="la:user-edit" color="primary" width={22} />
                      </IconButton>

                    )}
                    {(!measurement?.firstAssignee?.name && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (
                      <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => setOpenDialogs({ ...openDialogs, firstAssignee: true })}
                      >
                        <Iconify icon="tdesign:user-add-filled" color="warning" width={20} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ fontSize: 14, color: theme.palette.text.secondary }} align="left">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                    Check Responsible:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                    <Avatar alt={measurement?.checkAssignee?.name} src={measurement?.checkAssignee?.avatarUrl} sx={{ width: 24, height: 24, mr: 1 }} />
                    <Typography variant="body2" color="text.primary">
                      <b>{measurement?.checkAssignee?.name ? measurement?.checkAssignee?.name : ''}</b>
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                  {(measurement?.checkAssignee?.name && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (

                    <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, checkAssignee: true })}
                    >
                      <Iconify icon="la:user-edit" color="primary" width={22} />
                    </IconButton>

                  )}
                  {(!measurement?.checkAssignee?.name && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (
                    <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, checkAssignee: true })}
                    >
                      <Iconify icon="tdesign:user-add-filled" color="warning" width={20} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
              {(!measurement?.project?.id && !measurement?.service?.id) && (
                <TableRow>
                  <TableCell sx={{ fontSize: 14, color: theme.palette.text.secondary }} align="left">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                      First Measurement Date:
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.primary">
                        <b>{fDate(measurement?.firstDate) || 'No First Date'}</b>
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                    {(measurement?.firstDate && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (

                      <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => setOpenDialogs({ ...openDialogs, firstDate: true })}
                      >
                        <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                      </IconButton>

                    )}
                    {(!measurement?.firstDate && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (
                      <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                        onClick={() => setOpenDialogs({ ...openDialogs, firstDate: true })}
                      >
                        <Iconify icon="zondicons:date-add" color="warning" width={20} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              )}

              <TableRow>
                <TableCell sx={{ fontSize: 14, color: theme.palette.text.secondary }} align="left">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                    Check Date:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.primary">
                      <b>{fDate(measurement?.checkDate) || 'No Check Date'}</b>
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                  {(measurement?.checkDate && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (

                    <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, checkDate: true })}
                    >
                      <Iconify icon="fluent:calendar-edit-32-regular" color="primary" width={22} />
                    </IconButton>

                  )}
                  {(!measurement?.checkDate && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (
                    <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, checkDate: true })}
                    >
                      <Iconify icon="zondicons:date-add" color="warning" width={20} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontSize: 14, color: theme.palette.text.secondary }} align="left">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                    General Notes:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                    <Typography
                      variant="caption"
                      color="text.primary"
                      noWrap
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <b>{measurement?.generalNotes ? measurement?.generalNotes : 'No Notes found'}</b>
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right', maxWidth: '30px' }}>
                  {(measurement?.generalNotes && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (

                    <IconButton variant="text" color="primary" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, generalNotes: true })}
                    >
                      <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
                    </IconButton>

                  )}
                  {(!measurement?.generalNotes && (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.serviceStaff))) && (
                    <IconButton variant="text" color="warning" size="small" sx={{ ml: 0, maxWidth: 10 }}
                      onClick={() => setOpenDialogs({ ...openDialogs, generalNotes: true })}
                    >
                      <Iconify icon="fluent:slide-text-edit-20-regular" color="warning" width={20} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: !isMobile ? 'row' : 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          gap: 1,
        }}>
          <Label variant="outlined" color="default" sx={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>
            Not Checked: <b>{currentMarks.filter((m) => !m.first_check && !m.second_check).length}</b>
          </Label>
          {(!measurement?.project?.id && !measurement?.service?.id) && (
            <Label variant="outlined" color="warning" sx={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>
              First Checked: <b>{currentMarks.filter((m) => m.first_check && !m.second_check).length}</b>
            </Label>
          )}
          <Label variant="outlined" color="success" sx={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>
            Second Checked: <b>{currentMarks.filter((m) => m.second_check).length}</b>
          </Label>
        </Box>

      </Box>
    </Card>
  )


  const renderMainContent = (
    <Card sx={{
      p: 2,
      gap: 1,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: 664,
      minHeight: 664,
      maxHeight: 664,
      mt: -1.5,
      ml: -1,
    }}>
      {!isMobile ? (
        <MeasurementDetailsContentMarkTable
          userLogged={userLogged}
          measurement={measurement}
          ABC={ABC}
          theme={theme}
          currentMarks={currentMarks}
          setCurrentMarks={setCurrentMarks}
          handleCheck={handleCheck}
          handleAddMark={handleAddMark}
          handleIsNotValidMark={handleIsNotValidMark}
          confirmRemove={confirmRemove}
          setSelectedMark={setSelectedMark}
          setSelectedMarkIndex={setSelectedMarkIndex}
          isMobile={isMobile}
        />
      ) : (
        <MeasurementDetailsContentMarkTableMobile
          userLogged={userLogged}
          measurement={measurement}
          ABC={ABC}
          theme={theme}
          currentMarks={currentMarks}
          setCurrentMarks={setCurrentMarks}
          handleCheck={handleCheck}
          handleAddMark={handleAddMark}
          handleIsNotValidMark={handleIsNotValidMark}
          confirmRemove={confirmRemove}
          setSelectedMark={setSelectedMark}
          setSelectedMarkIndex={setSelectedMarkIndex}
          isMobile={isMobile}
        />
      )}
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        mt: 2,
        width: '100%',
        gap: 1
      }}>
        <Button
          variant="outlined"
          color="warning"
          sx={{ borderRadius: 1 }}
          onClick={() => generateMeasurementReport({ measurement, empty: true })}
        >
          Download empty report
        </Button>
        <Button
          variant="outlined"
          sx={{ borderRadius: 1 }}
          onClick={() => generateMeasurementReport({ measurement, empty: false })}
        >
          Download full report
        </Button>
      </Box>
    </Card >
  );


  const dynamicHeight = useMemo(() => {
    let height = 290

    if (!measurement?.userManager?.name) {
      height += 40
    }

    if (measurement?.usersMeasurementTeam?.length > 0) {
      height -= 5
    }
    if (measurement?.startDate) {
      height -= 15
    }
    // if (!measurement?.hasToPay && !measurement?.byFactory) {
    //   height -= 45
    // }
    // if (measurement?.hasToPay || measurement?.byFactory) {
    //   height -= 10
    // }
    return height
  }, [measurement]);


  const renderOverview = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0, ml: -1 }}>
      <MeasurementDetailsContentComponent
        measurement={measurement}
        openDialogs={openDialogs}
        setOpenDialogs={setOpenDialogs}
        isOverview={!!measurement}
        height={(!measurement?.project?.id && !measurement?.service?.id) ? 310 : 410}
      />
    </Box>
  );

  if (measurement === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="h6" color="text.secondary">
          Measurement not found!
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {/* {!isInstaller(userLogged?.data?.user_role?.name) && ( */}
          <>
            <Grid xs={12} md={8}>
              <Grid xs={12} md={12}>
                <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column', gap: 1, mb: 1, mt: -3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {renderMainContent}
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Grid xs={12} md={4}>
              <Box sx={{ mb: 1, width: '100%', mt: -2, ml: -3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {renderFirstContent}
                  {renderOverview}
                </Box>
              </Box>
            </Grid>
          </>
        {/* )} */}
      </Grid >
      <ConfirmDialog
        open={confirmRemove.value}
        onClose={confirmRemove.onFalse}
        title="Remove Mark"
        content={
          <>
            Are you sure want to remove the mark {ABC[selectedMarkIndex]}:
            <b>{selectedMark?.type ? ` ${selectedMark?.type}, ` : ''} [{selectedMark?.dimensions.join(' x ')}]</b>?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleRemoveMark}>
            Remove
          </Button>
        }
      />
    </>
  );
}
