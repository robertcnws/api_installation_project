import { LoadingButton } from "@mui/lab";
import { Autocomplete, Box, TextField } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState, useCallback } from "react";
import dayjs from "dayjs";

const reportsType = [
    { value: 'currentDay', label: 'Current Day Report' },
    { value: 'currentWeek', label: 'Current Week Report' },
    { value: 'currentMonth', label: 'Current Month Report' },
    { value: 'currentYear', label: 'Current Year Report' },
    { value: 'customMonth', label: 'Month Report' },
    { value: 'customYear', label: 'Year Report' },
    { value: 'dateRange', label: 'Date Range Report' },
];

const monthsOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const yearsOptions = Array.from(new Array(5), (v, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
});

export function ReportsSelect({
    allProfitReports,
    loadingAllProfitReports,
    reportType,
    setReportType,
    setFilteredData,
    setTitle,
}) {
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedDateRange, setSelectedDateRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);

    const isDisabledButton = (
        !reportType ||
        (reportType.value === 'customMonth' && (!selectedMonth || !selectedYear)) ||
        (reportType.value === 'dateRange' && (!selectedDateRange.startDate || !selectedDateRange.endDate)) ||
        (reportType.value === 'customYear' && !selectedYear)
    );

    const handleReset = () => {
        setSelectedMonth(null);
        setSelectedYear(null);
        setSelectedDateRange({ startDate: null, endDate: null });
        setFilteredData([]);
    };

    // helper para sacar la fecha del reporte usando projectInfo.start_date
    const getReportDate = (report) => {
        const s = report?.projectInfo?.start_date || report?.start_date
        return dayjs(s);
    };

    const handleFilterData = useCallback(() => {
        if (!reportType || !allProfitReports) return;

        const now = dayjs();
        let filtered = [];
        let title = '';
        const initialData = allProfitReports?.filter(
            (p) => p.projectInfo.start_date !== null && p.projectInfo.duration > 0
        ) || [];

        switch (reportType.value) {
            case 'currentDay': {
                filtered = initialData?.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.isSame(now, 'day');
                });
                title = `Daily Report - ${now.format('MMMM D, YYYY')}`;
                break;
            }

            case 'currentWeek': {
                // semana actual (según locale, usualmente domingo-sábado)
                const startWeek = now.startOf('week');
                const endWeek = now.endOf('week');

                filtered = initialData?.filter((r) => {
                    const d = getReportDate(r);
                    if (!d.isValid()) return false;
                    const t = d.valueOf();
                    return t >= startWeek.valueOf() && t <= endWeek.valueOf();
                });
                title = `Weekly Report - ${startWeek.format('MMM D')} to ${endWeek.format('MMM D, YYYY')}`;
                break;
            }

            case 'currentMonth': {
                const year = now.year();
                const month = now.month(); // 0-11
                filtered = initialData?.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === year && d.month() === month;
                });
                title = `Monthly Report - ${now.format('MMMM YYYY')}`;
                break;
            }

            case 'currentYear': {
                const year = now.year();
                filtered = initialData?.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === year;
                });
                title = `Yearly Report - ${year}`;
                break;
            }

            case 'customMonth': {
                if (!selectedMonth || !selectedYear) {
                    filtered = [];
                    break;
                }
                const year = selectedYear.value;
                const monthIndex = selectedMonth.value - 1; // dayjs month: 0-11

                filtered = initialData?.filter((r) => {
                    const d = getReportDate(r);
                    return (
                        d.isValid() &&
                        d.year() === year &&
                        d.month() === monthIndex
                    );
                });
                title = `Monthly Report - ${selectedMonth.label} ${year}`;
                break;
            }

            case 'customYear': {
                if (!selectedYear) {
                    filtered = [];
                    break;
                }
                const year = selectedYear.value;

                filtered = initialData?.filter((r) => {
                    const d = getReportDate(r);
                    return d.isValid() && d.year() === year;
                });
                title = `Yearly Report - ${year}`;
                break;
            }

            case 'dateRange': {
                const { startDate, endDate } = selectedDateRange;
                if (!startDate || !endDate) {
                    filtered = [];
                    break;
                }

                const startRange = dayjs(startDate).startOf('day');
                const endRange = dayjs(endDate).endOf('day');

                filtered = initialData?.filter((r) => {
                    const d = getReportDate(r);
                    if (!d.isValid()) return false;
                    const t = d.valueOf();
                    return t >= startRange.valueOf() && t <= endRange.valueOf();
                });
                title = `Report from ${startRange.format('MMM D, YYYY')} to ${endRange.format('MMM D, YYYY')}`;
                break;
            }

            default:
                filtered = [];
                title = '';
                break;
        }

        setFilteredData(filtered);
        setTitle(title);
    }, [
        reportType,
        allProfitReports,
        selectedMonth,
        selectedYear,
        selectedDateRange,
        setFilteredData,
        setTitle,
    ]);

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                flexDirection: { xs: 'column', md: 'row' },
                width: '100%',
            }}
        >
            {/* Tipo de reporte */}
            <Box sx={{ width: '100%' }}>
                <Autocomplete
                    options={reportsType}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => (
                        <TextField {...params} label="Select Report Type" variant="outlined" />
                    )}
                    value={reportType}
                    onChange={(event, newValue) => {
                        setReportType(newValue);
                        handleReset();
                    }}
                />
            </Box>

            {/* Month / Year selectors */}
            {reportType && (reportType.value === 'customMonth' || reportType.value === 'customYear') && (
                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    {reportType.value === 'customMonth' && (
                        <Box sx={{ width: '50%' }}>
                            <Autocomplete
                                options={monthsOptions}
                                getOptionLabel={(option) => option.label}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Month" variant="outlined" />
                                )}
                                value={selectedMonth}
                                onChange={(event, newValue) => setSelectedMonth(newValue)}
                            />
                        </Box>
                    )}
                    <Box sx={{ width: '50%' }}>
                        <Autocomplete
                            options={yearsOptions}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            renderInput={(params) => (
                                <TextField {...params} label="Select Year" variant="outlined" />
                            )}
                            value={selectedYear}
                            onChange={(event, newValue) => setSelectedYear(newValue)}
                        />
                    </Box>
                </Box>
            )}

            {/* Date range selectors */}
            {reportType && reportType.value === 'dateRange' && (
                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    {/* START DATE */}
                    <DatePicker
                        label="Start Date"
                        open={openStart}
                        onOpen={() => setOpenStart(true)}
                        onClose={() => setOpenStart(false)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        sx={{ width: "50%" }}
                        maxDate={selectedDateRange.endDate}
                        value={selectedDateRange.startDate}
                        onChange={(newValue) =>
                            setSelectedDateRange((prev) => ({ ...prev, startDate: newValue }))
                        }
                        slotProps={{
                            textField: {
                                onClick: () => setOpenStart(true),
                            },
                        }}
                    />

                    {/* END DATE */}
                    <DatePicker
                        label="End Date"
                        open={openEnd}
                        onOpen={() => setOpenEnd(true)}
                        onClose={() => setOpenEnd(false)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        sx={{ width: "50%" }}
                        minDate={selectedDateRange.startDate}
                        value={selectedDateRange.endDate}
                        onChange={(newValue) =>
                            setSelectedDateRange((prev) => ({ ...prev, endDate: newValue }))
                        }
                        slotProps={{
                            textField: {
                                onClick: () => setOpenEnd(true),
                            },
                        }}
                    />
                </Box>
            )}

            {/* Botón Generate */}
            {reportType && (
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        width: { xs: '100%', md: 'auto' },
                    }}
                >
                    <LoadingButton
                        loading={loadingAllProfitReports}
                        variant="contained"
                        color="primary"
                        disabled={isDisabledButton}
                        onClick={handleFilterData}
                    >
                        Generate
                    </LoadingButton>
                </Box>
            )}
        </Box>
    );
}
