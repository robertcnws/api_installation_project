import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';
import { TableNoData } from 'src/components/table';
import { Table, TableBody, TableContainer } from '@mui/material';

// ----------------------------------------------------------------------

export function AnalyticsOrderTimeline({ title, subheader, list, isMobile, onViewDetails, ...other }) {

  const [timelineItems, setTimelineItems] = React.useState(null);

  const [notFound, setNotFound] = React.useState(null);

  useEffect(() => {
    const newItems = [];
    list?.forEach((item) => {
      const newItem = {
        id: item.itemNumber,
        title: item.text,
        time: item.text.includes('stock on hand') ? item.dateActualStockOnHand :
          item.text.includes('status') ? item.dateActualStatusZoho :
            item.text.includes('quantity') ? item.dateActualQuantity :
              item.text.includes('created') && item.text.includes('Senitron') ? item.dateActualQuantity :
                item.text.includes('created') && item.text.includes('Zoho') ? item.dateActualStockOnHand : item.dateActualStatusSenitron,
        type: item.text.includes('created') || item.text.includes('added') ? 'order2' :
          item.text.includes('changed') ? 'order4' :
            item.text.includes('updated') ? 'order3' : 'order5',
      };
      newItems.push(newItem);
    });
    setTimelineItems(newItems);
    setNotFound(list?.length === 0);
  }, [list]);

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Box sx={{ maxHeight: 390, overflowY: 'auto' }}>
        {timelineItems?.length > 0 ? (
          <Timeline
            sx={{
              m: 0,
              p: 3,
              [`& .${timelineItemClasses.root}:before`]: {
                flex: 0,
                padding: 0,
              },
            }}
          >
            {timelineItems?.slice(0, 50).map((item, index) => (
              <Item key={`${item.id}-${index}`} item={item} lastItem={index === list.length - 1} onViewDetails={onViewDetails} />
            ))}
          </Timeline>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <TableContainer>
              <Table>
                <TableBody>
                  <TableNoData
                    notFound={notFound}
                    sx={{
                      width: '100%',
                      height: '110%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </Card>
  );
}


function Item({ item, lastItem, onViewDetails, ...other }) {

  const mainText = item?.title.split('->')[0];
  const subText = item?.title.split('->')[1];

  return (
    <TimelineItem {...other} sx={{ cursor: 'pointer' }} onClick={() => onViewDetails(item.id)}>
      <TimelineSeparator>
        <TimelineDot
          color={
            (item.type === 'order1' && 'primary') ||
            (item.type === 'order2' && 'success') ||
            (item.type === 'order3' && 'info') ||
            (item.type === 'order4' && 'warning') ||
            'error'
          }
        />
        {lastItem ? null : <TimelineConnector />}
      </TimelineSeparator>

      <TimelineContent>
        <Typography variant="subtitle2">
          {mainText}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          {subText}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fDateTime(item.time)}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );
}
