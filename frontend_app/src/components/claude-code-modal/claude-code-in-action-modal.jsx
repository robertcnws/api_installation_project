import { useState, useEffect, forwardRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const DEMO_ACTIONS = [
  {
    id: 1,
    title: 'Analyzing User Permissions',
    description: 'Claude Code is examining role-based access controls and user permission patterns',
    icon: 'mdi:shield-account',
    color: '#00B8D9',
    duration: 2000,
  },
  {
    id: 2,
    title: 'Optimizing Database Queries',
    description: 'Enhancing MongoDB queries for better performance and scalability',
    icon: 'mdi:database-search',
    color: '#8E33FF',
    duration: 2500,
  },
  {
    id: 3,
    title: 'Refactoring Components',
    description: 'Modernizing React components with improved state management',
    icon: 'mdi:react',
    color: '#00A76F',
    duration: 3000,
  },
  {
    id: 4,
    title: 'Implementing Real-time Updates',
    description: 'Adding WebSocket integration for live data synchronization',
    icon: 'mdi:lightning-bolt',
    color: '#FFAB00',
    duration: 2200,
  },
  {
    id: 5,
    title: 'Code Quality Analysis',
    description: 'Running comprehensive code review and suggesting improvements',
    icon: 'mdi:code-tags-check',
    color: '#22C55E',
    duration: 2800,
  },
];

export function ClaudeCodeInActionModal({ open, onClose }) {
  const theme = useTheme();
  const [currentAction, setCurrentAction] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentAction(0);
      setProgress(0);
      setIsCompleted(false);
      return undefined;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentAction < DEMO_ACTIONS.length - 1) {
            setCurrentAction((prevAction) => prevAction + 1);
            return 0;
          }
          setIsCompleted(true);
          return 100;
        }
        return prev + 2;
      });
    }, (DEMO_ACTIONS[currentAction]?.duration || 2000) / 50);

    return () => {
      clearInterval(timer);
    };
  }, [open, currentAction]);

  const currentTask = DEMO_ACTIONS[currentAction];

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 600, md: 700 },
    maxHeight: '90vh',
    overflow: 'auto',
    outline: 'none',
  };

  const backgroundStyle = {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg,
          ${alpha(theme.palette.background.paper, 0.98)} 0%,
          ${alpha(theme.palette.grey[800], 0.95)} 100%)`
      : `linear-gradient(135deg,
          ${alpha('#FFFFFF', 0.98)} 0%,
          ${alpha(theme.palette.grey[50], 0.95)} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha('#00B8D9', 0.4)}`,
    borderRadius: 3,
    boxShadow: `
      0 20px 60px ${alpha('#000000', 0.6)},
      0 0 100px ${alpha('#00B8D9', 0.15)},
      inset 0 1px 0 ${alpha(theme.palette.mode === 'dark' ? '#FFFFFF' : '#000000', 0.05)}
    `,
    position: 'relative',
    overflow: 'hidden',
  };

  const glowEffect = {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: `linear-gradient(90deg,
        transparent 0%,
        ${currentTask?.color || '#00B8D9'} 50%,
        transparent 100%)`,
      animation: 'slideGlow 3s ease-in-out infinite',
    },
    '@keyframes slideGlow': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropProps={{
        sx: {
          background: `radial-gradient(circle at center,
            ${alpha('#00B8D9', 0.12)} 0%,
            ${alpha('#000000', 0.85)} 100%)`,
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <Box sx={modalStyle}>
        <AnimatePresence>
          {open && (
            <m.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <Paper sx={{ ...backgroundStyle, ...glowEffect }}>
              {/* Header */}
              <Box
                sx={{
                  p: 3,
                  pb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <m.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: `linear-gradient(45deg, #00B8D9, #8E33FF)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 20px ${alpha('#00B8D9', 0.5)}`,
                      }}
                    >
                      <Iconify
                        icon="mdi:robot"
                        sx={{
                          color: 'white',
                          fontSize: 24
                        }}
                      />
                    </Box>
                  </m.div>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      Claude Code in Action
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mt: 0.5
                      }}
                    >
                      AI-Powered Development Assistant
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={onClose}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      background: alpha('#FF5630', 0.1),
                      color: '#FF5630',
                    },
                  }}
                >
                  <Iconify icon="mingcute:close-line" />
                </IconButton>
              </Box>

              {/* Content */}
              <Box sx={{ p: 3 }}>
                {!isCompleted ? (
                  <m.div
                    key={currentAction}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Current Task */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <m.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '8px',
                              background: `linear-gradient(45deg, ${currentTask.color}, ${alpha(currentTask.color, 0.7)})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 0 15px ${alpha(currentTask.color, 0.4)}`,
                            }}
                          >
                            <Iconify
                              icon={currentTask.icon}
                              sx={{ color: 'white', fontSize: 20 }}
                            />
                          </Box>
                        </m.div>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              mb: 0.5,
                              color: theme.palette.text.primary
                            }}
                          >
                            {currentTask.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              opacity: 0.9
                            }}
                          >
                            {currentTask.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${currentAction + 1}/${DEMO_ACTIONS.length}`}
                          size="small"
                          sx={{
                            background: alpha(currentTask.color, 0.2),
                            color: currentTask.color,
                            fontWeight: 600,
                          }}
                        />
                      </Box>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(currentTask.color, 0.1),
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${currentTask.color}, ${alpha(currentTask.color, 0.8)})`,
                              borderRadius: 4,
                              boxShadow: `0 0 10px ${alpha(currentTask.color, 0.5)}`,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            mt: 0.5,
                            display: 'block'
                          }}
                        >
                          {Math.round(progress)}% Complete
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Queue */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 2,
                          color: theme.palette.text.secondary,
                          fontWeight: 600
                        }}
                      >
                        Action Queue
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {DEMO_ACTIONS.map((action, index) => (
                          <m.div
                            key={action.id}
                            initial={{ opacity: 0.3 }}
                            animate={{
                              opacity: index === currentAction ? 1 : index < currentAction ? 0.6 : 0.3,
                              scale: index === currentAction ? 1.02 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                background: index === currentAction
                                  ? alpha(action.color, 0.15)
                                  : alpha(theme.palette.background.neutral || theme.palette.grey[100], 0.7),
                                border: `1px solid ${
                                  index === currentAction
                                    ? alpha(action.color, 0.4)
                                    : alpha(theme.palette.divider, 0.2)
                                }`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              <Iconify
                                icon={index < currentAction ? 'mdi:check-circle' : action.icon}
                                sx={{
                                  color: index < currentAction
                                    ? '#22C55E'
                                    : index === currentAction
                                      ? action.color
                                      : theme.palette.text.disabled,
                                  fontSize: 20
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  flex: 1,
                                  color: index === currentAction
                                    ? theme.palette.text.primary
                                    : theme.palette.text.secondary,
                                  fontWeight: index === currentAction ? 600 : 500,
                                  opacity: index === currentAction ? 1 : 0.8,
                                }}
                              >
                                {action.title}
                              </Typography>
                              {index < currentAction && (
                                <Chip
                                  label="Done"
                                  size="small"
                                  sx={{
                                    background: alpha('#22C55E', 0.2),
                                    color: '#22C55E',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              )}
                            </Box>
                          </m.div>
                        ))}
                      </Box>
                    </Box>
                  </m.div>
                ) : (
                  <m.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        background: `radial-gradient(circle, ${alpha('#22C55E', 0.1)} 0%, transparent 70%)`,
                        borderRadius: 2,
                      }}
                    >
                      <m.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Iconify
                          icon="mdi:check-circle"
                          sx={{
                            fontSize: 60,
                            color: '#22C55E',
                            mb: 2,
                            filter: `drop-shadow(0 0 20px ${alpha('#22C55E', 0.5)})`,
                          }}
                        />
                      </m.div>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: '#22C55E',
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        Mission Complete!
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 3
                        }}
                      >
                        Claude Code has successfully analyzed and optimized your codebase.
                        Ready for the next challenge!
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={onClose}
                        sx={{
                          background: `linear-gradient(45deg, #22C55E, #00A76F)`,
                          color: 'white',
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          '&:hover': {
                            background: `linear-gradient(45deg, #00A76F, #22C55E)`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 10px 20px ${alpha('#22C55E', 0.3)}`,
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Awesome!
                      </Button>
                    </Box>
                  </m.div>
                )}
              </Box>
              </Paper>
            </m.div>
          )}
        </AnimatePresence>
      </Box>
    </Modal>
  );
}