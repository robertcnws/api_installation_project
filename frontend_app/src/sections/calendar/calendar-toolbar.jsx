
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/system';
import { Dialog, DialogTitle } from '@mui/material';
import { useBoolean } from 'src/hooks/use-boolean';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { CalendarNoteForm } from './calendar-note-form';



// ----------------------------------------------------------------------

const VIEW_OPTIONS = [
  { value: 'dayGridMonth', label: 'Month', icon: 'mingcute:calendar-month-line' },
  { value: 'timeGridWeek', label: 'Week', icon: 'mingcute:calendar-week-line' },
  { value: 'timeGridDay', label: 'Day', icon: 'mingcute:calendar-day-line' },
  { value: 'listWeek', label: 'Agenda', icon: 'fluent:calendar-agenda-24-regular' },
];

// ----------------------------------------------------------------------

export function CalendarToolbar({
  date,
  view,
  loading,
  onToday,
  canReset,
  onNextDate,
  onPrevDate,
  onChangeView,
  onOpenFilters,
}) {
  const popover = usePopover();

  const theme = useTheme();

  const openNewCalendarNote = useBoolean();

  const selectedItem = VIEW_OPTIONS.filter((item) => item.value === view)[0];

  return (
    <>
      {/* {isOnlyWeek && (
        <Box sx={{ ml: 2, mb: 2, mt: 2 }}>
          <Typography variant="title1">
            <b>Installations Calendar (Week)</b>
          </Typography>
        </Box>
      )} */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 2.5, pr: 2, position: 'relative' }}
      >
        <Button
          size="small"
          color="inherit"
          onClick={popover.onOpen}
          startIcon={<Iconify icon={selectedItem.icon} />}
          endIcon={<Iconify icon="eva:arrow-ios-downward-fill" sx={{ ml: -0.5 }} />}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {selectedItem.label}
        </Button>

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={onPrevDate}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>

          <Typography variant="h6">{date}</Typography>

          <IconButton onClick={onNextDate}>
            <Iconify icon="eva:arrow-ios-forward-fill" />
          </IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Button size="small" color="primary" variant="contained" onClick={openNewCalendarNote.onTrue}>
            Add Note
          </Button>

          <Button size="small" color="warning" variant="contained" onClick={onToday}>
            Today
          </Button>

          <IconButton onClick={onOpenFilters}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="ic:round-filter-list" />
            </Badge>
          </IconButton>
        </Stack>

        {loading && (
          <LinearProgress
            color="inherit"
            sx={{
              left: 0,
              width: 1,
              height: 2,
              bottom: 0,
              borderRadius: 0,
              position: 'absolute',
            }}
          />
        )}
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-left' } }}
      >
        <MenuList>
          {VIEW_OPTIONS.map((viewOption) => (
            <MenuItem
              key={viewOption.value}
              selected={viewOption.value === view}
              onClick={() => {
                popover.onClose();
                onChangeView(viewOption.value);
              }}
            >
              <Iconify icon={viewOption.icon} />
              {viewOption.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>

      <Dialog
        fullWidth
        maxWidth='md'
        open={openNewCalendarNote.value}
        onClose={openNewCalendarNote.onFalse}
        transitionDuration={{
          enter: theme.transitions.duration.shortest,
          exit: theme.transitions.duration.shortest - 80,
        }}
        PaperProps={{
          sx: {
            display: 'flex',
            overflow: 'hidden',
            flexDirection: 'column',
            '& form': { minHeight: 0, display: 'flex', flex: '1 1 auto', flexDirection: 'column' },
          },
        }}
      >
        <DialogTitle sx={{ minHeight: 76 }}>
          {openNewCalendarNote.value && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box className="dialog-title-icon">
                <Iconify icon="mdi:calendar" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Add new calendar note event
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <CalendarNoteForm currentEvent={null} onClose={openNewCalendarNote.onFalse} />
      </Dialog>
    </>
  );
}
