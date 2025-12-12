import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

function getElapsedMs(timer, nowMs) {
  if (!timer) return 0;

  const running = Boolean(timer.isRunning);

  const baseElapsed = Number(timer.elapsedMs || timer.elapsed_time_ms || 0);
  const backendCurrent = Number(timer.currentElapsedMs || timer.current_elapsed_ms || 0);

  const startStr = timer.startTime || timer.start_time || null;
  const startMs = startStr ? new Date(startStr).getTime() : NaN;

  if (running && Number.isFinite(startMs)) {
    const computed = baseElapsed + (nowMs - startMs);
    return Math.max(computed, backendCurrent, baseElapsed);
  }

  return Math.max(baseElapsed, backendCurrent);
}

function getTimeParts(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (v) => String(v).padStart(2, '0');

export function PersistentServerTimer({ serverTimer, nowMs, compact = false }) {
  const router = useRouter();

  if (!serverTimer?.entityId) return null;

  const elapsedMs = getElapsedMs(serverTimer, nowMs);
  const { days, hours, minutes, seconds } = getTimeParts(elapsedMs);

  return (
    <Box
      sx={{
        p: compact ? 0.5 : 0.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 0.25,
        alignItems: 'center',
        minWidth: compact ? 180 : 200,
        bgcolor: 'warning.lighter',
        cursor: 'pointer',
      }}
      onClick={() => {
        const pid = serverTimer?.entityInfo?.project_id || '';
        localStorage.setItem('projectId', pid);
        router.push(paths.dashboard.project.details(pid));
      }}
    >
      <Typography variant={compact ? 'caption' : 'body2'}>
        Installing... <b>{serverTimer.entityInfo?.project_name || 'Timer'}</b>
      </Typography>

      <Stack
        direction="row"
        spacing={0.5}
        alignItems="baseline"
        sx={{ bgcolor: 'error.lighter', borderRadius: 2, px: 1 }}
      >
        <Typography variant="h6">{pad(days)}</Typography><Typography variant="caption">d</Typography>
        <Typography variant="h6">{pad(hours)}</Typography><Typography variant="caption">h</Typography>
        <Typography variant="h6">{pad(minutes)}</Typography><Typography variant="caption">m</Typography>
        <Typography variant="h6">{pad(seconds)}</Typography><Typography variant="caption">s</Typography>
      </Stack>
    </Box>
  );
}
