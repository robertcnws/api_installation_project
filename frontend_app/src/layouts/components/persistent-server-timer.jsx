import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useContext } from 'react';
import { LoadingContext } from 'src/auth/context/loading-context';
import { Iconify } from 'src/components/iconify';
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

  const { isMobile } = useContext(LoadingContext);

  if (!serverTimer?.entityId) return null;

  const elapsedMs = getElapsedMs(serverTimer, nowMs);
  const { days, hours, minutes, seconds } = getTimeParts(elapsedMs);

  const text = !isMobile ? serverTimer.entityInfo?.project_name :
                compact ? serverTimer.entityInfo?.project_name :
                  `${serverTimer.entityInfo?.project_name?.slice(0, 15)}...`;

  return (
    <Box
      sx={{
        p: compact ? 0.5 : 0.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',           // ✅ mejor que inline-flex aquí
        flexDirection: 'column',
        gap: 0.5,
        alignItems: 'stretch',
        width: '100%',             // ✅ para que ellipsis tenga referencia
        minWidth: 0,               // ✅ CRUCIAL en flex para que el ellipsis funcione
        bgcolor: 'warning.lighter',
        cursor: 'pointer',
      }}
      onClick={() => {
        const pid = serverTimer?.entityInfo?.project_id || '';
        localStorage.setItem('projectId', pid);
        router.push(paths.dashboard.project.details(pid));
      }}
    >
      <Typography
        variant={compact ? 'caption' : 'body2'}
        sx={{
          width: '100%',
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={serverTimer.entityInfo?.project_name || 'Timer'} // ✅ tooltip nativo al hover
      >
        <b>{text}</b>
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'row' }}>

        <Typography
          variant={compact ? 'caption' : 'body2'}
          sx={{ color: 'text.secondary', mt: 0.5 }}
        >
          <Iconify icon="healthicons:factory-worker" width={20} height={20} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {!isMobile && (
            'Time Elapsed:'
          )}
        </Typography>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="baseline"
          sx={{
            bgcolor: 'error.lighter',
            borderRadius: 2,
            px: 1,
            width: 'fit-content',
            alignSelf: 'center',
          }}
        >
          <Typography variant="h6">{pad(days)}</Typography><Typography variant="caption">d</Typography>
          <Typography variant="h6">{pad(hours)}</Typography><Typography variant="caption">h</Typography>
          <Typography variant="h6">{pad(minutes)}</Typography><Typography variant="caption">m</Typography>
          <Typography variant="h6">{pad(seconds)}</Typography><Typography variant="caption">s</Typography>
        </Stack>
      </Box>
    </Box>
  );
}
