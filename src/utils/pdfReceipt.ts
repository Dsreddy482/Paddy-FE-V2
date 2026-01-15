import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaddyEntryDetails } from '../types/paddy';

export const generatePaddyReceipt = (entry: PaddyEntryDetails, userName: string, userRole: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200]
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 10;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const title = 'PADDY RECEIPT';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 2;

  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  pdf.text(`Date: ${currentDate}`, 10, yPosition);
  yPosition += 4;

  const receiptId = entry.id ? `#${String(entry.id).substring(0, 8).toUpperCase()}` : '#N/A';
  pdf.text(`Receipt No: ${receiptId}`, 10, yPosition);
  yPosition += 4;

  const loadedDate = entry.loadedDate.split('T')[0];
  pdf.text(`Loaded: ${loadedDate}`, 10, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.3);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('PARTY DETAILS', 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  pdf.text(`Rythu: ${entry.rythu}`, 10, yPosition);
  yPosition += 4;

  pdf.text(`Dealer: ${entry.dealer}`, 10, yPosition);
  yPosition += 4;

  pdf.text(`Lorry No: ${entry.lorryNumber}`, 10, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.3);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('ITEM DETAILS', 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  const items = [
    { label: 'No. of Bags', value: String(entry.bags || 0) },
    { label: 'KG per Bag', value: String(entry.kgperBag || 0) },
    { label: 'Total Weight', value: `${entry.totalWeight?.toLocaleString() || '0'} KG` },
  ];

  items.forEach(item => {
    pdf.text(item.label, 10, yPosition);
    const valueWidth = pdf.getTextWidth(item.value);
    pdf.text(item.value, pageWidth - 10 - valueWidth, yPosition);
    yPosition += 4;
  });

  yPosition += 2;
  pdf.setLineWidth(0.3);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('AMOUNT DETAILS', 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  const bagAmount = userRole === 'vendor' ? entry.dealerBagAmount : entry.bagAmount;
  const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
  const status = userRole === 'vendor' ? entry.dealerPaddyStatus : entry.status;

  pdf.text('Rate per Bag', 10, yPosition);
  const rateText = `₹${(bagAmount || 0).toLocaleString()}`;
  const rateWidth = pdf.getTextWidth(rateText);
  pdf.text(rateText, pageWidth - 10 - rateWidth, yPosition);
  yPosition += 4;

  pdf.text(`Bags x Rate`, 10, yPosition);
  const calcText = `${entry.bags || 0} x ₹${(bagAmount || 0).toLocaleString()}`;
  const calcWidth = pdf.getTextWidth(calcText);
  pdf.text(calcText, pageWidth - 10 - calcWidth, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL AMOUNT', 10, yPosition);
  const totalText = `₹${(finalAmount || 0).toLocaleString()}`;
  const totalWidth = pdf.getTextWidth(totalText);
  pdf.text(totalText, pageWidth - 10 - totalWidth, yPosition);
  yPosition += 3;

  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  const statusLabel = status === 'paid' ? 'PAID ✓' :
                      status === 'pending' ? 'PENDING' :
                      'PARTIAL';
  const statusColor = status === 'paid' ? [34, 197, 94] :
                      status === 'pending' ? [239, 68, 68] :
                      [251, 191, 36];

  pdf.setTextColor(...statusColor);
  pdf.setFont('helvetica', 'bold');
  const statusWidth = pdf.getTextWidth(`Status: ${statusLabel}`);
  pdf.text(`Status: ${statusLabel}`, (pageWidth - statusWidth) / 2, yPosition + 1);
  pdf.setTextColor(0, 0, 0);

  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const thankYou = 'Thank you for your business!';
  const thankYouWidth = pdf.getTextWidth(thankYou);
  pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);

  yPosition += 5;
  pdf.setFontSize(7);
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
