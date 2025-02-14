import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { Divider, Typography } from '@mui/material';

// ----------------------------------------------------------------------

export function ProjectDetailsToolbar({
  project,
  backLink,
  editLink,
  openEdit,
  setOpenEdit,
  type,
  sx,
  ...other
}) {
  const popover = usePopover();

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
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <Typography variant="h6">INSTALLATION {project?.name}</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />

        {(type === 'project' || type === 'tasks') && (
          <Tooltip title={`Edit ${type}`} arrow>
            <IconButton onClick={() => setOpenEdit(true)}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title='Close installation' arrow>
          <Button
            component={RouterLink}
            href={backLink}
            startIcon={<Iconify icon="mingcute:close-fill" />}
            sx={{ ml: 0, borderRadius: 10, maxWidth: 1 }}
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
