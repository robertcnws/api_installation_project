import { useContext, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { Link, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import dayjs from 'dayjs';

import { fIsAfter, fDurationStats } from 'src/utils/format-time';
import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Label } from 'src/components/label';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { Chart } from 'src/components/chart';
import { useProjectProfitReportsQuery } from 'src/_mock/__project_profit_report';
import { fCurrency } from 'src/utils/format-number';
import { LoadingContext } from 'src/auth/context/loading-context';
import { useSocketRefetch } from 'src/utils/websockets';
import { AnalyticsMetricsProfitChart } from './analytics-metrics-profit-chart';
import { AnalyticsMetricsPercentChart } from './analytics-metrics-percent-chart';

// ----------------------------------------------------------------------

export function AnalyticsMetricsProfitSummary({
  finishedProjects,
  allProfitReports,
  loadingAllProfitReports,
  refetchAllProfitReports,
  icon,
  title,
  color = 'primary',
  sx,
  ...other
}) {
  const theme = useTheme();
  const router = useRouter();
  const { isMobile } = useContext(LoadingContext);

  

  useSocketRefetch(
    `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/project-profit-reports/`,
    refetchAllProfitReports
  );

  const syncedReports = useMemo(() => allProfitReports.filter(
    (report) => finishedProjects.some(fp => fp.id === report.projectId)
  ), [allProfitReports, finishedProjects]);

  const finishedCount = useMemo(() => syncedReports?.length || 0, [syncedReports]);

  const {
    minProfit,
    minProjectId,
    minProjectName,
    maxProfit,
    maxProjectId,
    maxProjectName,
    averageProfit,
    minInstallAmount,
    minInstallAmountProjectId,
    minInstallAmountProjectName,
    maxInstallAmount,
    maxInstallAmountProjectId,
    maxInstallAmountProjectName,
    averageInstallAmount,
    minInstallCost,
    minInstallCostProjectId,
    minInstallCostProjectName,
    maxInstallCost,
    maxInstallCostProjectId,
    maxInstallCostProjectName,
    averageInstallCost,
    minProjectAmount,
    minProjectAmountProjectId,
    minProjectAmountProjectName,
    maxProjectAmount,
    maxProjectAmountProjectId,
    maxProjectAmountProjectName,
    averageProjectAmount,
  } = useMemo(() => {
    if (loadingAllProfitReports) {
      return {};
    }

    const minP = syncedReports.reduce(
      (min, report) => report.installationProfit < min.installationProfit ? report : min,
      syncedReports[0]
    );

    const maxP = syncedReports.reduce(
      (max, report) => report.installationProfit > max.installationProfit ? report : max,
      syncedReports[0]
    );

    const totalProfit = syncedReports.reduce((total, report) => total + report.installationProfit, 0);
    const averageP = (totalProfit / syncedReports.length);

    const minIA = syncedReports.reduce(
      (min, report) => report.installationAmount < min.installationAmount ? report : min,
      syncedReports[0]
    );

    const maxIA = syncedReports.reduce(
      (max, report) => report.installationAmount > max.installationAmount ? report : max,
      syncedReports[0]
    );

    const totalIA = syncedReports.reduce((total, report) => total + report.installationAmount, 0);
    const averageIA = (totalIA / syncedReports.length);

    const minIC = syncedReports.reduce(
      (min, report) => report.installationCost < min.installationCost ? report : min,
      syncedReports[0]
    );

    const maxIC = syncedReports.reduce(
      (max, report) => report.installationCost > max.installationCost ? report : max,
      syncedReports[0]
    );

    const totalIC = syncedReports.reduce((total, report) => total + report.installationCost, 0);
    const averageIC = (totalIC / syncedReports.length);

    const minPA = syncedReports.reduce(
      (min, report) => report.projectAmount < min.projectAmount ? report : min,
      syncedReports[0]
    );

    const maxPA = syncedReports.reduce(
      (max, report) => report.projectAmount > max.projectAmount ? report : max,
      syncedReports[0]
    );

    const totalPA = syncedReports.reduce((total, report) => total + report.projectAmount, 0);
    const averagePA = (totalPA / syncedReports.length);

    return {
      minProfit: minP.installationProfit,
      minProjectId: minP.projectId,
      minProjectName: minP.projectInfo?.name,
      maxProfit: maxP.installationProfit,
      maxProjectId: maxP.projectId,
      maxProjectName: maxP.projectInfo?.name,
      averageProfit: averageP,
      minInstallAmount: minIA.installationAmount,
      minInstallAmountProjectId: minIA.projectId,
      minInstallAmountProjectName: minIA.projectInfo?.name,
      maxInstallAmount: maxIA.installationAmount,
      maxInstallAmountProjectId: maxIA.projectId,
      maxInstallAmountProjectName: maxIA.projectInfo?.name,
      averageInstallAmount: averageIA,
      minInstallCost: minIC.installationCost,
      minInstallCostProjectId: minIC.projectId,
      minInstallCostProjectName: minIC.projectInfo?.name,
      maxInstallCost: maxIC.installationCost,
      maxInstallCostProjectId: maxIC.projectId,
      maxInstallCostProjectName: maxIC.projectInfo?.name,
      averageInstallCost: averageIC,
      minProjectAmount: minPA.projectAmount,
      minProjectAmountProjectId: minPA.projectId,
      minProjectAmountProjectName: minPA.projectInfo?.name,
      maxProjectAmount: maxPA.projectAmount,
      maxProjectAmountProjectId: maxPA.projectId,
      maxProjectAmountProjectName: maxPA.projectInfo?.name,
      averageProjectAmount: averagePA,
    };
  }, [loadingAllProfitReports, syncedReports]);

  const monthRange = 12;

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: theme.customShadows?.z4 ?? theme.shadows[2],
        bgcolor: alpha(theme.palette[color].main, 0.03),
        color: theme.palette.text.primary,
        gap: 2,
        ...sx,
      }}
      {...other}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>

        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette[color].main, 0.16),
          }}
        >
          {icon || (
            <Iconify icon="uil:chart-line" width={22} height={22} />
          )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Average, Min & Max cost/profit metrics
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Label color={finishedCount > 0 ? 'success' : 'default'} variant="soft">
          {finishedCount} installations
        </Label>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Layout: métricas + chart lado a lado */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 2,
        }}
      >
        {/* Grid de 3 columnas en desktop, 1 en mobile */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, minmax(0, 1fr))',
            },
            columnGap: 2,
            rowGap: 2,
            width: '100%',
          }}
        >
          {/* ====== ROW 1: PROFIT ====== */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfit type="Avg profit" value={averageProfit} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Min"
              subTitle="profit"
              projectId={minProjectId}
              projectName={minProjectName}
              profit={minProfit}
              router={router}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Max"
              subTitle="profit"
              projectId={maxProjectId}
              projectName={maxProjectName}
              profit={maxProfit}
              router={router}
            />
          </Box>

          {isMobile && (
            <Divider sx={{ gridColumn: '1 / -1', my: 1 }} />
          )}

          {/* ====== ROW 2: PROJECT AMOUNT ====== */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfit type="Avg project amount" value={averageProjectAmount} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Min"
              subTitle="project amount"
              projectId={minProjectAmountProjectId}
              projectName={minProjectAmountProjectName}
              profit={minProjectAmount}
              router={router}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Max"
              subTitle="project amount"
              projectId={maxProjectAmountProjectId}
              projectName={maxProjectAmountProjectName}
              profit={maxProjectAmount}
              router={router}
            />
          </Box>

          {isMobile && (
            <Divider sx={{ gridColumn: '1 / -1', my: 1 }} />
          )}

          {/* ====== ROW 3: INSTALLATION AMOUNT ====== */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfit type="Avg installation amount" value={averageInstallAmount} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Min"
              subTitle="installation amount"
              projectId={minInstallAmountProjectId}
              projectName={minInstallAmountProjectName}
              profit={minInstallAmount}
              router={router}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Max"
              subTitle="installation amount"
              projectId={maxInstallAmountProjectId}
              projectName={maxInstallAmountProjectName}
              profit={maxInstallAmount}
              router={router}
            />
          </Box>

          {isMobile && (
            <Divider sx={{ gridColumn: '1 / -1', my: 1 }} />
          )}

          {/* ====== ROW 4: INSTALLATION COST ====== */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfit type="Avg installation cost" value={averageInstallCost} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Min"
              subTitle="installation cost"
              projectId={minInstallCostProjectId}
              projectName={minInstallCostProjectName}
              profit={minInstallCost}
              router={router}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <ItemProfitTop
              topType="Max"
              subTitle="installation cost"
              projectId={maxInstallCostProjectId}
              projectName={maxInstallCostProjectName}
              profit={maxInstallCost}
              router={router}
            />
          </Box>
        </Box>
      </Box>

      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} sx={{ mt: 3, gap: 2, width: '100%' }}>

        <Box sx={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette[color].main, 0.16),
              }}
            >
              <Iconify icon="uil:chart-line" width={22} height={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {`Last ${monthRange} months`}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Statistics chart
              </Typography>
            </Box>
          </Stack>
          <AnalyticsMetricsProfitChart
          monthRange={monthRange}
            syncedReports={syncedReports}
            isMobile={isMobile}
          />
        </Box>

        <Box sx={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette[color].main, 0.16),
              }}
            >
              <Iconify icon="mdi:chart-arc" width={22} height={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                Historic profit & cost
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Percentage (%) charts
              </Typography>
            </Box>
          </Stack>
          <AnalyticsMetricsPercentChart
            syncedReports={syncedReports}
            isMobile={isMobile}
          />
        </Box>

      </Box>

      {/* Fondo decorativo */}
      <SvgColor
        src={`${CONFIG.assetsDir}/assets/background/shape-square.svg`}
        sx={{
          top: -32,
          right: -80,
          width: 220,
          height: 220,
          opacity: 0.18,
          position: 'absolute',
          color: theme.palette[color].lighter,
        }}
      />
    </Card>
  );
}

function ItemProfitTop({ topType, subTitle, projectId, projectName, profit, router }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        fontSize: 14,
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {`${topType} ${subTitle}`}
        </Typography>

        <Link
          variant="caption"
          color="inherit"
          noWrap
          sx={{
            mt: 0.25,
            color: 'text.primary',
            cursor: projectId ? 'pointer' : 'default',
            fontSize: '11px',
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'inline-block',
          }}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (!projectId) return;
            localStorage.setItem('projectId', projectId);
            router.push(paths.dashboard.project.details(projectId));
          }}
        >
          {projectId ? `${projectName || 'Unnamed'}` : '—'}
        </Link>
      </Box>

      <Label variant="outlined" color={profit > 0 ? 'success' : 'warning'} sx={{ mr: { xs: 0, md: 20 } }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {fCurrency(profit) || 'N/A'}
        </Typography>
      </Label>
    </Box>
  )
}

function ItemProfit({ type, value }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 14,
        width: '100%',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {type}
      </Typography>
      <Label variant="outlined" color={value > 0 ? 'success' : 'warning'} sx={{ px: 1.2, mr: { xs: 0, md: 20 } }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {fCurrency(value) || 'N/A'}
        </Typography>
      </Label>
    </Box>
  )
}
