import jsPDF from 'jspdf';
import { PaddyEntryDetails } from '../types/paddy';

export const generatePaddyReceipt = (entry: PaddyEntryDetails, userName: string, userRole: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200]
  });

  const pageWidth = 80;
  let yPosition = 10;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const title = 'PADDY RECEIPT';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);

  yPosition += 2;
  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);

  yPosition += 6;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const currentDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  pdf.text(`Date: ${currentDate}`, 10, yPosition);
  yPosition += 5;

  const receiptId = entry.id ? `#${String(entry.id).substring(0, 8).toUpperCase()}` : '#N/A';
  pdf.text(`Receipt No: ${receiptId}`, 10, yPosition);
  yPosition += 5;

  const loadedDate = entry.loadedDate.split('T')[0];
  pdf.text(`Loaded: ${loadedDate}`, 10, yPosition);

  yPosition += 7;
  pdf.setLineWidth(0.3);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
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
  pdf.setFontSize(11);
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
  pdf.setFontSize(11);
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
  yPosition += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  const statusLabel = status === 'completed' ? 'PAID' : 'PENDING';
  const statusColor = status === 'completed' ? [34, 197, 94] : [234, 179, 8];

  pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.rect(10, yPosition - 3, pageWidth - 20, 6, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const statusWidth = pdf.getTextWidth(`Status: ${statusLabel}`);
  pdf.text(`Status: ${statusLabel}`, (pageWidth - statusWidth) / 2, yPosition + 1);

  pdf.setTextColor(0, 0, 0);
  yPosition += 8;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  const thankYou = 'Thank You for Your Business';
  const thankYouWidth = pdf.getTextWidth(thankYou);
  pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  const footer = 'This is a computer generated receipt';
  const footerWidth = pdf.getTextWidth(footer);
  pdf.text(footer, (pageWidth - footerWidth) / 2, yPosition);

  const fileName = `paddy-receipt-${entry.lorryNumber.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  pdf.save(fileName);
};

export const generateBulkPaddyReceipts = (entries: PaddyEntryDetails[], userName: string, userRole: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let isFirstPage = true;

  entries.forEach((entry, index) => {
    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(1);
    pdf.rect(margin - 5, 10, pageWidth - 2 * margin + 10, pdf.internal.pageSize.getHeight() - 20);

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const title = 'PADDY RECEIPT';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);

    yPosition += 3;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(34, 197, 94);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setDrawColor(0, 0, 0);

    const currentDate = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    pdf.text(`Print Date: ${currentDate}`, margin, yPosition);
    const receiptId = entry.id ? `#${String(entry.id).substring(0, 8).toUpperCase()}` : '#N/A';
    pdf.text(`Receipt No: ${receiptId}`, pageWidth - margin - 50, yPosition);

    yPosition += 8;
    const loadedDate = entry.loadedDate.split('T')[0];
    pdf.text(`Loaded Date: ${loadedDate}`, margin, yPosition);

    yPosition += 12;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('PARTY DETAILS', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const partyDetails = [
      { label: 'Rythu Name:', value: entry.rythu },
      { label: 'Dealer Name:', value: entry.dealer },
      { label: 'Lorry Number:', value: entry.lorryNumber },
    ];

    partyDetails.forEach(detail => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(detail.label, margin + 10, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(detail.value || 'N/A'), margin + 50, yPosition);
      yPosition += 7;
    });

    yPosition += 5;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('PADDY DETAILS', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const tableHeaders = ['Description', 'Quantity'];
    const col1X = margin + 10;
    const col2X = pageWidth - margin - 40;

    pdf.text(tableHeaders[0], col1X, yPosition);
    pdf.text(tableHeaders[1], col2X, yPosition);
    yPosition += 3;

    pdf.setLineWidth(0.2);
    pdf.line(margin + 10, yPosition, pageWidth - margin - 10, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'normal');
    const itemDetails = [
      { desc: 'Number of Bags', qty: String(entry.bags || 0) },
      { desc: 'KG per Bag', qty: String(entry.kgperBag || 0) },
      { desc: 'Total Weight (KG)', qty: `${entry.totalWeight?.toLocaleString() || '0'} KG` },
    ];

    itemDetails.forEach(item => {
      pdf.text(item.desc, col1X, yPosition);
      pdf.text(item.qty, col2X, yPosition);
      yPosition += 7;
    });

    yPosition += 5;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('PAYMENT DETAILS', margin, yPosition);
    yPosition += 8;

    const bagAmount = userRole === 'vendor' ? entry.dealerBagAmount : entry.bagAmount;
    const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
    const status = userRole === 'vendor' ? entry.dealerPaddyStatus : entry.status;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const amountDetails = [
      { label: 'Rate per Bag:', value: `₹${String(bagAmount || 0)}` },
      { label: 'Total Bags:', value: String(entry.bags || 0) },
      { label: 'Calculation:', value: `${entry.bags || 0} × ₹${String(bagAmount || 0)}` },
    ];

    amountDetails.forEach(detail => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(detail.label, margin + 10, yPosition);
      pdf.setFont('helvetica', 'normal');
      const valueWidth = pdf.getTextWidth(detail.value);
      pdf.text(detail.value, pageWidth - margin - 10 - valueWidth, yPosition);
      yPosition += 7;
    });

    yPosition += 5;
    pdf.setLineWidth(0.8);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('TOTAL AMOUNT:', margin + 10, yPosition);
    const totalText = `₹${(finalAmount || 0).toLocaleString()}`;
    const totalWidth = pdf.getTextWidth(totalText);
    pdf.text(totalText, pageWidth - margin - 10 - totalWidth, yPosition);

    yPosition += 3;
    pdf.setLineWidth(0.8);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    const statusLabel = status === 'completed' ? 'PAID' : 'PENDING PAYMENT';
    const statusColor = status === 'completed' ? [34, 197, 94] : [234, 179, 8];

    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.roundedRect(margin + 10, yPosition - 7, pageWidth - 2 * margin - 20, 12, 2, 2, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const statusWidth = pdf.getTextWidth(`Payment Status: ${statusLabel}`);
    pdf.text(`Payment Status: ${statusLabel}`, (pageWidth - statusWidth) / 2, yPosition);

    pdf.setTextColor(0, 0, 0);
    yPosition += 15;

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(11);
    const thankYou = 'Thank You for Your Business!';
    const thankYouWidth = pdf.getTextWidth(thankYou);
    pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);

    yPosition = pdf.internal.pageSize.getHeight() - 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    const footer = `This is a computer generated receipt | Page ${index + 1} of ${entries.length}`;
    const footerWidth = pdf.getTextWidth(footer);
    pdf.text(footer, (pageWidth - footerWidth) / 2, yPosition);
    pdf.setTextColor(0, 0, 0);
  });

  const fileName = `paddy-receipts-bulk-${Date.now()}.pdf`;
  pdf.save(fileName);
};
