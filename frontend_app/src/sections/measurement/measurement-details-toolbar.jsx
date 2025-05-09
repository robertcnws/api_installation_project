import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { MenuItem, MenuList, TextField, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';






// ----------------------------------------------------------------------

export function MeasurementDetailsToolbar({
  measurement,
  backLink,
  editLink,
  openEdit,
  setOpenEdit,
  type,
  onDelete,
  listPermissions,
  sx,
  ...other
}) {

  const router = useRouter();

  const confirmDelete = useBoolean();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const popoverMeasurementList = usePopover();

  const [measurementFilteredList, setMeasurementFilteredList] = useState([]);

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('measurementFilteredList');
    if (raw) {
      try {
        setMeasurementFilteredList(JSON.parse(raw));
      } catch (e) {
        console.error('Error parseando measurementFilteredList desde localStorage', e);
      }
    }
  }, []);

  const indexInMeasurementFilteredList = useMemo(() => {
    if (measurementFilteredList.length > 0) {
      return measurementFilteredList.findIndex(m => m.id === measurement?.id);
    }
    return -1;
  }, [measurementFilteredList, measurement?.id]);

  const searchedMeasurementFilteredList = useMemo(() => {
    const lower = searchText.toLowerCase();
    return measurementFilteredList.filter(inst =>
      String(inst.number).toLowerCase().includes(lower)
    );
  }, [measurementFilteredList, searchText]);

  return (
    <>
      {/* <Divider sx={{ borderStyle: 'dashed', mb: 1 }} /> */}
      <Stack spacing={1} direction="row" sx={{ mb: { xs: 1, md: 1 }, ...sx }} {...other}>
        {/* <Button
          component={RouterLink}
          href={backLink}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={12} />}
          sx={{ mr: -3 }}
        /> */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">
            MEASUREMENTS ({measurement?.number}) FOR {
            measurement?.service?.number ? 'SERVICE # ' : measurement?.project?.number ? 'INSTALLATION # ' : 'CUSTOMER '
            } {
              measurement?.service?.number ? `${measurement?.service?.number}-${measurement?.service?.version}` : 
              measurement?.project?.number ? `${measurement?.project?.number}` : measurement?.customer?.name
            }
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left' }}>
            {indexInMeasurementFilteredList - 1 >= 0 && (
              <Tooltip
                title={`
                    Previous measurement: ${measurementFilteredList?.[indexInMeasurementFilteredList - 1]?.number} ${' '}
                    (${measurementFilteredList?.[indexInMeasurementFilteredList - 1]?.customerName})`
                }
                arrow>
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={() => {
                    const id = measurementFilteredList?.[indexInMeasurementFilteredList - 1]?.id;
                    localStorage.setItem('measurementId', id);
                    localStorage.setItem('backFromMeasurementDetails', 'measurements');
                    router.push(paths.dashboard.measurement.details(id));
                  }} color='default'>
                  <Iconify icon="mdi-light:skip-previous" />
                </IconButton>
              </Tooltip>
            )}
            {indexInMeasurementFilteredList + 1 < measurementFilteredList?.length && (
              <Tooltip
                title={`
                  Next measurement: ${measurementFilteredList?.[indexInMeasurementFilteredList + 1]?.number} ${' '}
                  (${measurementFilteredList?.[indexInMeasurementFilteredList + 1]?.customerName})
                  `}
                arrow>
                <IconButton
                  sx={{
                    '&:hover': {
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    },
                  }}
                  onClick={() => {
                    const id = measurementFilteredList?.[indexInMeasurementFilteredList + 1]?.id;
                    localStorage.setItem('measurementId', id);
                    localStorage.setItem('backFromMeasurementDetails', 'measurements');
                    router.push(paths.dashboard.measurement.details(id));
                  }} color='default'>
                  <Iconify icon="mdi-light:skip-next" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='List measurements' arrow>
              <IconButton
                sx={{
                  '&:hover': {
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  },
                }}
                onClick={popoverMeasurementList.onOpen}
                color='default'>
                <Iconify icon="pepicons-pencil:next-track" />
              </IconButton>
            </Tooltip>
            <CustomPopover
              open={popoverMeasurementList.open}
              anchorEl={popoverMeasurementList.anchorEl}
              onClose={popoverMeasurementList.onClose}
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
                  placeholder="Search by #"
                  size="small"
                  fullWidth
                />
              </Box>
              <MenuList sx={{
                maxHeight: 300,
                overflowY: 'auto'
              }}>
                {searchedMeasurementFilteredList.length > 0 ? (
                  searchedMeasurementFilteredList?.map((m) => (
                    <MenuItem
                      key={m?.id}
                      onClick={() => {
                        popoverMeasurementList.onClose();
                        const id = m?.id;
                        localStorage.setItem('measurementId', id);
                        localStorage.setItem('backFromMeasurementDetails', 'measurements');
                        router.push(paths.dashboard.measurement.details(id));
                      }}
                    >
                      <Tooltip
                        title={
                          <Typography variant="body2" color="background.neutral" sx={{ mb: 0 }}>
                            Measurement: {m?.number} ({m?.customeName})
                          </Typography>
                        }
                        placement="right"
                        arrow
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left', gap: 2 }}>
                          <Iconify icon="grommet-icons:services" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {m?.number} ({m?.customerName})
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
        </Box>
        <Box sx={{ flexGrow: 1 }} />

        {(type === 'measurement' || type === 'tasks') && (
          (listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)) && (
            <Tooltip title="Delete measurement" arrow>
              <IconButton
                sx={{
                  '&:hover': {
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  },
                }}
                onClick={confirmDelete.onTrue}
                color="error">
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          )
        )}
        <Tooltip title='Close measurement' arrow>
          <Button
            component={RouterLink}
            href={backLink}
            startIcon={<Iconify icon="mingcute:close-fill" />}
            sx={{
              ml: 0,
              borderRadius: 10,
              maxWidth: 1,
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: 'transparent',
              },
            }}
          />
        </Tooltip>

        {/* <LoadingButton
          color="inherit"
          variant="contained"
          loading={!publish}
          loadingIndicator="Loading…"
          endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
          onClick={popover.onOpen}
          sx={{ textTransform: 'capitalize' }}
        >
          {publish}
        </LoadingButton> */}
      </Stack>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete measurement <strong> {measurement?.name} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmDelete.onFalse();
              onDelete();
            }}
          >
            Delete
          </Button>
        }
      />

      {/* <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          {publishOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === publish}
              onClick={() => {
                popover.onClose();
                onChangePublish(option.value);
              }}
            >
              {option.value === 'published' && <Iconify icon="eva:cloud-upload-fill" />}
              {option.value === 'draft' && <Iconify icon="solar:file-text-bold" />}
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover> */}
    </>
  );
}
