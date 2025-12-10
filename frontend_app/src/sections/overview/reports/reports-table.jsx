import {
    Autocomplete,
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    MenuList,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";

import { CustomPopover, usePopover } from "src/components/custom-popover";
import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import {
    useTable,
    rowInPage,
    TableNoData,
} from "src/components/table";
import { TableCustomPaginationZohoStyleRow } from "src/components/table/table-pagination-custom-zoho-style-row";
import { useBoolean } from "src/hooks/use-boolean";
import { fCurrency, fNumber } from "src/utils/format-number";
import { ReportsEditRow } from "./reports-edit-row";
import { exportedRows, handleExportCSV, handleExportPDF, handleExportXLSX } from "./helpers-export";

export function ReportsTable({ filteredData, title }) {
    const table = useTable({ defaultDense: true });
    const popover = usePopover();
    const openEdit = useBoolean();
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedType, setSelectedType] = useState(null);

    const finalData = useMemo(() => {
        if (!selectedType) {
            return filteredData;
        }
        return filteredData.filter(
            (report) => report.workingType?.toLowerCase() === selectedType.value?.toLowerCase()
        );
    }, [filteredData, selectedType]);

    const {
        totalDuration,
        totalProjectAmount,
        totalInstallationAmount,
        totalInstallationCost,
        totalInstallationProfit,
    } = useMemo(
        () =>
            finalData.reduce(
                (acc, report) => {
                    acc.totalDuration += report.projectInfo?.duration || 0;
                    acc.totalProjectAmount += report.projectAmount || 0;
                    acc.totalInstallationAmount += report.installationAmount || 0;
                    acc.totalInstallationCost += report.installationCost || 0;
                    acc.totalInstallationProfit += report.installationProfit || 0;
                    return acc;
                },
                {
                    totalDuration: 0,
                    totalProjectAmount: 0,
                    totalInstallationAmount: 0,
                    totalInstallationCost: 0,
                    totalInstallationProfit: 0,
                }
            ),
        [finalData]
    );

    const {
        totalDurationByPage,
        totalProjectAmountByPage,
        totalInstallationAmountByPage,
        totalInstallationCostByPage,
        totalInstallationProfitByPage,
    } = useMemo(() => {
        const pageRows = rowInPage(finalData, table.page, table.rowsPerPage);

        return pageRows.reduce(
            (acc, report) => {
                acc.totalDurationByPage += report.projectInfo?.duration || 0;
                acc.totalProjectAmountByPage += report.projectAmount || 0;
                acc.totalInstallationAmountByPage += report.installationAmount || 0;
                acc.totalInstallationCostByPage += report.installationCost || 0;
                acc.totalInstallationProfitByPage += report.installationProfit || 0;
                return acc;
            },
            {
                totalDurationByPage: 0,
                totalProjectAmountByPage: 0,
                totalInstallationAmountByPage: 0,
                totalInstallationCostByPage: 0,
                totalInstallationProfitByPage: 0,
            }
        );
    }, [finalData, table.page, table.rowsPerPage]);

    const handleOpenEditRow = useCallback(
        (row) => {
            setSelectedRow(row);
            openEdit.onTrue();
        },
        [openEdit]
    );

    const exportFileName = selectedType ?
        `Reports_${title.replace(/\s+/g, "_")}_${selectedType.label.replace(/\s+/g, "_")}` :
        `Reports_${title.replace(/\s+/g, "_")}`;
    const exportRows = exportedRows(finalData);

    const handleExport = useCallback((type) => {
        popover.onClose();
        const finalTitle = selectedType ?
            `${title} - ${selectedType.label}` :
            title;
        if (type === "csv") {
            handleExportCSV(exportFileName, exportRows);
        } else if (type === "xlsx") {
            handleExportXLSX(exportFileName, exportRows);
        } else if (type === "pdf") {
            handleExportPDF(finalTitle, exportFileName, exportRows);
        }
    }, [exportFileName, exportRows, title, popover, selectedType]);

    return (
        <>
            <Box sx={{ mt: 2, width: "100%" }}>
                <Box
                    sx={{
                        mb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {selectedType ?
                            `${title} - ${selectedType.label}` :
                            title
                        }
                    </Typography>
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1,
                    }}>
                        <Autocomplete
                            options={[
                                { value: 'onhouse', label: 'On House' },
                                { value: 'subcontractor', label: 'Subcontractor' },
                            ]}
                            size="small"
                            sx={{ width: 180, mr: 1 }}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            value={selectedType}
                            onChange={(event, newValue) => setSelectedType(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Crew Type"
                                    variant="outlined"
                                />
                            )}
                        />
                        {finalData?.length > 0 && (
                            <React.Fragment key='download-reports'>

                                <IconButton onClick={popover.onOpen}>
                                    <Iconify icon="mdi:download" width={24} height={24} />
                                </IconButton>
                                <CustomPopover
                                    open={popover.open}
                                    onClose={popover.onClose}
                                    anchorEl={popover.anchorEl}
                                >
                                    <Box sx={{ p: 1 }}>
                                        <MenuList>
                                            <MenuItem key="save-csv" onClick={() => handleExport("csv")}>
                                                <Typography>Save as CSV</Typography>
                                            </MenuItem>
                                            <MenuItem key="save-xls" onClick={() => handleExport("xlsx")}>
                                                <Typography>Save as XLSX</Typography>
                                            </MenuItem>
                                            <MenuItem key="save-pdf" onClick={() => handleExport("pdf")}>
                                                <Typography>Save as PDF</Typography>
                                            </MenuItem>
                                        </MenuList>
                                    </Box>
                                </CustomPopover>
                            </React.Fragment>
                        )}
                    </Box>
                </Box>

                <Scrollbar>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader size={table.dense ? "small" : "medium"}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>CLIENT</TableCell>
                                    <TableCell>DAYS</TableCell>
                                    <TableCell>PROJECT AMOUNT</TableCell>
                                    <TableCell>INSTALLATION AMOUNT</TableCell>
                                    <TableCell>INSTALLATION COST</TableCell>
                                    <TableCell>INSTALLATION PROFIT</TableCell>
                                    <TableCell>TYPE</TableCell>
                                    <TableCell>NOTES</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {finalData?.length === 0 && (
                                    <TableNoData notFound />
                                )}
                                {finalData?.slice(
                                    table.page * table.rowsPerPage,
                                    table.page * table.rowsPerPage + table.rowsPerPage
                                ).map((report) => (
                                    <TableRow
                                        hover
                                        key={report.id}
                                        sx={{ cursor: "pointer" }}
                                        onClick={() => handleOpenEditRow(report)}
                                    >
                                        <TableCell>{report.projectInfo.name}</TableCell>
                                        <TableCell>{fNumber(report.projectInfo.duration)}</TableCell>
                                        <TableCell
                                            sx={{
                                                color:
                                                    report.projectAmount < 0 ? "warning.dark" : "inherit",
                                            }}
                                        >
                                            {fCurrency(report.projectAmount)}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color:
                                                    report.installationAmount < 0
                                                        ? "warning.dark"
                                                        : "inherit",
                                            }}
                                        >
                                            {fCurrency(report.installationAmount)}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color:
                                                    report.installationCost < 0
                                                        ? "warning.dark"
                                                        : "inherit",
                                            }}
                                        >
                                            {fCurrency(report.installationCost)}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color:
                                                    report.installationProfit < 0
                                                        ? "warning.dark"
                                                        : "inherit",
                                            }}
                                        >
                                            {fCurrency(report.installationProfit)}
                                        </TableCell>
                                        <TableCell>
                                            {report.workingType?.toUpperCase()}
                                        </TableCell>
                                        <TableCell>
                                            {report.notes}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={`Edit ${report?.projectInfo?.name} report`} arrow>
                                                <IconButton
                                                    variant="text"
                                                    color="warning"
                                                    size="small"
                                                    sx={{
                                                        ml: 1,
                                                        '&:hover': {
                                                            boxShadow: 'none',
                                                            backgroundColor: 'transparent',
                                                        },
                                                    }}
                                                >
                                                    <Iconify icon="fluent:slide-text-edit-20-regular" color="primary" width={22} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {finalData?.length > 0 && (
                                    <React.Fragment key='totals-reports'>
                                        <TableRow
                                            sx={{
                                                height:
                                                    table.emptyRows > 0 ? 53 * table.emptyRows : 0,
                                                bgcolor: "background.neutral",
                                            }}
                                        >
                                            <TableCell colSpan={9} />
                                        </TableRow>

                                        <TableRow>
                                            <TableCell>
                                                <b>TOTAL PAGE # {table.page + 1}</b>
                                            </TableCell>
                                            <TableCell>
                                                <b>{fNumber(totalDurationByPage)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalProjectAmountByPage < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalProjectAmountByPage)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalInstallationAmountByPage < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalInstallationAmountByPage)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalInstallationCostByPage < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalInstallationCostByPage)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalInstallationProfitByPage < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalInstallationProfitByPage)}</b>
                                            </TableCell>
                                            <TableCell colSpan={3} />
                                        </TableRow>

                                        <TableRow>
                                            <TableCell>
                                                <b>TOTAL ALL</b>
                                            </TableCell>
                                            <TableCell>
                                                <b>{fNumber(totalDuration)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalProjectAmount < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalProjectAmount)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalInstallationAmount < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalInstallationAmount)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalInstallationCost < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalInstallationCost)}</b>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        totalInstallationProfit < 0
                                                            ? "warning.dark"
                                                            : "inherit",
                                                }}
                                            >
                                                <b>{fCurrency(totalInstallationProfit)}</b>
                                            </TableCell>
                                            <TableCell colSpan={3} />
                                        </TableRow>

                                        <TableCustomPaginationZohoStyleRow
                                            columnsLength={9}
                                            data={finalData}
                                            page={table.page}
                                            rowsPerPage={table.rowsPerPage}
                                            handleChangePage={(event, newPage) => {
                                                table.onChangePage(event, newPage);
                                            }}
                                            handleChangeRowsPerPage={(event) => {
                                                table.onChangeRowsPerPage(event);
                                            }}
                                            dense={table.dense}
                                            onChangeDense={table.onChangeDense}
                                        />
                                    </React.Fragment>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Scrollbar>
            </Box>

            <Dialog
                open={openEdit.value}
                onClose={openEdit.onFalse}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {`Edit ${selectedRow?.projectInfo?.name} Report`}
                </DialogTitle>
                <DialogContent>
                    {selectedRow && (
                        <ReportsEditRow
                            row={selectedRow}
                            onCloseEdit={openEdit.onFalse}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
