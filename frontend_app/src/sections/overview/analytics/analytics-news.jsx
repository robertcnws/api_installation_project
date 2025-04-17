import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { Badge, Typography } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import AnimatedIcon from 'src/components/animate/animated-icon';

// ----------------------------------------------------------------------

export function AnalyticsNews({ title, subheader, list, onClick, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 1 }} />
      <Badge sx={{ position: 'absolute', top: 20, right: 16 }} color="error" variant="dot">
        <Iconify icon="eva:bell-fill" width={20} height={20} /> {list.length}
      </Badge>

      <Scrollbar sx={{ maxHeight: 195, minHeight: 195 }}>
        <Box sx={{ width: '100%' }}>
          {list.map((item) => (
            <Item key={item.id} item={item} onClick={() => onClick(item)} />
          ))}
        </Box>
      </Scrollbar>

      {/* <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
        >
          View all
        </Button>
      </Box> */}
    </Card>
  );
}

function Item({ item, sx, onClick, ...other }) {
  return (
    <Box
      sx={{
        py: 2,
        px: 3,
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        cursor: 'pointer',
        ...sx,
      }}
      onClick={onClick}
      {...other}
    >
      {/* <Avatar
        variant="rounded"
        alt={item.title}
        src={item.coverUrl}
        sx={{ width: 48, height: 48, flexShrink: 0 }}
      /> */}

      <ListItemText
        primary={(
          <Box sx={{
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
            <Box sx={{ ml: -3, mr: -3 }}>
              <AnimatedIcon icon='uil:bell' color='error' />
            </Box>
            <Typography component="span" sx={{ color: 'text.primary' }} variant="subtitle2">
              {item.projectDefaultTask.project_default_task.name}
            </Typography>
          </Box>
        )}
        secondary={(
          <Box
            component="span"
            sx={{
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
              ml: 4,
            }}>
            <Typography component="span" sx={{ color: 'text.primary' }} variant="caption">
              {item.notes}
            </Typography>
          </Box>
        )}
        primaryTypographyProps={{ noWrap: true, typography: 'subtitle2' }}
        secondaryTypographyProps={{ mt: 0.5, noWrap: true, component: 'span' }}
      />

      <Box sx={{ flexShrink: 0, color: 'text.disabled', typography: 'caption' }}>
        {item.project.name}
      </Box>
    </Box>
  );
}
