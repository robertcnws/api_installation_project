import { useMemo, useEffect, useContext } from 'react';

import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { Box, Stack, Table, Button, TableRow, TableBody, TableCell, TableHead, Typography, tableCellClasses } from '@mui/material';

import { fCurrency } from 'src/utils/format-number';
import { generateFinancialReport } from 'src/utils/generate-financial-report-pdf';

import { Label } from 'src/components/label';

import { LoadingContext } from 'src/auth/context/loading-context';

import { ProjectDetailsContentOverview } from '../project-details-content-overview';




const StyledTableRow = styled(TableRow)(({ theme }) => ({
    [`& .${tableCellClasses.root}`]: {
        textAlign: 'right',
        borderBottom: 'none',
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
}));


// ----------------------------------------------------------------------

export function ProjectDetailsFinancialView({
    project,
    refetchProject,
    listPermissions,
    openDialogs,
    setOpenDialogs,
}) {

    const { isMobile } = useContext(LoadingContext);

    useEffect(() => {
        if (refetchProject) {
            refetchProject?.();
        }
    }, [refetchProject]);

    //  Sales Order
    
    const totalItems = useMemo(() => project?.salesOrder?.line_items?.filter(
        (item) => item.line_item_type?.toLowerCase().includes('good')
    ).reduce((total, item) => total + Number(item.item_total), 0), [project]);

    const totalInstallation = useMemo(() => project?.salesOrder?.line_items?.filter(
        (item) => item.name?.toLowerCase().includes('install') || item.name?.toLowerCase().includes('struct')
    ).reduce((total, item) => total + item.item_total, 0), [project]);

    const totalOthers = useMemo(() => project?.salesOrder?.line_items?.filter(
        (item) => !item.line_item_type?.toLowerCase().includes('good') && !item.name?.toLowerCase().includes('install') && !item.name?.toLowerCase().includes('struct')
    ).reduce((total, item) => total + item.item_total, 0), [project]);

    const totalSalesOrder = useMemo(() => project?.salesOrder?.total, [project]);

    const subTotalSalesOrder = useMemo(() => project?.salesOrder?.sub_total, [project]);

    const taxTotalSalesOrder = useMemo(() => project?.salesOrder?.tax_total, [project]);

    //  Installation
    const totalSubcontractor = useMemo(() => project?.projectGuideProducts.filter((p) => !p.deleted)?.reduce(
        (total, item) => total + (item.quantity * item.price), 0
    ), [project]);

    const totalMaterials = useMemo(() => project?.projectMaterials?.reduce(
        (total, item) => total + (item.quantity * item.cost), 0
    ), [project]);

    const totalInstalling = useMemo(() => totalSubcontractor + totalMaterials, [totalSubcontractor, totalMaterials]);

    const reportData = useMemo(() => ({
        project,
        salesOrder: {
            totalItems,
            totalInstallation,
            totalOthers,
            totalSalesOrder,
            subTotalSalesOrder,
            taxTotalSalesOrder,
        },
        installation: {
            totalSubcontractor,
            totalMaterials,
            totalInstalling,
        },
        diff: totalInstallation - totalInstalling,
    }), [
        project,
        totalItems,
        totalInstallation,
        totalOthers,
        totalSalesOrder,
        subTotalSalesOrder,
        taxTotalSalesOrder,
        totalSubcontractor,
        totalMaterials,
        totalInstalling
    ]);

    const renderTotal = ({ subtotal, taxes, total, isSalesOrder }) => (
        <>
            <StyledTableRow>
                <TableCell sx={{ color: 'text.secondary' }}>
                    <Box sx={{ mt: 2 }} />
                    Subtotal
                </TableCell>
                <TableCell sx={{ typography: 'subtitle2', color: isSalesOrder ? 'text.primary' : 'error.main' }}>
                    <Box sx={{ mt: 2 }} />
                    {isSalesOrder ? fCurrency(subtotal.toFixed(2)) : fCurrency(-subtotal.toFixed(2))}
                </TableCell>
            </StyledTableRow>

            <StyledTableRow>
                <TableCell sx={{ color: 'text.secondary' }}>Taxes</TableCell>
                <TableCell sx={{ color: isSalesOrder ? 'text.primary' : 'error.main' }}>
                    {isSalesOrder ? fCurrency(taxes.toFixed(2)) : taxes === 0 ? fCurrency(0) : fCurrency(-taxes.toFixed(2))}
                </TableCell>
            </StyledTableRow>

            <StyledTableRow>
                <TableCell sx={{ typography: 'subtitle1' }}>Total</TableCell>
                <TableCell sx={{ typography: 'subtitle1', color: isSalesOrder ? 'text.primary' : 'error.main' }}>
                    {isSalesOrder ? fCurrency(total.toFixed(2)) : fCurrency(-total.toFixed(2))}
                </TableCell>
            </StyledTableRow>
        </>
    );

    const renderListSalesOrder = (
        <Table>
            <TableHead>
                <TableRow>

                    <TableCell sx={{ typography: 'subtitle2' }}>Sell Prices</TableCell>

                    <TableCell align="right">Total</TableCell>

                </TableRow>
            </TableHead>

            <TableBody>
                <TableRow key='installed-items'>
                    <TableCell>
                        <Box>
                            <Typography variant="subtitle2">Products</Typography>

                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                Windows & Doors Installed <br/>in this project
                            </Typography>
                        </Box>
                    </TableCell>

                    <TableCell align="right">{fCurrency(totalItems.toFixed(2))}</TableCell>
                </TableRow>
                <TableRow key='service-items'>
                    <TableCell>
                        <Box>
                            <Typography variant="subtitle2">Services</Typography>

                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                Installation sell and <br />structural modifications
                            </Typography>
                        </Box>
                    </TableCell>

                    <TableCell align="right">{fCurrency(totalInstallation.toFixed(2))}</TableCell>
                </TableRow>
                <TableRow key='other-items'>
                    <TableCell>
                        <Box>
                            <Typography variant="subtitle2">Others</Typography>

                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                Permits, Fee, Design, etc.
                            </Typography>
                        </Box>
                    </TableCell>

                    <TableCell align="right">{fCurrency(totalOthers.toFixed(2))}</TableCell>
                </TableRow>

                {renderTotal({
                    subtotal: subTotalSalesOrder,
                    taxes: taxTotalSalesOrder,
                    total: totalSalesOrder,
                    isSalesOrder: true,
                })}
            </TableBody>
        </Table>
    );

    const renderListInstallation = (
        <Table>
            <TableHead>
                <TableRow>

                    <TableCell sx={{ typography: 'subtitle2' }}>Installation Costs</TableCell>

                    <TableCell align="right">Total</TableCell>

                </TableRow>
            </TableHead>

            <TableBody>
                <TableRow key='subcontrator-items'>
                    <TableCell>
                        <Box>
                            <Typography variant="subtitle2">Subcontractors</Typography>

                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                Subcontractors for the project
                            </Typography>
                        </Box>
                    </TableCell>

                    <TableCell align="right" sx={{ color: 'error.main' }}>-{fCurrency(totalSubcontractor.toFixed(2))}</TableCell>
                </TableRow>
                <TableRow key='materials-items'>
                    <TableCell>
                        <Box>
                            <Typography variant="subtitle2">Materials</Typography>

                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                Construction materials for the project
                            </Typography>
                        </Box>
                    </TableCell>

                    <TableCell align="right" sx={{ color: 'error.main' }}>-{fCurrency(totalMaterials.toFixed(2))}</TableCell>
                </TableRow>
                {renderTotal({
                    subtotal: totalInstalling,
                    taxes: 0,
                    total: totalInstalling,
                    isSalesOrder: false,
                })}

            </TableBody>
        </Table>
    );


    const renderContent = (
        <Card sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column' }}>
            {project && (
                <Box sx={{ maxHeight: 600, minHeight: !isMobile ? 600 : 0, overflow: 'auto' }}>
                        <Box sx={{ display: 'flex', flexDirection: !isMobile ? 'row' : 'column' }}>
                            {renderListSalesOrder}
                            {renderListInstallation}
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }} >
                            Installation Profit:
                            <Label color={totalInstallation - totalInstalling > 0 ? 'success' : 'error'}
                                sx={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: 16 }}>
                                {fCurrency(totalInstallation - totalInstalling)}
                            </Label>
                        </Box>
                        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: !isMobile ? 7 : 5 }}>
                            <Button
                                variant="outlined"
                                onClick={() => generateFinancialReport({ reportData })}
                            >
                                Generate Report
                            </Button>
                        </Stack>
                    </Box>
            )}
        </Card>
    );

    const renderOverview = (

        <ProjectDetailsContentOverview
            project={project}
            listPermissions={listPermissions}
            openDialogs={openDialogs}
            setOpenDialogs={setOpenDialogs}
        />
    );

    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={8}>
                {renderContent}
            </Grid>

            <Grid xs={12} md={4}>
                {renderOverview}

                {/* {renderCompany} */}
            </Grid>
        </Grid>
    );
}
