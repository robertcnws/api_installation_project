import axios from 'axios';
import { m } from 'framer-motion';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';

import { useDataContext } from 'src/auth/context/data/data-context';

import { NotificationItem } from './notification-item';




// ----------------------------------------------------------------------

export function NotificationsDrawer({ sx, ...other }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    loadedNotifications: userNotifications,
    refetchNotifications,
  } = useDataContext();

  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    if (refetchNotifications) {
      refetchNotifications();
    }
    setNotifications(userNotifications?.filter((notif) => notif.user.username === userLogged?.data.username) || []);
  }, [refetchNotifications, userNotifications, userLogged]);

  useEffect(() => {
    if (userNotifications) {
      setNotifications(userNotifications?.filter((notif) => notif.user.username === userLogged?.data.username));
    }
  }, [userNotifications, userLogged]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${CONFIG.apiHost}/api/projects/ws/project-notification-users/`);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
        setNotifications((prevData) => {
          const existingItemIndex = prevData.findIndex(item => String(item.id) === String(message.item.id));
          if (existingItemIndex !== -1) {
            const updatedData = [...prevData];
            updatedData[existingItemIndex] = message.item;
            return updatedData;
          }
          const pData = prevData?.filter((notif) => notif.user.username === userLogged?.data.username && String(notif.id) !== String(message.item.id));
          return [message.item, ...pData];
        });
      }
      else if (message.type === 'deleted') {
        setNotifications((prevData) => prevData.filter(item => String(item.id) !== String(message.item.id)));
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userLogged]);


  const drawer = useBoolean();

  const [filteredNotifications, setFilteredNotifications] = useState(null);

  const [currentTab, setCurrentTab] = useState('all');

  useEffect(() => {
    if (currentTab === 'all') {
      setFilteredNotifications(notifications?.filter((notif) => notif.user.username === userLogged?.data.username));
    }
  }, [notifications, currentTab, userLogged]);

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 'all') {
      setFilteredNotifications(notifications);
    }
    else if (newValue === 'unread') {
      setFilteredNotifications(notifications?.filter((notif) => notif.user.username === userLogged?.data.username).filter((item) => item.read === false));
    }
    else if (newValue === 'archived') {
      setFilteredNotifications(notifications?.filter((notif) => notif.user.username === userLogged?.data.username).filter((item) => item.read === true));
    }
  }, [notifications, userLogged]);

  const totalUnRead = notifications?.filter((notif) => notif.user.username === userLogged?.data.username).filter((item) => item.read === false).length;

  const totalRead = notifications?.filter((notif) => notif.user.username === userLogged?.data.username).filter((item) => item.read === true).length;

  const handleMarkAllAsRead = useCallback(
    async () => {
      setNotifications(notifications?.filter((notif) => notif.user.username === userLogged?.data.username).map((notification) => ({ ...notification, read: true })));
      await axios.post(`${CONFIG.apiUrl}/projects/mark-read/notifications/`, {
        userReporter: userLogged?.data,
        notificationIds: notifications?.filter((notif) => notif.user.username === userLogged?.data.username).map((notification) => notification.id),
      });
    }, [notifications, userLogged]);


  const handleDeleteNotifications = useCallback(
    async () => {
      const selectedNotifications = notifications?.filter((notif) => notif.user.username === userLogged?.data.username);
      const deletedNotifications = currentTab === 'all' ? selectedNotifications :
        currentTab === 'unread' ? selectedNotifications.filter((item) => item.read === false) :
          selectedNotifications.filter((item) => item.read === true);
      const finalNotifications = deletedNotifications.map((notification) => notification.id);
      const response = await axios.delete(`${CONFIG.apiUrl}/projects/delete/notifications/`, {
        data: {
          userReporter: userLogged?.data,
          notificationIds: finalNotifications,
        }
      });
      if (response.status) {
        setCurrentTab('all');
      }
    }, [notifications, userLogged, currentTab]);

  const TABS = [
    { value: 'all', label: 'All', count: notifications?.filter((notif) => notif.user.username === userLogged?.data.username).length },
    { value: 'unread', label: 'Unread', count: totalUnRead },
    { value: 'archived', label: 'Archived', count: totalRead },
  ];

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 50 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!totalUnRead && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={drawer.onFalse} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      <IconButton>
        <Iconify icon="solar:settings-bold-duotone" />
      </IconButton>
    </Stack>
  );

  const renderTabs = (
    <CustomTabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
      {TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={
                (tab.value === 'unread' && 'info') ||
                (tab.value === 'archived' && 'success') ||
                'default'
              }
            >
              {tab.count}
            </Label>
          }
        />
      ))}
    </CustomTabs>
  );

  const renderList = (
    <Scrollbar>
      <Box component="ul">
        {filteredNotifications?.map((notification) => (
          <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
            <NotificationItem notification={notification} drawer={drawer} />
          </Box>
        ))}
      </Box>
    </Scrollbar>
  );

  // const [dataLoaded, setDataLoaded] = useState(false);

  // useEffect(() => {
  //   if (
  //     notifications
  //   ) {
  //     setDataLoaded(true);
  //   } else {
  //     setDataLoaded(false);
  //   }
  // }, [
  //   notifications
  // ]);

  // if (!dataLoaded) {
  //   return (
  //     <Box
  //       sx={{
  //         width: '350px',
  //         display: 'flex',
  //         flexDirection: 'column',
  //         alignItems: 'center',
  //         justifyContent: 'center',
  //         height: '80vh',
  //         margin: 'auto'
  //       }}
  //     >
  //       <Typography variant="body2" sx={{ mb: 1 }}>
  //         Loading Data...
  //       </Typography>
  //       <LinearProgress
  //         key="error"
  //         sx={{
  //           mb: 2,
  //           width: '100%',
  //           '& .MuiLinearProgress-bar': {
  //             backgroundColor: 'black',
  //           },
  //           backgroundColor: '#e0e0e0',
  //         }}
  //       />
  //     </Box>
  //   );
  // }

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <SvgIcon>
            {/* https://icon-sets.iconify.design/solar/bell-bing-bold-duotone/ */}
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420, maxHeight: '96%' } }}
      >
        {renderHead}

        {renderTabs}

        {renderList}

        <Box sx={{ p: 1 }}>
          <Button fullWidth size="large" color='error' variant="outlined" onClick={handleDeleteNotifications} disabled={filteredNotifications?.length === 0}>
            Delete {currentTab === 'all' ? 'All' : currentTab === 'unread' ? 'Unread' : 'Archived'} Notifications
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
