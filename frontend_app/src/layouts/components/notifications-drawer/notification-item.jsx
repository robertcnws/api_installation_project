import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fToNow } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { FileThumbnail } from 'src/components/file-thumbnail';
import { useCallback } from 'react';
import axios from 'axios';

// ----------------------------------------------------------------------

export function NotificationItem({ notification, drawer }) {

  const router = useRouter();

  const handleLink = useCallback(
    (module, element = 'list') => {
      router.push(
        module === 'zoho_item' && element === 'list' ? paths.dashboard.item.list :
          module === 'zoho_item' && element === 'analytics' ? paths.dashboard.general.analytics :
            module === 'zoho_shipment' && element === 'list' ? paths.dashboard.shipment.list :
              module === 'zoho_shipment' && element === 'listBySku' ? paths.dashboard.shipment.listBySku :
                module === 'zoho_shipment' && element === 'liveMonitor' ? paths.dashboard.general.liveMonitor :
                  module === 'create_system_user' || module === 'update_system_user' || module === 'delete_system_user' || module === 'delete_system_users' ? paths.dashboard.user.list :
                    module === 'system_timeline' ? paths.dashboard.general.analytics :
                      module === 'senitron_item_assets' && element === 'list' ? paths.dashboard.item.list :
                        module === 'senitron_item_assets' && element === 'analytics' ? paths.dashboard.general.analytics :
                          module === 'senitron_item_assets_logs' ? paths.dashboard.general.liveMonitor : ''
      );
      if (!notification.read) {
        axios.post(`${CONFIG.apiUrl}/api_senitron/notification/mark_as_read/${notification.id}/`);
      }
      drawer.onFalse();
    },
    [router, notification, drawer]
  );

  const renderAvatar = (
    <ListItemAvatar>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'background.neutral' }}
      >
        <Box
          component="img"
          src={`${CONFIG.assetsDir}/assets/icons/notification/${(notification.notification.module === 'zoho_shipment' && 'ic-shipment') ||
            (notification.notification.module === 'zoho_item' && 'ic-item') ||
            (notification.notification.module === 'senitron_item_assets' && 'ic-assets') ||
            (notification.notification.module === 'system_timeline' && 'ic-system-timeline') ||
            (notification.notification.module === 'create_system_user' && 'ic-new-user') ||
            (notification.notification.module === 'update_system_user' && 'ic-update-user') ||
            (notification.notification.module === 'delete_system_user' && 'ic-delete-user') ||
            (notification.notification.module === 'delete_system_users' && 'ic-delete-users') ||
            (notification.notification.module === 'senitron_item_assets_logs' && 'ic-assets-logs')}.svg`}
          sx={{ width: 24, height: 24 }}
        />
      </Stack>
    </ListItemAvatar>
  );

  const renderText = (
    <ListItemText
      disableTypography
      primary={reader(`User ${notification.username} ${notification.notification.info}`)}
      secondary={
        <Stack
          direction="row"
          alignItems="center"
          sx={{ typography: 'caption', color: 'text.disabled' }}
          divider={
            <Box
              sx={{
                width: 2,
                height: 2,
                bgcolor: 'currentColor',
                mx: 0.5,
                borderRadius: '50%',
              }}
            />
          }
        >
          {fToNow(notification.createdAt)}
          {notification.notification.module === 'zoho_shipment' && ' - Shipment' ||
            notification.notification.module === 'zoho_item' && ' - Item' ||
            notification.notification.module === 'senitron_item_assets' && ' - Senitron Assets' ||
            notification.notification.module === 'create_system_user' && ' - New User' ||
            notification.notification.module === 'update_system_user' && ' - Update User' ||
            notification.notification.module === 'delete_system_user' && ' - Delete User' ||
            notification.notification.module === 'delete_system_users' && ' - Delete Users' ||
            notification.notification.module === 'senitron_item_assets_logs' && ' - Senitron Logs'}
        </Stack>
      }
    />
  );

  const renderUnReadBadge = !notification.read && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  const friendAction = (
    <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
      <Button size="small" variant="contained">
        Accept
      </Button>
      <Button size="small" variant="outlined">
        Decline
      </Button>
    </Stack>
  );

  const projectAction = (
    <Stack alignItems="flex-start">
      <Box
        sx={{
          p: 1.5,
          my: 1.5,
          borderRadius: 1.5,
          color: 'text.secondary',
          bgcolor: 'background.neutral',
        }}
      >
        {reader(
          `<p><strong>@Jaydon Frankie</strong> feedback by asking questions or just leave a note of appreciation.</p>`
        )}
      </Box>

      <Button size="small" variant="contained">
        Reply
      </Button>
    </Stack>
  );

  const fileAction = (
    <Stack
      spacing={1}
      direction="row"
      sx={{
        pl: 1,
        p: 1.5,
        mt: 1.5,
        borderRadius: 1.5,
        bgcolor: 'background.neutral',
      }}
    >
      <FileThumbnail file="http://localhost:8080/httpsdesign-suriname-2015.mp3" />

      <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }} flexGrow={1} sx={{ minWidth: 0 }}>
        <ListItemText
          disableTypography
          primary={
            <Typography variant="subtitle2" component="div" sx={{ color: 'text.secondary' }} noWrap>
              design-suriname-2015.mp3
            </Typography>
          }
          secondary={
            <Stack
              direction="row"
              alignItems="center"
              sx={{ typography: 'caption', color: 'text.disabled' }}
              divider={
                <Box
                  sx={{
                    mx: 0.5,
                    width: 2,
                    height: 2,
                    borderRadius: '50%',
                    bgcolor: 'currentColor',
                  }}
                />
              }
            >
              <span>2.3 GB</span>
              <span>30 min ago</span>
            </Stack>
          }
        />

        <Button size="small" variant="outlined">
          Download
        </Button>
      </Stack>
    </Stack>
  );

  const tagsAction = (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1.5 }}>
      <Label variant="outlined" color="info">
        Design
      </Label>
      <Label variant="outlined" color="warning">
        Dashboard
      </Label>
      <Label variant="outlined">
        Design system
      </Label>
    </Stack>
  );

  const paymentAction = (
    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
      <Button size="small" variant="contained">
        Pay
      </Button>
      <Button size="small" variant="outlined">
        Decline
      </Button>
    </Stack>
  );

  const notificationAction = (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1.5 }}>
      {notification.notification.module !== 'senitron_item_assets_logs' && (
        <Label variant="outlined" color="info" sx={{ cursor: 'pointer' }} onClick={() => handleLink(notification.notification.module)}>
          See in List
        </Label>
      )}
      {notification.notification.module === 'zoho_shipment' && (
        <Label variant="outlined" color="success" sx={{ cursor: 'pointer' }} onClick={() => handleLink(notification.notification.module, 'listBySku')}>
          See in SKUs
        </Label>
      )}
      {(notification.notification.module === 'zoho_item' ||
        notification.notification.module === 'system_timeline' ||
        notification.notification.module === 'senitron_item_assets') && (
          <Label variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleLink(notification.notification.module, 'analytics')}>
            See in Analytics
          </Label>
        )}
      {(notification.notification.module === 'zoho_shipment' ||
        notification.notification.module === 'senitron_item_assets_logs') && (
          <Label variant="outlined" color="error" sx={{ cursor: 'pointer' }} onClick={() => handleLink(notification.notification.module, 'liveMonitor')}>
            See in Live Monitor
          </Label>
        )}
    </Stack>
  );

  return (
    <ListItemButton
      disableRipple
      sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
      }}
    >
      {renderUnReadBadge}

      {renderAvatar}

      <Stack sx={{ flexGrow: 1 }}>
        {renderText}
        {notificationAction}
        {/* {notification.type === 'friend' && friendAction}
        {notification.type === 'project' && projectAction}
        {notification.type === 'file' && fileAction}
        {notification.type === 'tags' && tagsAction}
        {notification.type === 'payment' && paymentAction} */}
      </Stack>
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function reader(data) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: data }}
      sx={{
        ml: 1,
        mr: 1,
        mb: 0.5,
        '& p': { typography: 'body2', m: 0 },
        '& a': { color: 'inherit', textDecoration: 'none' },
        '& strong': { typography: 'subtitle2' },
      }}
    />
  );
}
