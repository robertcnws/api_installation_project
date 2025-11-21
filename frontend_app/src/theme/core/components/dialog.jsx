// ----------------------------------------------------------------------

const MuiDialog = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paper: ({ ownerState, theme }) => ({
      borderRadius: theme.shape.borderRadius * 2,
      ...(!ownerState.fullScreen && { margin: theme.spacing(2) }),
      // Futuristic background styling
      background: theme.palette.mode === 'dark'
        ? `linear-gradient(135deg,
            ${theme.palette.background.paper}98 0%,
            ${theme.palette.grey[800]}f2 100%)`
        : `linear-gradient(135deg,
            #FFFFFFfa 0%,
            ${theme.palette.grey[50]}f2 100%)`,
      backdropFilter: 'blur(20px)',
      border: `1px solid #00B8D966`,
      boxShadow: `
        0 20px 60px #00000099,
        0 0 100px #00B8D926,
        inset 0 1px 0 ${theme.palette.mode === 'dark' ? '#FFFFFF0d' : '#0000000d'}
      `,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg,
          transparent 0%,
          #00B8D9 50%,
          transparent 100%)`,
        animation: 'slideGlow 3s ease-in-out infinite',
        zIndex: 1,
      },
      '@keyframes slideGlow': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
    }),
    paperFullScreen: { borderRadius: 0 },
    root: {
      '& .MuiBackdrop-root': {
        background: `radial-gradient(circle at center,
          #00B8D91f 0%,
          #000000d9 100%)`,
        backdropFilter: 'blur(10px)',
      },
    },
  },
};

const MuiDialogTitle = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: `linear-gradient(90deg,
        ${theme.palette.mode === 'dark' ? '#00B8D91a' : '#00B8D91a'} 0%,
        transparent 100%)`,
      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#ffffff33' : '#00000033'}`,
      flexShrink: 0,
      zIndex: 2,
      position: 'relative',
      marginBottom: theme.spacing(1),
      // Enhanced title styling - only applies when NO dialog-title-icon is present
      '&:not(:has(.dialog-title-icon)) .MuiTypography-root': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        fontWeight: 600,
        '&::before': {
          content: '""',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: `linear-gradient(45deg, #00B8D9, #8E33FF)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 15px ${theme.palette.mode === 'dark' ? '#00B8D966' : '#00B8D940'}`,
          flexShrink: 0,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>')}")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '20px 20px',
        }
      },
      // When custom icon is provided
      '& .MuiTypography-root:has(.dialog-title-icon)': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        fontWeight: 600,
      },
      // Dialog title icon styling
      '& .dialog-title-icon': {
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `linear-gradient(45deg, #00B8D9, #8E33FF)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 15px ${theme.palette.mode === 'dark' ? '#00B8D966' : '#00B8D940'}`,
        flexShrink: 0,
        color: 'white',
        fontSize: 20,
      },
      // Close button styling
      '& .MuiIconButton-root': {
        color: theme.palette.text.secondary,
        '&:hover': {
          background: theme.palette.mode === 'dark' ? '#ff563020' : '#ff563010',
          color: '#FF5630',
        },
      }
    })
  },
};

const MuiDialogContent = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2, 3),
      paddingTop: theme.spacing(2),
    }),
    dividers: ({ theme }) => ({
      borderTop: 0,
      borderBottomStyle: 'dashed',
      paddingBottom: theme.spacing(3),
    }),
  },
};

const MuiDialogActions = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { disableSpacing: true },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
      '& > :not(:first-of-type)': { marginLeft: theme.spacing(1.5) },
    }),
  },
};

// ----------------------------------------------------------------------

export const dialog = {
  MuiDialog,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogActions,
};
