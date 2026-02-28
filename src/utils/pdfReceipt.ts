import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaddyEntryDetails } from '../types/paddy';
import { LoadingEntryDetails } from '../types/loading';

export const generatePaddyReceipt = (entry: PaddyEntryDetails, userName: string, userRole: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const title = 'PADDY RECEIPT';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 8;

  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const receiptId = entry.id ? `#${String(entry.id).substring(0, 8).toUpperCase()}` : '#N/A';
  const loadedDate = entry.loadedDate.split('T')[0];

  pdf.text(`Date: ${currentDate}`, margin, yPosition);
  const midPoint = pageWidth / 2;
  pdf.text(`Receipt No: ${receiptId}`, midPoint, yPosition);
  pdf.text(`Loaded: ${loadedDate}`, pageWidth - margin - pdf.getTextWidth(`Loaded: ${loadedDate}`), yPosition);
  yPosition += 8;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('PARTY DETAILS', margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const rythuName = userName || entry.rythu || 'N/A';
  pdf.text(`Rythu: ${rythuName}`, margin, yPosition);
  pdf.text(`Lorry No: ${entry.lorryNumber}`, pageWidth / 2, yPosition);
  yPosition += 8;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('ITEM DETAILS', margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const items = [
    { label: 'No. of Bags', value: String(entry.bags || 0) },
    { label: 'KG per Bag', value: String(entry.kgperBag || 0) },
    { label: 'Total Weight', value: `${entry.totalWeight?.toLocaleString() || '0'} KG` },
  ];

  items.forEach(item => {
    pdf.text(item.label, margin, yPosition);
    const valueWidth = pdf.getTextWidth(item.value);
    pdf.text(item.value, pageWidth - margin - valueWidth, yPosition);
    yPosition += 5;
  });

  yPosition += 3;
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('AMOUNT DETAILS', margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const bagAmount = userRole === 'vendor' ? entry.dealerBagAmount : entry.bagAmount;
  const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
  const status = userRole === 'vendor' ? entry.dealerPaddyStatus : entry.status;

  pdf.text('Rate per Bag', margin, yPosition);
  const rateText = `${(bagAmount || 0).toLocaleString()}`;
  const rateWidth = pdf.getTextWidth(rateText);
  pdf.text(rateText, pageWidth - margin - rateWidth, yPosition);
  yPosition += 5;

  pdf.text(`Bags x Rate`, margin, yPosition);
  const calcText = `${entry.bags || 0} x ${(bagAmount || 0).toLocaleString()}`;
  const calcWidth = pdf.getTextWidth(calcText);
  pdf.text(calcText, pageWidth - margin - calcWidth, yPosition);
  yPosition += 8;

  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('TOTAL AMOUNT', margin, yPosition);
  const totalText = `${(finalAmount || 0).toLocaleString()}`;
  const totalWidth = pdf.getTextWidth(totalText);
  pdf.text(totalText, pageWidth - margin - totalWidth, yPosition);
  yPosition += 4;

  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);

  const statusLabel = status === 'paid' ? 'PAID ✓' :
                      status === 'pending' ? 'PENDING' :
                      'PARTIAL';
  const statusColor = status === 'paid' ? [34, 197, 94] as const :
                      status === 'pending' ? [239, 68, 68] as const :
                      [251, 191, 36] as const;

  pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.setFont('helvetica', 'bold');
  const statusWidth = pdf.getTextWidth(`Status: ${statusLabel}`);
  pdf.text(`Status: ${statusLabel}`, (pageWidth - statusWidth) / 2, yPosition);
  pdf.setTextColor(0, 0, 0);

  yPosition += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  const thankYou = 'Thank you for your business!';
  const thankYouWidth = pdf.getTextWidth(thankYou);
  pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setTextColor(128, 128, 128);
  const footer = 'Computer-generated receipt';
  const footerWidth = pdf.getTextWidth(footer);
  pdf.text(footer, (pageWidth - footerWidth) / 2, yPosition);
  pdf.setTextColor(0, 0, 0);

  const fileName = `paddy-receipt-${entry.id || Date.now()}.pdf`;
  pdf.save(fileName);
};

export const generateBulkPaddyReceipts = (entries: PaddyEntryDetails[], userName: string, userRole: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  const receiptHeight = (pageHeight - margin * 3) / 2;

  entries.forEach((entry, index) => {
    const positionOnPage = index % 2;

    if (index > 0 && positionOnPage === 0) {
      pdf.addPage();
    }

    const startY = positionOnPage === 0 ? margin : margin * 2 + receiptHeight;
    let yPosition = startY + 8;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const title = 'PADDY RECEIPT';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 5;

    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const receiptId = entry.id ? `#${String(entry.id).substring(0, 8).toUpperCase()}` : '#N/A';
    const loadedDate = entry.loadedDate.split('T')[0];

    pdf.text(`Date: ${currentDate}`, margin, yPosition);
    const midPoint = pageWidth / 2;
    pdf.text(`Receipt: ${receiptId}`, midPoint - 10, yPosition);
    pdf.text(`Loaded: ${loadedDate}`, pageWidth - margin - pdf.getTextWidth(`Loaded: ${loadedDate}`), yPosition);
    yPosition += 5;

    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('PARTY DETAILS', margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const rythuName = entry.rythu || 'N/A';
    pdf.text(`Rythu: ${rythuName}`, margin, yPosition);
    pdf.text(`Lorry: ${entry.lorryNumber}`, pageWidth / 2, yPosition);
    yPosition += 5;

    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('ITEM DETAILS', margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const items = [
      { label: 'No. of Bags', value: String(entry.bags || 0) },
      { label: 'KG per Bag', value: String(entry.kgperBag || 0) },
      { label: 'Total Weight', value: `${entry.totalWeight?.toLocaleString() || '0'} KG` },
    ];

    items.forEach(item => {
      pdf.text(item.label, margin, yPosition);
      const valueWidth = pdf.getTextWidth(item.value);
      pdf.text(item.value, pageWidth - margin - valueWidth, yPosition);
      yPosition += 4;
    });

    yPosition += 2;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('AMOUNT DETAILS', margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const bagAmount = userRole === 'vendor' ? entry.dealerBagAmount : entry.bagAmount;
    const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
    const status = userRole === 'vendor' ? entry.dealerPaddyStatus : entry.status;

    pdf.text('Rate per Bag', margin, yPosition);
    const rateText = `${(bagAmount || 0).toLocaleString()}`;
    const rateWidth = pdf.getTextWidth(rateText);
    pdf.text(rateText, pageWidth - margin - rateWidth, yPosition);
    yPosition += 4;

    pdf.text(`Bags x Rate`, margin, yPosition);
    const calcText = `${entry.bags || 0} x ${(bagAmount || 0).toLocaleString()}`;
    const calcWidth = pdf.getTextWidth(calcText);
    pdf.text(calcText, pageWidth - margin - calcWidth, yPosition);
    yPosition += 5;

    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('TOTAL AMOUNT', margin, yPosition);
    const totalText = `${(finalAmount || 0).toLocaleString()}`;
    const totalWidth = pdf.getTextWidth(totalText);
    pdf.text(totalText, pageWidth - margin - totalWidth, yPosition);
    yPosition += 3;

    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const statusLabel = status === 'paid' ? 'PAID ✓' :
                        status === 'pending' ? 'PENDING' :
                        'PARTIAL';
    const statusColor = status === 'paid' ? [34, 197, 94] as const :
                        status === 'pending' ? [239, 68, 68] as const :
                        [251, 191, 36] as const;

    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.setFont('helvetica', 'bold');
    const statusWidth = pdf.getTextWidth(`Status: ${statusLabel}`);
    pdf.text(`Status: ${statusLabel}`, (pageWidth - statusWidth) / 2, yPosition);
    pdf.setTextColor(0, 0, 0);

    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);

    const footerText = 'Computer-generated receipt';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, yPosition);
    pdf.setTextColor(0, 0, 0);

    if (positionOnPage === 0 && index < entries.length - 1) {
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineDash([2, 2]);
      const separatorY = startY + receiptHeight;
      pdf.line(margin, separatorY, pageWidth - margin, separatorY);
      pdf.setLineDash([]);
      pdf.setDrawColor(0, 0, 0);
    }
  });

  pdf.save(`paddy_receipts_bulk_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
};

interface LoadingWithPaddy {
  loading: LoadingEntryDetails;
  paddyEntries: PaddyEntryDetails[];
}

interface AmaliPaymentData {
  amounts: Map<string, number>;
}

export const generateAmaliPOSReceipt = (
  loadingsWithPaddy: LoadingWithPaddy[],
  amounts: Map<string, number>,
  amaliName: string
) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297]
  });

  const pageWidth = 80;
  const margin = 4;
  let yPosition = 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const title = 'AMALI PAYMENT RECEIPT';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const dateTime = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  pdf.text(`Date: ${dateTime}`, margin, yPosition);
  yPosition += 4;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Amali: ${amaliName}`, margin, yPosition);
  yPosition += 5;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;

  let grandTotal = 0;

  loadingsWithPaddy.forEach(({ loading, paddyEntries }, index) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(`Loading #${loading.id}`, margin, yPosition);
    yPosition += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(`Lorry: ${loading.lorryNumber}`, margin, yPosition);
    yPosition += 3;
    pdf.text(`Date: ${new Date(loading.loadedDate).toLocaleDateString('en-IN')}`, margin, yPosition);
    yPosition += 4;

    let loadingSubtotal = 0;

    if (paddyEntries.length > 0) {
      paddyEntries.forEach((paddy) => {
        const amountPerBag = amounts.get(paddy.id || '') || 0;
        const total = paddy.bags * amountPerBag;
        loadingSubtotal += total;

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');

        const loadType = paddy.loadType || 'potha';
        pdf.text(`${loadType.toUpperCase()}`, margin + 1, yPosition);
        yPosition += 3;

        const rythuName = paddy.rythu.length > 18 ? paddy.rythu.substring(0, 18) + '...' : paddy.rythu;
        pdf.text(`  ${rythuName}`, margin + 1, yPosition);
        yPosition += 3;

        pdf.text(`  ${paddy.bags} bags x ${amountPerBag.toFixed(2)}`, margin + 1, yPosition);

        const totalText = `${total.toFixed(2)}`;
        const totalWidth = pdf.getTextWidth(totalText);
        pdf.text(totalText, pageWidth - margin - totalWidth, yPosition);
        yPosition += 4;
      });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Subtotal:', margin + 1, yPosition);
      const subtotalText = `${loadingSubtotal.toFixed(2)}`;
      const subtotalWidth = pdf.getTextWidth(subtotalText);
      pdf.text(subtotalText, pageWidth - margin - subtotalWidth, yPosition);
      yPosition += 5;

      pdf.setLineWidth(0.2);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;
    }

    grandTotal += loadingSubtotal;

    if (yPosition > 280 && index < loadingsWithPaddy.length - 1) {
      pdf.addPage();
      yPosition = 8;
    }
  });

  if (yPosition > 270) {
    pdf.addPage();
    yPosition = 8;
  }

  pdf.setLineWidth(0.5);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('GRAND TOTAL:', margin, yPosition);
  const grandTotalText = `${grandTotal.toFixed(2)}`;
  const grandTotalWidth = pdf.getTextWidth(grandTotalText);
  pdf.text(grandTotalText, pageWidth - margin - grandTotalWidth, yPosition);
  yPosition += 4;

  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  const thankYou = 'Thank you!';
  const thankYouWidth = pdf.getTextWidth(thankYou);
  pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);
  yPosition += 4;

  pdf.setFontSize(6);
  pdf.setTextColor(100, 100, 100);
  const footer = 'Computer-generated receipt';
  const footerWidth = pdf.getTextWidth(footer);
  pdf.text(footer, (pageWidth - footerWidth) / 2, yPosition);

  const fileName = `${amaliName}_POS_Receipt_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const generateRythuComprehensiveReceipt = (
  userName: string,
  paddyEntries: PaddyEntryDetails[],
  payables: Array<{ date: string; amount: number; reason: string }>,
  receivables: Array<{ date: string; amount: number; reason: string }>,
  paddyAmount: number,
  pendingPayables: number,
  pendingReceivables: number,
  netBalance: number
) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = 20;

  // Header Info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  pdf.text(`Rythu: ${userName}`, margin, yPosition);
  pdf.text(`Date: ${currentDate}`, pageWidth - margin - pdf.getTextWidth(`Date: ${currentDate}`), yPosition);
  yPosition += 10;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Summary Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('FINANCIAL SUMMARY', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const summaryItems = [
    { label: 'Total Paddy Amount', value: `${paddyAmount.toLocaleString()}`, color: [34, 197, 94] },
    { label: 'Pending Payables', value: `${pendingPayables.toLocaleString()}`, color: [239, 68, 68] },
    { label: 'Pending Receivables', value: `${pendingReceivables.toLocaleString()}`, color: [34, 197, 94] },
  ];

  summaryItems.forEach(item => {
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, margin, yPosition);
    pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
    const valueWidth = pdf.getTextWidth(item.value);
    pdf.text(item.value, pageWidth - margin - valueWidth, yPosition);
    yPosition += 6;
  });

  yPosition += 2;
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('NET BALANCE', margin, yPosition);
  const netBalanceColor = netBalance >= 0 ? [34, 197, 94] : [239, 68, 68];
  pdf.setTextColor(netBalanceColor[0], netBalanceColor[1], netBalanceColor[2]);
  const netBalanceText = `${netBalance.toLocaleString()}`;
  const netBalanceWidth = pdf.getTextWidth(netBalanceText);
  pdf.text(netBalanceText, pageWidth - margin - netBalanceWidth, yPosition);
  yPosition += 4;

  pdf.setTextColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  // Paddy Entries Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`PADDY ENTRIES (${paddyEntries.length})`, margin, yPosition);
  yPosition += 6;

  if (paddyEntries.length > 0) {
    const paddyTableHead = [['Date', 'Lorry', 'Bags', 'KG/Bag', 'Rate', 'Amount']];
    const paddyTableBody = paddyEntries.map(entry => [
      entry.loadedDate.split('T')[0],
      entry.lorryNumber,
      entry.bags.toString(),
      entry.kgperBag.toString(),
      entry.bagAmount.toLocaleString(),
      entry.finalAmount.toLocaleString()
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: paddyTableHead,
      body: paddyTableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('No paddy entries found', margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  // Payables Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`PAYABLES (${payables.length})`, margin, yPosition);
  yPosition += 6;

  if (payables.length > 0) {
    const payablesTableHead = [['Date', 'Reason', 'Amount']];
    const payablesTableBody = payables.map(txn => [
      new Date(txn.date).toLocaleDateString('en-IN'),
      txn.reason,
      txn.amount.toLocaleString()
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: payablesTableHead,
      body: payablesTableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 90 },
        2: { cellWidth: 30 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('No payables', margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  // Receivables Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`RECEIVABLES (${receivables.length})`, margin, yPosition);
  yPosition += 6;

  if (receivables.length > 0) {
    const receivablesTableHead = [['Date', 'Reason', 'Amount']];
    const receivablesTableBody = receivables.map(txn => [
      new Date(txn.date).toLocaleDateString('en-IN'),
      txn.reason,
      txn.amount.toLocaleString()
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: receivablesTableHead,
      body: receivablesTableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 90 },
        2: { cellWidth: 30 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('No receivables', margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  // Footer
  if (yPosition > pageHeight - 30) {
    pdf.addPage();
    yPosition = 20;
  }

  yPosition += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const thankYou = 'Thank you for your business!';
  const thankYouWidth = pdf.getTextWidth(thankYou);
  pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);

  yPosition += 6;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const footer = 'Computer-generated comprehensive receipt';
  const footerWidth = pdf.getTextWidth(footer);
  pdf.text(footer, (pageWidth - footerWidth) / 2, yPosition);

  const fileName = `comprehensive-receipt-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export const generateUserReceiptWithInventory = (
  userName: string,
  paddyEntries: PaddyEntryDetails[],
  payables: Array<{ date: string; amount: number; reason: string }>,
  receivables: Array<{ date: string; amount: number; reason: string }>,
  inventoryAllocations: Array<{
    id: string;
    item_name?: string;
    item_code?: string;
    quantity: number;
    unit_price?: number;
    allocation_date: string;
    purpose?: string;
    status: string;
  }>,
  paddyAmount: number,
  pendingPayables: number,
  pendingReceivables: number,
  netBalance: number
) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = 20;

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const title = 'COMPREHENSIVE RECEIPT';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  pdf.text(`User: ${userName}`, margin, yPosition);
  pdf.text(`Date: ${currentDate}`, pageWidth - margin - pdf.getTextWidth(`Date: ${currentDate}`), yPosition);
  yPosition += 10;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('FINANCIAL SUMMARY', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const summaryItems = [
    { label: 'Total Paddy Amount', value: `₹${paddyAmount.toLocaleString()}`, color: [34, 197, 94] },
    { label: 'Pending Payables', value: `₹${pendingPayables.toLocaleString()}`, color: [239, 68, 68] },
    { label: 'Pending Receivables', value: `₹${pendingReceivables.toLocaleString()}`, color: [34, 197, 94] },
  ];

  summaryItems.forEach(item => {
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, margin, yPosition);
    pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
    const valueWidth = pdf.getTextWidth(item.value);
    pdf.text(item.value, pageWidth - margin - valueWidth, yPosition);
    yPosition += 6;
  });

  yPosition += 2;
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('NET BALANCE', margin, yPosition);
  const netBalanceColor = netBalance >= 0 ? [34, 197, 94] : [239, 68, 68];
  pdf.setTextColor(netBalanceColor[0], netBalanceColor[1], netBalanceColor[2]);
  const netBalanceText = `₹${netBalance.toLocaleString()}`;
  const netBalanceWidth = pdf.getTextWidth(netBalanceText);
  pdf.text(netBalanceText, pageWidth - margin - netBalanceWidth, yPosition);
  yPosition += 4;

  pdf.setTextColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  if (inventoryAllocations.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`INVENTORY ALLOCATIONS (${inventoryAllocations.length})`, margin, yPosition);
    yPosition += 6;

    const inventoryTableHead = [['Date', 'Item Name', 'Code', 'Qty', 'Price', 'Amount', 'Status']];
    const inventoryTableBody = inventoryAllocations.map(allocation => {
      const totalAmount = (allocation.unit_price || 0) * allocation.quantity;
      return [
        new Date(allocation.allocation_date).toLocaleDateString('en-IN'),
        allocation.item_name || 'N/A',
        allocation.item_code || 'N/A',
        allocation.quantity.toString(),
        (allocation.unit_price || 0).toLocaleString(),
        totalAmount.toLocaleString(),
        allocation.status
      ];
    });

    autoTable(pdf, {
      startY: yPosition,
      head: inventoryTableHead,
      body: inventoryTableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 22 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 6;

    const inventoryTotal = inventoryAllocations.reduce((sum, a) => sum + ((a.unit_price || 0) * a.quantity), 0);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Inventory Total:', margin, yPosition);
    const inventoryTotalText = inventoryTotal.toLocaleString();
    const inventoryTotalWidth = pdf.getTextWidth(inventoryTotalText);
    pdf.setTextColor(99, 102, 241);
    pdf.text(inventoryTotalText, pageWidth - margin - inventoryTotalWidth, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;

    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`PADDY ENTRIES (${paddyEntries.length})`, margin, yPosition);
  yPosition += 6;

  if (paddyEntries.length > 0) {
    const paddyTableHead = [['Date', 'Lorry', 'Bags', 'KG/Bag', 'Rate', 'Amount']];
    const paddyTableBody = paddyEntries.map(entry => [
      entry.loadedDate.split('T')[0],
      entry.lorryNumber,
      entry.bags.toString(),
      entry.kgperBag.toString(),
      entry.bagAmount.toLocaleString(),
      entry.finalAmount.toLocaleString()
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: paddyTableHead,
      body: paddyTableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('No paddy entries found', margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`PAYABLES (${payables.length})`, margin, yPosition);
  yPosition += 6;

  if (payables.length > 0) {
    const payablesTableHead = [['Date', 'Reason', 'Amount']];
    const payablesTableBody = payables.map(txn => [
      new Date(txn.date).toLocaleDateString('en-IN'),
      txn.reason,
      `₹${txn.amount.toLocaleString()}`
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: payablesTableHead,
      body: payablesTableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 90 },
        2: { cellWidth: 30 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('No payables', margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`RECEIVABLES (${receivables.length})`, margin, yPosition);
  yPosition += 6;

  if (receivables.length > 0) {
    const receivablesTableHead = [['Date', 'Reason', 'Amount']];
    const receivablesTableBody = receivables.map(txn => [
      new Date(txn.date).toLocaleDateString('en-IN'),
      txn.reason,
      `₹${txn.amount.toLocaleString()}`
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: receivablesTableHead,
      body: receivablesTableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 90 },
        2: { cellWidth: 30 },
      },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('No receivables', margin, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  if (yPosition > pageHeight - 30) {
    pdf.addPage();
    yPosition = 20;
  }

  yPosition += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const thankYou = 'Thank you for your business!';
  const thankYouWidth = pdf.getTextWidth(thankYou);
  pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);

  yPosition += 6;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const footer = 'Computer-generated comprehensive receipt';
  const footerWidth = pdf.getTextWidth(footer);
  pdf.text(footer, (pageWidth - footerWidth) / 2, yPosition);

  const fileName = `comprehensive-receipt-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
