import 'jspdf-autotable';
import { CONFIG } from 'src/config-global';
import { jsPDF as JsPDF } from 'jspdf';
import { fDate, fDateTime } from './format-time';
import logoBase64 from '../../public/files/color_white_background/icon_with_text/NWS-HOME-REPORT.png';
import { fCurrency } from './format-number';


export const generateInstallationGuideFormReport = ({ project }) => {
    const doc = new JsPDF();

    const margin = 2;
    const logoWidth = 25;
    const logoHeight = 15;
    const columnSpacing = 105;

    doc.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight);

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NEW WINDOW SYSTEM", 170, 10, null, null, "center");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("INSTALLATION ORDER GUIDE", 105, 25, null, null, "center");

    // Project Details
    doc.setFontSize(12);
    const salesOrderDetails = [
        [{ content: "SO #:", styles: { fontStyle: 'bold' } }, project.salesOrder.salesorder_number || ""],
        [{ content: "DATE:", styles: { fontStyle: 'bold' } }, fDate(project.salesOrder.date) || ""],
        [{ content: "CUSTOMER:", styles: { fontStyle: 'bold' } }, project.salesOrder.customer.customer_name || ""],
        [{ content: "PHONE:", styles: { fontStyle: 'bold' } }, project.salesOrder.customer.phone || ""],
        [{ content: "EMAIL:", styles: { fontStyle: 'bold' } }, project.salesOrder.customer.email || ""],
    ];

    doc.autoTable({
        startY: 30,
        startX: margin + 5,
        margin: { left: margin + 3 },
        head: [[
            { content: "SALES ORDER DETAILS", colSpan: 2, styles: { halign: 'center' } }
        ]],
        body: salesOrderDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 50 },
        },
    });

    const salesOrderFinalX = doc.internal.pageSize.width / 2 + 10;
    const firstTableHeight = doc.lastAutoTable.finalY;

    const workOrderDetails = [
        [{ content: "INSTALLATION DATE:", styles: { fontStyle: 'bold' } }, fDate(project.startDate) || ""],
        [{ content: "PACKED:", styles: { fontStyle: 'bold' } }, ""],
        [{ content: "HAS PERMIT?:", styles: { fontStyle: 'bold' } }, project.hasPermission ? "YES" : "NO"],
        [{ content: "INSTALLATION ADDRESS:", styles: { fontStyle: 'bold' } }, project.address ? project.address : ""],
        []
    ];


    doc.autoTable({
        startY: 30,
        margin: { left: salesOrderFinalX - 25 },
        head: [[
            { content: "WORK ORDER DETAILS", colSpan: 2, styles: { halign: 'center' } }
        ]],
        body: workOrderDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 60 },
        },
    });

    const secondTableHeight = doc.lastAutoTable.finalY;

    const statusDetails = [
        [
            { content: CONFIG.stages.preparation.toUpperCase(), styles: { fontStyle: 'bold', fontSize: 10 } },
            { content: CONFIG.stages.coordination.toUpperCase(), styles: { fontStyle: 'bold', fontSize: 10 } },
            { content: CONFIG.stages.installation.toUpperCase(), styles: { fontStyle: 'bold', fontSize: 10 } },
            { content: CONFIG.stages.permission.toUpperCase(), styles: { fontStyle: 'bold', fontSize: 10 } },
            { content: CONFIG.stages.closing.toUpperCase(), styles: { fontStyle: 'bold', fontSize: 10 } },
            { content: CONFIG.stages.finished.toUpperCase(), styles: { fontStyle: 'bold', fontSize: 10 } },
        ],
        [
            {
                content: project?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.preparation.toLowerCase()) !== -1 ? "X" : "",
                styles: { fontStyle: 'bold', fontSize: 10 }
            },
            {
                content: project?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.coordination.toLowerCase()) !== -1 ? "X" : "",
                styles: { fontStyle: 'bold', fontSize: 10 },
            },
            {
                content: project?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.installation.toLowerCase()) !== -1 ? "X" : "",
                styles: { fontStyle: 'bold', fontSize: 10 },
            },
            {
                content: project?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1 ? "X" : "",
                styles: { fontStyle: 'bold', fontSize: 10 }
            },
            {
                content: project?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.closing.toLowerCase()) !== -1 ? "X" : "",
                styles: { fontStyle: 'bold', fontSize: 10 }
            },
            {
                content: project?.currentStage?.name.toLowerCase().indexOf(CONFIG.stages.finished.toLowerCase()) !== -1 ? "X" : "",
                styles: { fontStyle: 'bold', fontSize: 10 }
            },
        ],
    ]

    doc.autoTable({
        startY: secondTableHeight,
        startX: margin + 5,
        margin: { left: margin + 3 },
        head: [[
            { content: "STATUS", colSpan: 6, styles: { halign: 'center' } }
        ]],
        body: statusDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 33.3, halign: 'center' },
            1: { cellWidth: 33.4, halign: 'center' },
            2: { cellWidth: 33.3, halign: 'center' },
            3: { cellWidth: 33.3, halign: 'center' },
            4: { cellWidth: 33.3, halign: 'center' },
            5: { cellWidth: 33.3, halign: 'center' },
        },
    });

    const thirdTableHeight = doc.lastAutoTable.finalY;

    const workScopeDetails = [
        [{ content: "WORK SCOPE & DESCRIPTION:", styles: { fontStyle: 'bold' } }, project?.workScope || ""],
    ];


    doc.autoTable({
        startY: thirdTableHeight + 0.5,
        startX: margin + 5,
        margin: { left: margin + 3 },
        body: workScopeDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2, minCellHeight: 25 },
        columnStyles: {
            0: { cellWidth: 65 },
            1: { cellWidth: 135 },
        },
    });

    const fourTableHeight = doc.lastAutoTable.finalY;

    const totalProducts = project?.projectGuideProducts?.reduce((acc, product) => acc + product.price * product.quantity, 0);

    let productsGuideDetails = project?.projectGuideProducts?.map((product) => [
        { content: product.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: fCurrency(product.price), styles: { halign: 'left' } },
        { content: product.quantity, styles: { halign: 'center' } },
        { content: fCurrency(product.price * product.quantity), styles: { halign: 'left' } },
        { content: product.notes, styles: { halign: 'left' } },
    ]) || [];

    productsGuideDetails = [
        ...productsGuideDetails,
        [
            { content: "TOTALS:", colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: fCurrency(totalProducts), styles: { halign: 'left', fontStyle: 'bold' } },
            { content: "", styles: { halign: 'center', fontStyle: 'bold' } },
        ]
    ]

    doc.autoTable({
        startY: fourTableHeight + 0.5,
        startX: margin + 5,
        margin: { left: margin + 3 },
        head: [[
            { content: "", styles: { halign: 'left' } },
            { content: "PAY PER UNIT", styles: { halign: 'left', fontStyle: 'bold' } },
            { content: "QTY", styles: { halign: 'center', fontStyle: 'bold' } },
            { content: "TOTAL", styles: { halign: 'left', fontStyle: 'bold' } },
            { content: "NOTES", styles: { halign: 'left', fontStyle: 'bold' } },
        ]],
        body: productsGuideDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 65, halign: 'left' },
            1: { cellWidth: 30, halign: 'left' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'left' },
            4: { cellWidth: 60, halign: 'left' },
        },
    });

    doc.addPage();
    doc.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight);

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NEW WINDOW SYSTEM", 170, 10, null, null, "center");
    doc.setFont("helvetica", "normal");
    
    doc.setFontSize(12);

    const totalMaterials = project?.projectMaterials?.reduce((acc, product) => acc + product.cost, 0);

    let materialsDetails = project?.projectMaterials?.map((product) => [
        { content: product.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: product.quantity, styles: { halign: 'center' } },
        { content: product.ticket, styles: { halign: 'left' } },
        { content: fCurrency(product.cost), styles: { halign: 'left' } },
        { content: product.store, styles: { halign: 'left' } },
        { content: product.notes, styles: { halign: 'left' } },
    ]) || [];

    materialsDetails = [
        ...materialsDetails,
        [
            { content: "TOTALS:", colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: fCurrency(totalMaterials), styles: { halign: 'left', fontStyle: 'bold' } },
            { content: "", styles: { halign: 'center', fontStyle: 'bold' } },
            { content: "", styles: { halign: 'center', fontStyle: 'bold' } },
        ]
    ]

    doc.autoTable({
        startY: 30,
        startX: margin + 5,
        margin: { left: margin + 3 },
        head: [[
            { content: "MATERIALS", colSpan: 7, styles: { halign: 'center' } }
        ]],
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 200, halign: 'center' },
        },
    });

    const fifthTableHeight = doc.lastAutoTable.finalY;

    doc.autoTable({
        startY: fifthTableHeight + 0.5,
        startX: margin + 5,
        margin: { left: margin + 3 },
        head: [[
            { content: "NAME", styles: { halign: 'left' } },
            { content: "QTY", styles: { halign: 'center', fontStyle: 'bold' } },
            { content: "TICKET", styles: { halign: 'left', fontStyle: 'bold' } },
            { content: "COST", styles: { halign: 'left', fontStyle: 'bold' } },
            { content: "STORE", styles: { halign: 'left', fontStyle: 'bold' } },
            { content: "NOTES", styles: { halign: 'left', fontStyle: 'bold' } },
        ]],
        body: materialsDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 55, halign: 'left' },
            1: { cellWidth: 15, halign: 'center' },
            2: { cellWidth: 25, halign: 'left' },
            3: { cellWidth: 20, halign: 'left' },
            4: { cellWidth: 25, halign: 'left' },
            5: { cellWidth: 60, halign: 'left' },
        }
    });

    const sixthTableHeight = doc.lastAutoTable.finalY;

    const otherNotesDetails = [
        [{ content: "OTHER NOTES:", styles: { fontStyle: 'bold' } }, project?.projectMaterialsOtherNotes || ""],
    ];


    doc.autoTable({
        startY: sixthTableHeight + 0.5,
        startX: margin + 5,
        margin: { left: margin + 3 },
        body: otherNotesDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2, minCellHeight: 100 },
        columnStyles: {
            0: { cellWidth: 65 },
            1: { cellWidth: 135 },
        },
    });

    const seventhTableHeight = doc.lastAutoTable.finalY;

    const preparedByDetails = [
        [{ content: "PREPARED BY:", styles: { fontStyle: 'bold' } }, project.salesOrder.salesorder_number || ""],
    ];

    doc.autoTable({
        startY: seventhTableHeight + 0.5,
        startX: margin + 5,
        margin: { left: margin + 3 },
        body: preparedByDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 50 },
        },
    });

    const preparedByFinalX = doc.internal.pageSize.width / 2 + 10;
    const preparedByTableHeight = doc.lastAutoTable.finalY;

    const aprovedByDetails = [
        [{ content: "APROVED BY:", styles: { fontStyle: 'bold' } }, fDate(project.startDate) || ""],
    ];


    doc.autoTable({
        startY: seventhTableHeight + 0.5,
        margin: { left: preparedByFinalX - 25 },
        body: aprovedByDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 60 },
        },
    });


    doc.save(`Installation_Guide_${fDateTime(new Date(), 'YYYY_MM_DD_HH_mm_ss')}.pdf`);

    const pdfBlob = doc.output('blob');

    const blobUrl = URL.createObjectURL(pdfBlob);

    window.open(blobUrl, '_blank');
}

export const createScopeArray = ({ listItems }) => {
    const scopeArray = [
        {
            id: 1,
            name: CONFIG.installationGuide.windowUntil74Name,
            price: CONFIG.installationGuide.windowUntil74Price,
            quantity: 0,
            predefined: true,
        },
        {
            id: 2,
            name: CONFIG.installationGuide.windowUntil111Name,
            price: CONFIG.installationGuide.windowUntil111Price,
            quantity: 0,
            predefined: true,
        },
        {
            id: 3,
            name: CONFIG.installationGuide.fixedSideName,
            price: CONFIG.installationGuide.fixedSidePrice,
            quantity: 0,
            predefined: true,
        },
        {
            id: 4,
            name: CONFIG.installationGuide.fdUntil39Name,
            price: CONFIG.installationGuide.fdUntil39Price,
            quantity: 0,
            predefined: true,
        },
        {
            id: 5,
            name: CONFIG.installationGuide.fdDoubleUntil76Name,
            price: CONFIG.installationGuide.fdDoubleUntil76Price,
            quantity: 0,
            predefined: true,
        },
        {
            id: 6,
            name: CONFIG.installationGuide.sgdForPanel72Name,
            price: CONFIG.installationGuide.sgdForPanel72Price,
            quantity: 0,
            predefined: true,
        },
        {
            id: 7,
            name: CONFIG.installationGuide.sgdForPanel96Name,
            price: CONFIG.installationGuide.sgdForPanel96Price,
            quantity: 0,
            predefined: true,
        },
        {
            id: 8,
            name: CONFIG.installationGuide.storefrontName,
            price: 0,
            quantity: 0,
            predefined: true,
        }
    ];

    listItems?.forEach((item) => {
        const dimensions = extractDimensions(item.description);
        if (dimensions) {
            const [height, width] = dimensions;
            if ((item.name.toLowerCase().includes('window') &&
                !item.name.toLowerCase().includes('fixed')) ||
                item.sku.toLowerCase().includes('mg300') ||
                item.sku.toLowerCase().includes('mg350') ||
                item.description.toLowerCase().includes('mg300') ||
                item.description.toLowerCase().includes('mg350')) {
                if (width <= 74) {
                    scopeArray[0] = {
                        ...scopeArray[0],
                        quantity: scopeArray[0].quantity + item.quantity,
                    }
                } else if (width <= 111 && width > 74) {
                    scopeArray[1] = {
                        ...scopeArray[1],
                        quantity: scopeArray[1].quantity + item.quantity,
                    }
                }
            }
            else if ((!item.name.toLowerCase().includes('window') &&
                item.name.toLowerCase().includes('fixed')) ||
                item.description.toLowerCase().includes('mg450')) {
                scopeArray[2] = {
                    ...scopeArray[2],
                    quantity: scopeArray[2].quantity + item.quantity,
                }
            }
            else if ((item.name.toLowerCase().includes('french') &&
                item.name.toLowerCase().includes('door')) ||
                (item.description.toLowerCase().includes('french') &&
                    item.description.toLowerCase().includes('door')) ||
                item.description.toLowerCase().includes('fd') ||
                item.description.toLowerCase().includes('mg3000')) {
                if (width <= 39) {
                    scopeArray[3] = {
                        ...scopeArray[3],
                        quantity: scopeArray[3].quantity + item.quantity,
                    }
                } else if (width <= 76 && width > 39) {
                    scopeArray[4] = {
                        ...scopeArray[4],
                        quantity: scopeArray[4].quantity + item.quantity,
                    }
                }
            }
            else if ((item.name.toLowerCase().includes('slid') &&
                item.name.toLowerCase().includes('door')) ||
                (item.description.toLowerCase().includes('slid') &&
                    item.description.toLowerCase().includes('door')) ||
                item.name.toLowerCase().includes('sgd') ||
                item.description.toLowerCase().includes('sgd')) {
                if (width <= 72) {
                    scopeArray[5] = {
                        ...scopeArray[5],
                        quantity: scopeArray[5].quantity + item.quantity,
                    }
                } else if (width <= 96 && width > 72) {
                    scopeArray[6] = {
                        ...scopeArray[6],
                        quantity: scopeArray[6].quantity + item.quantity,
                    }
                }
            }
            else if ((item.name.toLowerCase().includes('store') &&
                item.name.toLowerCase().includes('front'))) {
                scopeArray[7] = {
                    ...scopeArray[7],
                    quantity: scopeArray[7].quantity + item.quantity,
                    price: ((width * width) / 144) * 10,
                }
            }
            else {
                scopeArray.push({
                    id: scopeArray.length,
                    name: item.name,
                    price: 0,
                    quantity: item.quantity,
                    predefined: false,
                    itemId: item.line_item_id,
                });
            }
        }
        else {
            scopeArray.push({
                id: scopeArray.length,
                name: item.name,
                price: 0,
                quantity: item.quantity,
                predefined: false,
                itemId: item.line_item_id,
            });
        }
    });
    return scopeArray;
}

function extractDimensions(text) {
    let dimensions = [];

    const match1 = text.match(/(\d+)(?:\.\d+)?\s+(\d+)(?:\.\d+)?/);
    if (match1) {
        dimensions = [parseInt(match1[1], 10), parseInt(match1[2], 10)];
    }

    const match2 = text.match(/Size:\s+(\d+)\s*\S*\s*X\s*(\d+)\s*\S*/);
    if (match2) {
        dimensions = [parseInt(match2[1], 10), parseInt(match2[2], 10)];
    }

    return dimensions.length ? dimensions : null;
}
