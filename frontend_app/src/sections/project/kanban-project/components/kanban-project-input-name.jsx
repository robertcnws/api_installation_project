import React, { forwardRef } from 'react';

import InputBase, { inputBaseClasses } from '@mui/material/InputBase';

export const KanbanProjectInputName = forwardRef(({ sx, error, ...other }, ref) => (
    <InputBase
      ref={ref}
      sx={{
        [`&.${inputBaseClasses.root}`]: {
          py: 0.75,
          borderRadius: 1,
          typography: 'h6',
          borderWidth: 1,
          borderStyle: 'solid',
          // borderColor: 'transparent',
          transition: (theme) => theme.transitions.create(['padding-left', 'border-color']),
          [`&.${inputBaseClasses.focused}`]: { pl: 0.75, borderColor: !error ? 'text.primary' : 'error.main' },
        },
        [`& .${inputBaseClasses.input}`]: { typography: 'h6' },
        ...sx,
      }}
      {...other}
    />
  )
);
