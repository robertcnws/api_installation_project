import * as XLSX from "xlsx";
import { jsPDF as JsPDF } from "jspdf";
import "jspdf-autotable";
import { fCurrency, fNumber } from "src/utils/format-number";
import logoBase64 from "../../../../public/files/color_white_background/icon_with_text/NWS-HOME-REPORT.png";


const formatMoneyExport = (value) => {
    const n = Number(value || 0);
    return n.toFixed(2);
};

const headers = [
    "Client",
    "Days",
    "ProjectAmount",
    "InstallationAmount",
    "InstallationCost",
    "InstallationProfit",
    "Notes",
];

const moneyFields = new Set([
    "ProjectAmount",
    "InstallationAmount",
    "InstallationCost",
    "InstallationProfit",
]);


const toDisplayRow = (numRow) => {
    const displayRow = { ...numRow };

    moneyFields.forEach((field) => {
        displayRow[field] = fCurrency(numRow[field] || 0);
    });

    return displayRow;
};

// 🔹 Helper para construir las filas base
export function exportedRows(filteredData) {
    return filteredData.map((report) => ({
        Client: report.projectInfo?.name || "",
        Days: report.projectInfo?.duration ?? "",
        ProjectAmount: formatMoneyExport(report.projectAmount),
        InstallationAmount: formatMoneyExport(report.installationAmount),
        InstallationCost: formatMoneyExport(report.installationCost),
        InstallationProfit: formatMoneyExport(report.installationProfit),
        Notes: report.notes || "",
    }));
}

// 🔹 Helper para fila de totales (a partir de exportRows)
const buildTotalsRow = (exportRows) => {
    const totals = exportRows.reduce(
        (acc, row) => {
            acc.Days += Number(row.Days || 0);
            acc.ProjectAmount += Number(row.ProjectAmount || 0);
            acc.InstallationAmount += Number(row.InstallationAmount || 0);
            acc.InstallationCost += Number(row.InstallationCost || 0);
            acc.InstallationProfit += Number(row.InstallationProfit || 0);
            return acc;
        },
        {
            Days: 0,
            ProjectAmount: 0,
            InstallationAmount: 0,
            InstallationCost: 0,
            InstallationProfit: 0,
        }
    );

    return {
        Client: "TOTAL",
        Days: fNumber(totals.Days),
        ProjectAmount: fCurrency(formatMoneyExport(totals.ProjectAmount)),
        InstallationAmount: fCurrency(formatMoneyExport(totals.InstallationAmount)),
        InstallationCost: fCurrency(formatMoneyExport(totals.InstallationCost)),
        InstallationProfit: fCurrency(formatMoneyExport(totals.InstallationProfit)),
        Notes: "",
    };
};

// 🔸 CSV
export const handleExportCSV = (exportFileName, exportRows) => {
    if (!exportRows.length) return;

    const totalsRow = buildTotalsRow(exportRows);
    const displayRows = exportRows.map((row) => toDisplayRow(row));
    
    const rowsWithTotals = [...displayRows, totalsRow];

    const escapeCSV = (value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [
        headers.join(","), // header
        ...rowsWithTotals.map((row) =>
            headers.map((h) => escapeCSV(row[h])).join(",")
        ),
    ].join("\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${exportFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// 🔸 XLSX
export const handleExportXLSX = (exportFileName, exportRows) => {
    if (!exportRows.length) return;

    const displayRows = exportRows.map((row) => toDisplayRow(row));

    const totalsRow = buildTotalsRow(exportRows);
    const rowsWithTotals = [...displayRows, totalsRow];

    const worksheet = XLSX.utils.json_to_sheet(rowsWithTotals);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
};

// 🔸 PDF
export const handleExportPDF = (title, exportFileName, exportRows) => {
    if (!exportRows.length) return;

    const displayRows = exportRows.map((row) => toDisplayRow(row));

    const totalsRow = buildTotalsRow(exportRows);
    const rowsWithTotals = [...displayRows, totalsRow];

    const doc = new JsPDF();

    const margin = 2;
    const logoWidth = 25;
    const logoHeight = 15;

    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    doc.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight);

    // Title
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("NWS HOMES", 190, 7, null, null, "center");
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.text("(305) 851-5798", 190, 13, null, null, "center");
    doc.setFont("helvetica", "italic");
    doc.text("9373 SW 56TH ST MIAMI FL 33165", 170, 19, null, null, "center");
    doc.setFont("helvetica", "normal");


    const pageWidth = doc.internal.pageSize.getWidth();
    const lineY = 22;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(
        margin - 2,
        lineY,
        pageWidth - margin + 2,
        lineY
    );

    // Título
    doc.setFontSize(13);
    doc.text(title || "Project Profit Reports", pageWidth / 2, lineY + 10, "center");

    // Cuerpo de la tabla
    const body = rowsWithTotals.map((row) =>
        headers.map((h) => row[h])
    );

    doc.autoTable({
        head: [headers],
        body,
        startY: lineY + 15,
        styles: { fontSize: 8 },
        headStyles: {
            fillColor: [22, 160, 133],
        },
        theme: "striped",

        didParseCell: (data) => {
            const lastRowIndex = body.length - 1;

            if (data.row.index === lastRowIndex) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.textColor = [0, 0, 0];
            }
        },
    });

    doc.save(`${exportFileName}.pdf`);
};
