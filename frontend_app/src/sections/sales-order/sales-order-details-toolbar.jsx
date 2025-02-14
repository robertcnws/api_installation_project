import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { generateItemPrintablePDF } from 'src/utils/printable-pdf';
import { SalesOrderCreateProjectDialogForm } from './sales-order-create-project-dialog';

// ----------------------------------------------------------------------

export function SalesOrderDetailsToolbar({
  salesOrder,
  openCreateProjectDialog,
  setOpenCreateProjectDialog,
  backLink,
  status,
  isMobile,
  loadedUsers,
}) {

  return (
    <>
      <Stack spacing={3} direction={{ xs: 'column', md: 'row' }} sx={{ mb: { xs: 3, md: 5 } }}>
        <Stack spacing={1} direction="row" alignItems="flex-start">
          <IconButton component={RouterLink} href={backLink}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>

          <Stack spacing={0.5}>
            <Stack spacing={1} direction='row' alignItems="center">
              <Typography variant="h5"> Sales Order </Typography>
              <Label variant="soft" color="default">{salesOrder.salesorder_number}</Label>
              <Label
                variant="soft"
                color={
                  (status === 'confirmed' && 'success') ||
                  (status !== 'confirmed' && 'warning') ||
                  'default'
                }
              >
                {status}
              </Label>
            </Stack>

            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Created: {fDateTime(salesOrder.created_time)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Last Modified: {fDateTime(salesOrder.last_modified_time)}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          flexGrow={1}
          spacing={1.5}
          direction='row'
          alignItems="center"
          justifyContent="flex-end"
        >
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:folder-bold" />}
            onClick={() => { setOpenCreateProjectDialog(true) }}
          >
            Create Installation
          </Button>

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
          // onClick={() => {generateItemPrintablePDF({salesOrder, senitronItem})}}
          >
            Print
          </Button>

          {/* <Button color="inherit" variant="contained" startIcon={<Iconify icon="solar:pen-bold" />}>
            Edit
          </Button> */}
        </Stack>
      </Stack>

      {/* <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          {statusOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === status}
              onClick={() => {
                popover.onClose();
                onChangeStatus(option.value);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover> */}
      <SalesOrderCreateProjectDialogForm
        currentSalesOrder={salesOrder}
        loadedUsers={loadedUsers}
        open={openCreateProjectDialog}
        onClose={() => setOpenCreateProjectDialog(false)}
      />
    </>
  );
}
