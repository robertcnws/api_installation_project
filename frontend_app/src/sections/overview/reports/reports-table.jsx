import { Box, Card, IconButton, MenuItem, MenuList, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography } from "@mui/material";
import { useMemo } from "react";
import { CustomPopover, usePopover } from "src/components/custom-popover";
import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import {
    useTable,
    rowInPage,
    TableNoData,
} from 'src/components/table';
import { TableCustomPaginationZohoStyleRow } from "src/components/table/table-pagination-custom-zoho-style-row";
import { fCurrency, fNumber } from "src/utils/format-number";

export function ReportsTable({
    filteredData,
    title,
}) {

    const table = useTable({ defaultDense: true });

    const popover = usePopover();

    const {
        totalProjectAmount,
        totalInstallationAmount,
        totalInstallationCost,
        totalInstallationProfit,
    } = useMemo(
        () =>
            filteredData.reduce(
                (acc, report) => {
                    acc.totalProjectAmount += report.projectAmount || 0;
                    acc.totalInstallationAmount += report.installationAmount || 0;
                    acc.totalInstallationCost += report.installationCost || 0;
                    acc.totalInstallationProfit += report.installationProfit || 0;
                    return acc;
                },
                {
                    totalProjectAmount: 0,
                    totalInstallationAmount: 0,
                    totalInstallationCost: 0,
                    totalInstallationProfit: 0,
                }
            ),
        [filteredData]
    );

    const {
        totalProjectAmountByPage,
        totalInstallationAmountByPage,
        totalInstallationCostByPage,
        totalInstallationProfitByPage,
    } = useMemo(() => {
        const pageRows = rowInPage(filteredData, table.page, table.rowsPerPage);

        return pageRows.reduce(
            (acc, report) => {
                acc.totalProjectAmountByPage += report.projectAmount || 0;
                acc.totalInstallationAmountByPage += report.installationAmount || 0;
                acc.totalInstallationCostByPage += report.installationCost || 0;
                acc.totalInstallationProfitByPage += report.installationProfit || 0;
                return acc;
            },
            {
                totalProjectAmountByPage: 0,
                totalInstallationAmountByPage: 0,
                totalInstallationCostByPage: 0,
                totalInstallationProfitByPage: 0,
            }
        );
    }, [filteredData, table.page, table.rowsPerPage]);


    return (
        <Box sx={{ mt: 2, width: '100%' }}>
            {/* <Card sx={{ p: 2, mb: 2, boxShadow: 3 }}> */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {title}
                </Typography>
                <IconButton onClick={popover.onOpen}>
                    <Iconify icon="mdi:download" width={24} height={24} />
                </IconButton>
                <CustomPopover open={popover.open} onClose={popover.onClose} anchorEl={popover.anchorEl}>
                    <Box sx={{ p: 1 }}>
                        <MenuList>
                            <MenuItem key='save-csv' onClick={popover.onClose}>
                                <Typography>Save as CSV</Typography>
                            </MenuItem>
                            <MenuItem key='save-xls' onClick={popover.onClose}>
                                <Typography>Save as XLSX</Typography>
                            </MenuItem>
                            <MenuItem key='save-pdf' onClick={popover.onClose}>
                                <Typography>Save as PDF</Typography>
                            </MenuItem>
                        </MenuList>
                    </Box>
                </CustomPopover>
            </Box>
            <Scrollbar>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size={table.dense ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow>
                                <TableCell>CLIENT</TableCell>
                                <TableCell>DAYS</TableCell>
                                <TableCell>PROJECT AMOUNT</TableCell>
                                <TableCell>INSTALLATION AMOUNT</TableCell>
                                <TableCell>INSTALLATION COST</TableCell>
                                <TableCell>INSTALLATION PROFIT</TableCell>
                                <TableCell>NOTES</TableCell>
                            </TableRow>
                        </TableHead>
                        {/* Table body content goes here */}
                        <TableBody>
                            {filteredData?.map((report) => (
                                <TableRow hover key={report.id} sx={{ cursor: 'pointer' }}>
                                    <TableCell>
                                        {report.projectInfo.name}
                                    </TableCell>
                                    <TableCell>
                                        {fNumber(report.projectInfo.duration)}
                                    </TableCell>
                                    <TableCell sx={{ color: report.projectAmount < 0 ? 'warning.dark' : 'inherit' }}>
                                        {fCurrency(report.projectAmount)}
                                    </TableCell>
                                    <TableCell sx={{ color: report.installationAmount < 0 ? 'warning.dark' : 'inherit' }}>
                                        {fCurrency(report.installationAmount)}
                                    </TableCell>
                                    <TableCell sx={{ color: report.installationCost < 0 ? 'warning.dark' : 'inherit' }}>
                                        {fCurrency(report.installationCost)}
                                    </TableCell>
                                    <TableCell sx={{ color: report.installationProfit < 0 ? 'warning.dark' : 'inherit' }}>
                                        {fCurrency(report.installationProfit)}
                                    </TableCell>
                                    <TableCell>{report.notes}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow sx={{ height: table.emptyRows > 0 ? 53 * table.emptyRows : 0, bgcolor: 'background.neutral' }}>
                                <TableCell colSpan={7} />
                            </TableRow>
                            <TableRow>
                                <TableCell><b>TOTAL PAGE # {table.page + 1}</b></TableCell>
                                <TableCell />
                                <TableCell sx={{ color: totalProjectAmountByPage < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalProjectAmountByPage)}
                                </TableCell>
                                <TableCell sx={{ color: totalInstallationAmountByPage < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalInstallationAmountByPage)}
                                </TableCell>
                                <TableCell sx={{ color: totalInstallationCostByPage < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalInstallationCostByPage)}
                                </TableCell>
                                <TableCell sx={{ color: totalInstallationProfitByPage < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalInstallationProfitByPage)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                            <TableRow>
                                <TableCell><b>TOTAL ALL</b></TableCell>
                                <TableCell />
                                <TableCell sx={{ color: totalProjectAmount < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalProjectAmount)}
                                </TableCell>
                                <TableCell sx={{ color: totalInstallationAmount < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalInstallationAmount)}
                                </TableCell>
                                <TableCell sx={{ color: totalInstallationCost < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalInstallationCost)}
                                </TableCell>
                                <TableCell sx={{ color: totalInstallationProfit < 0 ? 'warning.dark' : 'inherit' }}>
                                    {fCurrency(totalInstallationProfit)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableBody>
                        <TableCustomPaginationZohoStyleRow
                            columnsLength={7}
                            data={filteredData}
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
                    </Table>
                </TableContainer>
            </Scrollbar>
            {/* </Card> */}
        </Box>
    );
}