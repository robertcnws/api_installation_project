import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Card } from "@mui/material";
import axios from "axios";
import { toast } from 'src/components/snackbar';

import { useProjectProfitReportsQuery } from "src/_mock/__project_profit_report";
import { CONFIG } from "src/config-global";
import { useSocketRefetch } from "src/utils/websockets";
import { DashboardContent } from "src/layouts/dashboard";
import { useDataContext } from "src/auth/context/data/data-context";

import { WelcomeReportsTypography } from "../welcome-metrics-typography";
import { ReportsSelect } from "../reports-select";
import { ReportsTable } from "../reports-table";



export function OverviewReportsView() {
    const userLogged = useMemo(
        () => JSON.parse(sessionStorage.getItem("userLogged")),
        []
    );

    const {
        loadedProjects,
    } = useDataContext();

    const {
        data: allProfitReports,
        refetch: refetchAllProfitReports,
        loading: loadingAllProfitReports,
    } = useProjectProfitReportsQuery();

    // WebSocket que fuerza refetch cuando hay cambios en el backend
    useSocketRefetch(
        `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/project-profit-reports/`,
        refetchAllProfitReports
    );

    const [reportType, setReportType] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedDateRange, setSelectedDateRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [title, setTitle] = useState("");

    const finishedProjects = useMemo(
        // () => loadedProjects?.filter((p) => p.currentStage?.name?.toLowerCase() === 'finished'),
        () => loadedProjects,
        [loadedProjects]
    );

    // Normalizar data que viene del hook (puede venir envuelta en distintos niveles)
    const normalizedReports = useMemo(() => {
        if (!allProfitReports) return [];

        // 1) Normalizar todas las posibles formas
        let baseReports = [];

        if (Array.isArray(allProfitReports)) {
            baseReports = allProfitReports;
        } else if (Array.isArray(allProfitReports?.profitReportsByDateRange)) {
            baseReports = allProfitReports.profitReportsByDateRange;
        } else if (Array.isArray(allProfitReports?.data?.profitReportsByDateRange)) {
            baseReports = allProfitReports.data.profitReportsByDateRange;
        }

        if (!baseReports.length) return [];

        // 2) Si hay finishedProjects, filtramos
        if (Array.isArray(finishedProjects) && finishedProjects.length > 0) {
            const finishedIds = new Set(
                finishedProjects.map((p) => String(p.id))
            );

            return baseReports.filter((report) =>
                finishedIds.has(String(report?.projectInfo?.id))
            );
        }

        // Si no hay filtro de proyectos terminados, devolvemos todo
        return baseReports;
    }, [allProfitReports, finishedProjects]);


    const buildTitle = useCallback(() => {
        if (!reportType) return "";

        switch (reportType.value) {
            case "currentDay":
                return `Current Day Report (${dayjs().format("MMMM D, YYYY")})`;
            case "currentWeek":
                return `Current Week Report (${dayjs().startOf("week").format("MMMM D, YYYY")} - ${dayjs().endOf("week").format("MMMM D, YYYY")})`;
            case "currentMonth":
                return `Current Month Report (${dayjs().format("MMMM YYYY")})`;
            case "currentYear":
                return `Current Year Report (${dayjs().format("YYYY")})`;
            case "previousDay":
                return `Previous Day Report (${dayjs().subtract(1, 'day').format("MMMM D, YYYY")})`;
            case "previousWeek":
                return `Previous Week Report (${dayjs().subtract(1, 'week').startOf("week").format("MMMM D, YYYY")} - ${dayjs().subtract(1, 'week').endOf("week").format("MMMM D, YYYY")})`;
            case "previousMonth":
                return `Previous Month Report (${dayjs().subtract(1, 'month').format("MMMM YYYY")})`;
            case "previousYear":
                return `Previous Year Report (${dayjs().subtract(1, 'year').format("YYYY")})`;
            case "customMonth":
                if (selectedMonth && selectedYear) {
                    return `Month Report - ${selectedMonth.label} ${selectedYear.label}`;
                }
                return "Month Report";
            case "customYear":
                if (selectedYear) {
                    return `Year Report - ${selectedYear.label}`;
                }
                return "Year Report";
            case "dateRange":
                if (selectedDateRange.startDate && selectedDateRange.endDate) {
                    return `Date Range Report (${dayjs(selectedDateRange.startDate).format("MMMM D, YYYY")} - ${dayjs(selectedDateRange.endDate).format("MMMM D, YYYY")})`;
                }
                return "Date Range Report";
            default:
                return "";
        }
    }, [
        reportType,
        selectedMonth,
        selectedYear,
        selectedDateRange,
    ]);

    // Filtro principal (reactivo) en base a tipo + filtros + data
    const filteredData = useMemo(() => {
        if (!reportType) return [];

        const now = dayjs();

        const getReportDate = (report) => {
            const workOrders = report?.projectInfo?.install_work_orders;

            // 1) Si existen work orders → usar la fecha más antigua
            if (Array.isArray(workOrders) && workOrders.length > 0) {
                const dates = workOrders
                    .map((wo) => wo?.start_date)
                    .filter(Boolean)
                    .map((d) => dayjs(d))
                    .filter((d) => d.isValid());

                if (dates.length > 0) {
                    return dates.reduce((oldest, current) =>
                        current.isBefore(oldest) ? current : oldest
                    );
                }
            }

            // 2) Si no hay work orders válidos → fallback anterior
            const fallback =
                report?.projectInfo?.created_time ||
                report?.start_date ||
                report?.createdTime?.split(" ")[0];

            return dayjs(fallback);
        };

        switch (reportType.value) {
            case "currentDay": {
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.isSame(now, "day");
                });
            }

            case "currentWeek": {
                const startWeek = now.startOf("week");
                const endWeek = now.endOf("week");
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    if (!d.isValid()) return false;
                    const t = d.valueOf();
                    return t >= startWeek.valueOf() && t <= endWeek.valueOf();
                });
            }

            case "currentMonth": {
                const year = now.year();
                const month = now.month();
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === year && d.month() === month;
                });
            }

            case "currentYear": {
                const year = now.year();
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === year;
                });
            }

            case "previousDay": {
                const previousDay = now.subtract(1, 'day');
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.isSame(previousDay, "day");
                });
            }

            case "previousWeek": {
                const startPrevWeek = now.subtract(1, 'week').startOf("week");
                const endPrevWeek = now.subtract(1, 'week').endOf("week");
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    if (!d.isValid()) return false;
                    const t = d.valueOf();
                    return t >= startPrevWeek.valueOf() && t <= endPrevWeek.valueOf();
                });
            }

            case "previousMonth": {
                const previousMonthDate = now.subtract(1, 'month');
                const year = previousMonthDate.year();
                const month = previousMonthDate.month();
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === year && d.month() === month;
                });
            }

            case "previousYear": {
                const previousYear = now.subtract(1, 'year').year();
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === previousYear;
                });
            }

            case "customMonth": {
                if (!selectedMonth || !selectedYear) return [];
                const year = selectedYear.value;
                const monthIndex = selectedMonth.value - 1; // dayjs month: 0-11
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return (
                        d.isValid() &&
                        d.year() === year &&
                        d.month() === monthIndex
                    );
                });
            }

            case "customYear": {
                if (!selectedYear) return [];
                const year = selectedYear.value;
                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === year;
                });
            }

            case "dateRange": {
                const { startDate, endDate } = selectedDateRange;
                if (!startDate || !endDate) return [];

                const startRange = dayjs(startDate).startOf("day");
                const endRange = dayjs(endDate).endOf("day");

                return normalizedReports.filter((r) => {
                    const d = getReportDate(r);
                    if (!d.isValid()) return false;
                    const t = d.valueOf();
                    return t >= startRange.valueOf() && t <= endRange.valueOf();
                });
            }

            default:
                return [];
        }
    }, [reportType, normalizedReports, selectedMonth, selectedYear, selectedDateRange]);

    const isTableVisible = useMemo(() => (
        Boolean(reportType?.value === 'currentDay') ||
        Boolean(reportType?.value === 'currentWeek') ||
        Boolean(reportType?.value === 'currentMonth') ||
        Boolean(reportType?.value === 'currentYear') ||
        Boolean(reportType?.value === 'previousDay') ||
        Boolean(reportType?.value === 'previousWeek') ||
        Boolean(reportType?.value === 'previousMonth') ||
        Boolean(reportType?.value === 'previousYear') ||
        (reportType?.value === 'customMonth' && selectedMonth && selectedYear) ||
        (reportType?.value === 'customYear' && selectedYear) ||
        (reportType?.value === 'dateRange' && selectedDateRange?.startDate && selectedDateRange?.endDate)
    ), [reportType, selectedMonth, selectedYear, selectedDateRange]);

    const [loadingTriggerAllProfits, setLoadingTriggerAllProfits] = useState(false);

    const handleTriggerAllProfits = useCallback(
        async () => {

            setLoadingTriggerAllProfits(true);

            const promise = axios.post(`${CONFIG.apiUrl}/projects/update/projects/trigger-profit-rebuild/`);

            await promise;

            setLoadingTriggerAllProfits(false);

            toast.success('Trigger profits rebuilt success!');

            refetchAllProfitReports?.();

        }, [refetchAllProfitReports]);

    // Actualizar título cuando cambian filtros
    useEffect(() => {
        setTitle(buildTitle());
    }, [reportType, selectedMonth, selectedYear, selectedDateRange, buildTitle]);

    return (
        <DashboardContent maxWidth="xl">
            <WelcomeReportsTypography
                userLogged={userLogged}
                onRefresh={handleTriggerAllProfits}
                loading={loadingTriggerAllProfits}
            />

            <Card sx={{ p: 2, boxShadow: 3 }}>
                <ReportsSelect
                    allProfitReports={normalizedReports}
                    loadingAllProfitReports={loadingAllProfitReports}
                    reportType={reportType}
                    setReportType={setReportType}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedDateRange={selectedDateRange}
                    setSelectedDateRange={setSelectedDateRange}
                />

                {isTableVisible && (
                    <ReportsTable
                        filteredData={filteredData}
                        title={title}
                    />
                )}
            </Card>
        </DashboardContent>
    );
}
