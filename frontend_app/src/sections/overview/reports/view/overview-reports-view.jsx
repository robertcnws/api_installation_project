import { useMemo, useState } from "react";
import { useProjectProfitReportsQuery } from "src/_mock/__project_profit_report";
import { CONFIG } from "src/config-global";
import { useSocketRefetch } from "src/utils/websockets";
import { DashboardContent } from "src/layouts/dashboard";
import { Card } from "@mui/material";
import { WelcomeReportsTypography } from "../welcome-metrics-typography";
import { ReportsSelect } from "../reports-select";
import { ReportsTable } from "../reports-table";






export function OverviewReportsView() {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const {
        data: allProfitReports,
        refetch: refetchAllProfitReports,
        loading: loadingAllProfitReports
    } = useProjectProfitReportsQuery();

    useSocketRefetch(
        `${CONFIG.wsProtocol}://${CONFIG.wsHost}/${CONFIG.wsDomain}/projects/ws/project-profit-reports/`,
        refetchAllProfitReports
    );

    const [reportType, setReportType] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [title, setTitle] = useState('');

    return (
        <DashboardContent maxWidth="xl">
            <WelcomeReportsTypography userLogged={userLogged} />
            <Card sx={{ p: 2, boxShadow: 3 }}>
                <ReportsSelect
                    allProfitReports={allProfitReports}
                    loadingAllProfitReports={loadingAllProfitReports}
                    reportType={reportType}
                    setReportType={setReportType}
                    setFilteredData={setFilteredData}
                    setTitle={setTitle}
                />
                {filteredData.length > 0 && (
                    <ReportsTable
                        filteredData={filteredData}
                        title={title}
                    />
                )}
            </Card>
        </DashboardContent>
    );
}