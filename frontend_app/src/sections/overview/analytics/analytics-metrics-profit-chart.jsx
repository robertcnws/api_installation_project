import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { Chart } from "src/components/chart";

// allProfitReports puede venir como:
// - array directo
// - { profitReportsByDateRange: [...] }
// - { data: { profitReportsByDateRange: [...] } }

function getOldestStartDate(report) {
    const workOrders = report?.projectInfo?.install_work_orders;
    if (!Array.isArray(workOrders) || workOrders.length === 0) return null;

    // Extraer fechas válidas
    const dates = workOrders
        .map((wo) => wo?.start_date)
        .filter(Boolean)
        .map((d) => dayjs(d))
        .filter((d) => d.isValid());

    if (dates.length === 0) return null;

    // Retornar la más antigua
    return dates.reduce((oldest, current) =>
        current.isBefore(oldest) ? current : oldest
    );
}


export function AnalyticsMetricsProfitChart({ monthRange, syncedReports, isMobile }) {
    const theme = useTheme();

    // Normalizar la data de entrada a un simple array de reports
    const reports = useMemo(() => {
        if (!syncedReports) return [];

        if (Array.isArray(syncedReports)) {
            return syncedReports;
        }

        if (Array.isArray(syncedReports?.profitReportsByDateRange)) {
            return syncedReports.profitReportsByDateRange;
        }

        if (Array.isArray(syncedReports?.data?.profitReportsByDateRange)) {
            return syncedReports.data.profitReportsByDateRange;
        }

        return [];
    }, [syncedReports]);

    // Helper para formatear en K / M (para labels numéricos)
    const formatShort = (rawVal) => {
        const val = Number(rawVal);
        if (!Number.isFinite(val) || val === 0) return "0";

        const abs = Math.abs(val);
        if (abs >= 1_000_000) {
            return `${(val / 1_000_000).toFixed(1)}M`;
        }
        if (abs >= 1_000) {
            return `${(val / 1_000).toFixed(1)}K`;
        }
        return val.toFixed(0);
    };

    // Construir últimos 12 meses con totales por tipo
    const monthlyData = useMemo(() => {

        const base = Array.from({ length: monthRange }, (_, idx) => {
            const m = dayjs()
                .subtract(monthRange - 1 - idx, "month")
                .startOf("month");

            return {
                key: m.format("YYYY-MM"),
                label: m.format("MMM YYYY"),
                projectAmount: 0,
                installationAmount: 0,
                installationCost: 0,
                installationProfit: 0,
            };
        });

        const buckets = [...base];
        const keyToIndex = new Map(buckets.map((b, index) => [b.key, index]));

        reports.forEach((r) => {
            const oldestStart = getOldestStartDate(r);

            if (!oldestStart || !oldestStart.isValid()) return;

            const monthKey = oldestStart.startOf("month").format("YYYY-MM");
            const idx = keyToIndex.get(monthKey);
            if (idx === undefined) return;

            const bucket = buckets[idx];

            bucket.projectAmount += Number(r.projectAmount || 0);
            bucket.installationAmount += Number(r.installationAmount || 0);
            bucket.installationCost += Number(r.installationCost || 0);
            bucket.installationProfit += Number(r.installationProfit || 0);
        });

        return buckets;
    }, [reports, monthRange]);


    const chartSeries = useMemo(
        () => [
            {
                name: "Project Amount",
                data: monthlyData.map((m) => m.projectAmount),
            },
            {
                name: "Installation Amount",
                data: monthlyData.map((m) => m.installationAmount),
            },
            {
                name: "Installation Cost",
                data: monthlyData.map((m) => m.installationCost),
            },
            {
                name: "Installation Profit",
                data: monthlyData.map((m) => m.installationProfit),
            },
        ],
        [monthlyData]
    );

    const chartOptions = useMemo(
        () => ({
            chart: {
                type: "line",
                toolbar: { show: true },
                zoom: { enabled: false },
            },

            stroke: {
                curve: "smooth",
                width: isMobile ? 2 : 3,
            },

            markers: {
                size: isMobile ? 4 : 5,
                strokeWidth: 2,
                strokeColors: theme.palette.background.paper,
                hover: {
                    sizeOffset: 1,
                },
            },

            dataLabels: {
                enabled: false, // para que no se sature; tooltip muestra valores
            },

            xaxis: {
                categories: monthlyData.map((m) => m.label), // "MMM YYYY"
                labels: {
                    rotate: -30,
                    style: {
                        fontSize: isMobile ? "10px" : "11px",
                        fontWeight: 500,
                    },
                },
                axisBorder: {
                    show: true,
                },
                axisTicks: {
                    show: true,
                },
            },

            yaxis: {
                labels: {
                    formatter: (val) => formatShort(val),
                    style: {
                        fontSize: "11px",
                        fontWeight: 500,
                    },
                },
            },

            grid: {
                strokeDashArray: 3,
            },

            colors: [
                theme.palette.primary.main,   // Project Amount
                theme.palette.success.main,   // Installation Amount
                theme.palette.warning.main,   // Installation Cost
                theme.palette.primary.light,  // Installation Profit
            ],

            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: (rawVal) => {
                        const val = Number(rawVal);
                        if (!Number.isFinite(val)) return "";
                        const full = val.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });
                        return `$${full}`; // valor "real" completo
                    },
                },
            },

            legend: {
                show: true,
                position: "bottom",
            },
        }),
        [monthlyData, theme, isMobile]
    );

    return (
        <Box sx={{ p: 2 }}>
            <Chart
                type="line"
                series={chartSeries}
                options={chartOptions}
                height={300}
            />
        </Box>
    );
}
