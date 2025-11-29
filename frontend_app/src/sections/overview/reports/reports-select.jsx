import { useState } from "react";
import { LoadingButton } from "@mui/lab";
import { Autocomplete, Box, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const reportsType = [
    { value: "currentDay", label: "Current Day Report" },
    { value: "currentWeek", label: "Current Week Report" },
    { value: "currentMonth", label: "Current Month Report" },
    { value: "currentYear", label: "Current Year Report" },
    { value: "customMonth", label: "Month Report" },
    { value: "customYear", label: "Year Report" },
    { value: "dateRange", label: "Date Range Report" },
];

const monthsOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

const yearsOptions = Array.from(new Array(5), (v, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
});

export function ReportsSelect({
    allProfitReports, // por si quieres mostrar cantidad, loading, etc.
    loadingAllProfitReports,
    reportType,
    setReportType,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedDateRange,
    setSelectedDateRange,
}) {
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);

    const handleReset = () => {
        setSelectedMonth(null);
        setSelectedYear(null);
        setSelectedDateRange({ startDate: null, endDate: null });
    };

    const isDisabledButton =
        !reportType ||
        (reportType.value === "customMonth" && (!selectedMonth || !selectedYear)) ||
        (reportType.value === "customYear" && !selectedYear) ||
        (reportType.value === "dateRange" &&
            (!selectedDateRange.startDate || !selectedDateRange.endDate));

    return (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                mb: 2,
                flexDirection: { xs: "column", md: "row" },
                width: "100%",
            }}
        >
            {/* Select tipo de reporte */}
            <Box sx={{ width: "100%" }}>
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

            {/* Month / Year */}
            {reportType &&
                (reportType.value === "customMonth" ||
                    reportType.value === "customYear") && (
                    <Box sx={{ display: "flex", gap: 2, width: reportType.value === "customYear" ? "25%" : "100%" }}>
                        {reportType.value === "customMonth" && (
                            <Box sx={{ width: "50%" }}>
                                <Autocomplete
                                    options={monthsOptions}
                                    getOptionLabel={(option) => option.label}
                                    isOptionEqualToValue={(option, value) =>
                                        option.value === value.value
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select Month"
                                            variant="outlined"
                                        />
                                    )}
                                    value={selectedMonth}
                                    onChange={(event, newValue) => setSelectedMonth(newValue)}
                                />
                            </Box>
                        )}

                        <Box sx={{ width: reportType.value === "customYear" ? "100%" : "50%" }}>
                            <Autocomplete
                                options={yearsOptions}
                                getOptionLabel={(option) => option.label}
                                isOptionEqualToValue={(option, value) =>
                                    option.value === value.value
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Year"
                                        variant="outlined"
                                    />
                                )}
                                value={selectedYear}
                                onChange={(event, newValue) => setSelectedYear(newValue)}
                            />
                        </Box>
                    </Box>
                )}

            {/* Date range */}
            {reportType && reportType.value === "dateRange" && (
                <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
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

            {/* Botón Generate (solo UX, el filtro ya es reactivo) */}
            {/* {reportType && (
                <Box
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        width: { xs: "100%", md: "auto" },
                    }}
                >
                    <LoadingButton
                        variant="contained"
                        color="primary"
                        disabled={isDisabledButton || loadingAllProfitReports}
                        // El filtro ya sucede automáticamente;
                        // si quieres puedes usar onClick para tracking o nada.
                        onClick={() => { }}
                    >
                        Generate
                    </LoadingButton>
                </Box>
            )} */}
        </Box>
    );
}
