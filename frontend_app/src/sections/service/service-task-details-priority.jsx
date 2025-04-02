import axios from 'axios';
import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';

import { listRolesAndSubroles } from 'src/utils/check-permissions';

import { CONFIG } from 'src/config-global';
import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

export function ServiceTaskDetailsPriority({ 
  service, 
  task, 
  priority, 
  setPriority, 
  setSelectedTask,
}) {

  const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

  const onChangePriority = useCallback(
    async (newPriority) => {
      const taskId = task?.service_default_task._id;
      const serviceId = service?.id;
      try {
        const promise = axios.post(`${CONFIG.apiUrl}/services/update/service/${serviceId}/task/${taskId}/change-priority/`, {
          userReporter: userLogged?.data,
          priority: newPriority,
        });
        const response = await promise;
        if (!response.data) {
          return;
        }
        setPriority(newPriority);
        setSelectedTask?.((prev) => ({
          ...prev,
          priority: newPriority,
        }));
      } catch (error) {
        console.error(error);
      }

    },
    [setPriority, setSelectedTask, task, service, userLogged]
  );

  return (
    <Stack direction="row" flexWrap="wrap" spacing={1}>
      {['low', 'medium', 'high'].map((option) => (
        <ButtonBase
          key={option}
          onClick={() => onChangePriority(option)}
          value={option}
          disabled={!listRolesAndSubroles(userLogged?.data?.user_role?.name).includes(CONFIG.roles.administrator)
          }
          sx={{
            py: 0.5,
            pl: 0.75,
            pr: 1.25,
            fontSize: 12,
            borderRadius: 1,
            lineHeight: '20px',
            textTransform: 'capitalize',
            fontWeight: 'fontWeightBold',
            boxShadow: (theme) =>
              `inset 0 0 0 2px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
            ...(option === priority && {
              boxShadow: (theme) => `inset 0 0 0 2px ${theme.vars.palette.text.primary}`,
            }),
          }}
        >
          <Iconify
            icon={
              (option === 'low' && 'solar:double-alt-arrow-down-bold-duotone') ||
              (option === 'medium' && 'solar:double-alt-arrow-right-bold-duotone') ||
              'solar:double-alt-arrow-up-bold-duotone'
            }
            sx={{
              mr: 0.5,
              ...(option === 'low' && { color: 'info.main' }),
              ...(option === 'medium' && { color: 'warning.main' }),
              ...(option === 'high' && { color: 'error.main' }),
            }}
          />

          {option}
        </ButtonBase>
      ))}
    </Stack>
  );
}
