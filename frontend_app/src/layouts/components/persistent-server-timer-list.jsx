import { useEffect, useMemo, useState } from 'react';
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { PersistentServerTimer } from './persistent-server-timer';

const timerKey = (t) => `${t?.entityType || ''}-${String(t?.entityId || '')}-${t?.username || ''}`;

export function PersistentServerTimerList({ timers = [] }) {
  const runningTimers = useMemo(() => (timers || []).filter((t) => t?.isRunning), [timers]);

  const [selectedKey, setSelectedKey] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());

  // ✅ un solo tick para TODOS
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // ✅ asegurar selección estable (no por index)
  useEffect(() => {
    if (!runningTimers.length) return;

    const exists = selectedKey && runningTimers.some((t) => timerKey(t) === selectedKey);
    if (!exists) setSelectedKey(timerKey(runningTimers[0]));
  }, [runningTimers, selectedKey]);

  if (!runningTimers.length) return null;

  const selectedTimer =
    runningTimers.find((t) => timerKey(t) === selectedKey) || runningTimers[0];

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Visible siempre */}
      <PersistentServerTimer
        serverTimer={selectedTimer}
        nowMs={nowMs}
      />

      {runningTimers.length > 1 && (
        <>
          <Tooltip title="Select running timer(s)" arrow>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <Iconify icon="eva:arrow-downward-fill" width={15} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            slotProps={{
              paper: {
                sx: {
                  width: 320,           // ✅ ancho fijo del dropdown
                  maxWidth: 320,
                },
              },
            }}
            MenuListProps={{
              sx: {
                p: 0,                 // opcional: quita padding extra
              },
            }}
          >
            {runningTimers.map((t) => {
              const k = timerKey(t);
              const selected = k === timerKey(selectedTimer);

              return (
                <MenuItem
                  key={k}
                  selected={selected}
                  onClick={() => {
                    setSelectedKey(k);
                    setAnchorEl(null);
                  }}
                  sx={{
                    width: '100%',      // ✅ ocupa todo el ancho del Paper
                    py: 1,
                    alignItems: 'stretch',
                  }}
                >
                  <PersistentServerTimer serverTimer={t} nowMs={nowMs} compact />
                </MenuItem>
              );
            })}
          </Menu>

        </>
      )}
    </Box>
  );
}
