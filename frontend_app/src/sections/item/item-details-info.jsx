import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';

import MatchGauge from 'src/components/chart/gauge-chart';
import { Table, TableBody, TableContainer } from '@mui/material';
import { TableNoData } from 'src/components/table';


// ----------------------------------------------------------------------

export function ItemDetailsInfo({ item, senitronItem }) {

  const [percentageQty, setPercentageQty] = useState(null);
  const [percentageTags, setPercentageTags] = useState(null);

  useEffect(() => {
    if (item && senitronItem) {
      let max = Math.max(parseFloat(item.stockOnHand), parseFloat(senitronItem.count));
      let min = Math.min(parseFloat(item.stockOnHand), parseFloat(senitronItem.count));
      let match = Math.floor((min / max) * 100);
      setPercentageQty(match);
      max = Math.max(parseFloat(item.stockOnHand), parseFloat(senitronItem.count));
      min = Math.min(parseFloat(item.stockOnHand), parseFloat(senitronItem.count));
      match = Math.floor((min / max) * 100);
      setPercentageTags(match);
    }
  }, [item, senitronItem]);

  const renderQty = (
    <>
      <CardHeader
        title="% Matched"
      // action={
      //   <IconButton>
      //     <Iconify icon="solar:pen-bold" />
      //   </IconButton>
      // }
      />
      <Stack direction="column" sx={{ p: 0, textAlign: 'center' }} alignItems="center">
        {item && senitronItem ? (
          <MatchGauge percentage={percentageQty || 0} />
        ) : (
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size='medium' stickyHeader>
              <TableBody>
                <TableNoData notFound={!item || !senitronItem} sx={{ maxHeight: 300 }} />
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </>
  );

  const renderTags = (
    <>
      <CardHeader
        title="Tags Count Match"
      // action={
      //   <IconButton>
      //     <Iconify icon="solar:pen-bold" />
      //   </IconButton>
      // }
      />
      {item && senitronItem ? (
        <Stack direction="column" sx={{ p: 0, textAlign: 'center' }} alignItems="center">
          <MatchGauge percentage={percentageTags || 0} />
        </Stack>
      ) : (
        <TableContainer sx={{ maxHeight: 350 }}>
          <Table size='medium' stickyHeader>
            <TableBody>
              <TableNoData notFound={!item || !senitronItem} sx={{ maxHeight: 300 }} />
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );

  return (
    <Card sx={{ heigth: '100%' }}>
      {renderQty}

      {/* <Divider sx={{ borderStyle: 'dashed' }} />

      {renderTags} */}

      {/*

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderShipping}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderPayment}  */}
    </Card>
  );
}
