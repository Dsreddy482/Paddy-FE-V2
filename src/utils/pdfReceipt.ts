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
  const currentDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const receiptId = entry.id ? `#${String(entry.id).substring(0, 8).toUpperCase()}` : '#N/A';
  const loadedDate = entry.loadedDate.split('T')[0];

  pdf.text(`Date: ${currentDate}`, margin, yPosition);
  const midPoint = pageWidth / 2;
  pdf.text(`Receipt No: ${receiptId}`, midPoint, yPosition);
  yPosition += 5;
  pdf.text(`Loaded: ${loadedDate}`, margin, yPosition);
  yPosition += 10;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('PARTY DETAILS', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const rythuName = entry.rythu || 'N/A';
  pdf.text(`Rythu: ${rythuName}`, margin, yPosition);
  pdf.text(`Lorry No: ${entry.lorryNumber}`, pageWidth / 2, yPosition);
  yPosition += 10;

  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('ITEM DETAILS', margin, yPosition);
  yPosition += 8;

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
    yPosition += 6;
  });

  yPosition += 4;
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('AMOUNT DETAILS', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  const bagAmount = userRole === 'vendor' ? entry.dealerBagAmount : entry.bagAmount;
  const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
  const status = userRole === 'vendor' ? entry.dealerPaddyStatus : entry.status;

  pdf.text('Rate per Bag', margin, yPosition);
  const rateText = `${(bagAmount || 0).toLocaleString()}`;
  const rateWidth = pdf.getTextWidth(rateText);
  pdf.text(rateText, pageWidth - margin - rateWidth, yPosition);
  yPosition += 6;

  pdf.text(`Bags x Rate`, margin, yPosition);
  const calcText = `${entry.bags || 0} x ${(bagAmount || 0).toLocaleString()}`;
  const calcWidth = pdf.getTextWidth(calcText);
  pdf.text(calcText, pageWidth - margin - calcWidth, yPosition);
  yPosition += 10;

  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('TOTAL AMOUNT', margin, yPosition);
  const totalText = `${(finalAmount || 0).toLocaleString()}`;
  const totalWidth = pdf.getTextWidth(totalText);
  pdf.text(totalText, pageWidth - margin - totalWidth, yPosition);
  yPosition += 5;

  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);

  const statusLabel = status === 'paid' ? 'PAID ✓' :
                      status === 'pending' ? 'PENDING' :
                      'PARTIAL';
  const statusColor = status === 'paid' ? [34, 197, 94] :
                      status === 'pending' ? [239, 68, 68] :
                      [251, 191, 36];

  pdf.setTextColor(...statusColor);
  pdf.setFont('helvetica', 'bold');
  const statusWidth = pdf.getTextWidth(`Status: ${statusLabel}`);
  pdf.text(`Status: ${statusLabel}`, (pageWidth - statusWidth) / 2, yPosition);
  pdf.setTextColor(0, 0, 0);

  yPosition += 12;
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
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  pdf.setFontSize(20);
  pdf.text('Paddy Receipts Report', 14, 15);

  pdf.setFontSize(12);
  pdf.text(`User: ${userName}`, 14, 25);
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 32);
  pdf.text(`Total Entries: ${entries.length}`, 14, 39);

  const tableHead = [
    [
      'Lorry No.',
      'Date',
      'Bags',
      'KG/Bag',
      'Weight (KG)',
      'Rate/Bag',
      'Amount'
    ]
  ];

  const tableBody = entries.map(entry => {
    const bagAmount = userRole === 'vendor' ? entry.dealerBagAmount : entry.bagAmount;
    const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
    const loadedDate = entry.loadedDate.split('T')[0];

    return [
      entry.lorryNumber,
      loadedDate,
      String(entry.bags || 0),
      String(entry.kgperBag || 0),
      entry.totalWeight?.toLocaleString() || '0',
      `${(bagAmount || 0).toLocaleString()}`,
      `${(finalAmount || 0).toLocaleString()}`
    ];
  });

  autoTable(pdf, {
    startY: 45,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: 0,
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
      6: { cellWidth: 40, halign: 'center' }
    }
  });

  const finalY = (pdf as any).lastAutoTable.finalY + 10;

  if (entries.length > 1) {
    const totalWeight = entries.reduce((sum, entry) => sum + (entry.totalWeight || 0), 0);
    const totalBags = entries.reduce((sum, entry) => sum + (entry.bags || 0), 0);
    const grandTotal = entries.reduce((sum, entry) => {
      const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
      return sum + (finalAmount || 0);
    }, 0);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary:', 14, finalY);

    const summaryData = [
      ['Total Entries', entries.length.toString()],
      ['Total Bags', totalBags.toLocaleString()],
      ['Total Weight (KG)', totalWeight.toLocaleString()],
      ['Grand Total Amount', `${grandTotal.toLocaleString()}`]
    ];

    autoTable(pdf, {
      startY: finalY + 5,
      body: summaryData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold', fontSize: 11 },
        1: { cellWidth: 60, halign: 'right', fontSize: 11 }
      },
      styles: {
        cellPadding: 3
      }
    });
  }

  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Generated on: ${new Date().toLocaleString('en-IN')} | Computer-generated report`, 14, pageHeight - 10);
  pdf.setTextColor(0, 0, 0);

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
  const dateTime = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
