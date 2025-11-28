import React, { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Chart } from "src/components/chart";

// allProfitReports puede venir como:
// - array directo
// - { profitReportsByDateRange: [...] }
// - { data: { profitReportsByDateRange: [...] } }

export function AnalyticsMetricsPercentChart({ allProfitReports, isMobile }) {
  const theme = useTheme();

  // Normalizar data de entrada
  const reports = useMemo(() => {
    if (!allProfitReports) return [];

    if (Array.isArray(allProfitReports)) {
      return allProfitReports;
    }

    if (Array.isArray(allProfitReports?.profitReportsByDateRange)) {
      return allProfitReports.profitReportsByDateRange;
    }

    if (Array.isArray(allProfitReports?.data?.profitReportsByDateRange)) {
      return allProfitReports.data.profitReportsByDateRange;
    }

    return [];
  }, [allProfitReports]);

  // Totales globales
  const totals = useMemo(() => {
    let totalProject = 0;
    let totalInstallAmount = 0;
    let totalInstallCost = 0;
    let totalInstallProfit = 0;

    reports.forEach((r) => {
      totalProject += Number(r.projectAmount || 0) || 0;
      totalInstallAmount += Number(r.installationAmount || 0) || 0;
      totalInstallCost += Number(r.installationCost || 0) || 0;
      totalInstallProfit += Number(r.installationProfit || 0) || 0;
    });

    return {
      totalProject,
      totalInstallAmount,
      totalInstallCost,
      totalInstallProfit,
    };
  }, [reports]);

  const {
    totalProject,
    totalInstallAmount,
    totalInstallCost,
    totalInstallProfit,
  } = totals;

  // === PIE 1: Installation Amount vs Remaining Project Amount ===
  const pie1Series = useMemo(() => {
    const install = totalInstallAmount > 0 ? totalInstallAmount : 0;
    const remainingRaw = totalProject - totalInstallAmount;
    const remaining = remainingRaw > 0 ? remainingRaw : 0;

    // evitar todo 0 (Apex se pone raro con todo 0)
    if (install === 0 && remaining === 0) {
      return [1, 0]; // 100% instalación "dummy"
    }

    return [install, remaining];
  }, [totalProject, totalInstallAmount]);

  const pie1Options = useMemo(
    () => ({
      chart: {
        type: "donut",
      },
      labels: ["Installation Amount", "Remaining Project Amount"],
      legend: {
        show: true,
        position: "bottom",
        fontSize: "11px",
        markers: {
          width: 10,
          height: 10,
        },
      },
      colors: [
        theme.palette.success.main,   // Installation Amount
        theme.palette.primary.main,   // Remaining Project Amount
      ],
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(1)}%`,
        style: {
          fontSize: "11px",
          fontWeight: 600,
        },
      },
      tooltip: {
        y: {
          formatter: (val) => {
            const num = Number(val);
            if (!Number.isFinite(num)) return "";
            return num.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          },
        },
      },
      stroke: {
        width: 1,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "60%",
          },
        },
      },
    }),
    [theme]
  );

  // === PIE 2: Installation Cost vs Installation Profit (ambos respecto a Installation Amount) ===
  const pie2Series = useMemo(() => {
    const cost = totalInstallCost > 0 ? totalInstallCost : 0;
    const profit = totalInstallProfit > 0 ? totalInstallProfit : 0;

    if (cost === 0 && profit === 0) {
      return [1, 0]; // dummy
    }

    return [cost, profit];
  }, [totalInstallCost, totalInstallProfit]);

  const pie2Options = useMemo(
    () => ({
      chart: {
        type: "donut",
      },
      labels: ["Installation Cost", "Installation Profit"],
      legend: {
        show: true,
        position: "bottom",
        fontSize: "11px",
        markers: {
          width: 10,
          height: 10,
        },
      },
      colors: [
        theme.palette.warning.main,    // Installation Cost
        theme.palette.primary.light,   // Installation Profit
      ],
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(1)}%`,
        style: {
          fontSize: "11px",
          fontWeight: 600,
        },
      },
      tooltip: {
        y: {
          formatter: (val) => {
            const num = Number(val);
            if (!Number.isFinite(num)) return "";
            return num.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          },
        },
      },
      stroke: {
        width: 1,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "60%",
          },
        },
      },
    }),
    [theme]
  );

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={4}
        alignItems="center"
        justifyContent="center"
      >
        {/* Pie 1 */}
        <Box sx={{ width: isMobile ? "100%" : "50%" }}>
          <Typography variant="subtitle1" sx={{ mb: 1, textAlign: "center" }}>
            Installation Amount vs Project Amount
          </Typography>
          <Chart
            type="donut"
            series={pie1Series}
            options={pie1Options}
            height={300}
          />
        </Box>

        {/* Pie 2 */}
        <Box sx={{ width: isMobile ? "100%" : "50%" }}>
          <Typography variant="subtitle1" sx={{ mb: 1, textAlign: "center" }}>
            Installation Cost vs Installation Profit
          </Typography>
          <Chart
            type="donut"
            series={pie2Series}
            options={pie2Options}
            height={300}
          />
        </Box>
      </Stack>
    </Box>
  );
}
