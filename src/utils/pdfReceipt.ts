import jsPDF from 'jspdf';
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
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297]
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

  pdf.text(`User: ${userName}`, 10, yPosition);
  yPosition += 4;

  pdf.text(`Entries: ${entries.length}`, 10, yPosition);
  yPosition += 6;

  pdf.setLineWidth(0.3);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  let grandTotal = 0;
  let totalBags = 0;
  let totalWeight = 0;

  entries.forEach((entry, index) => {
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 10;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`#${index + 1}`, 10, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    pdf.text(`Rythu: ${entry.rythu || 'N/A'}`, 10, yPosition);
    yPosition += 3;

    pdf.text(`Dealer: ${entry.dealer || 'N/A'}`, 10, yPosition);
    yPosition += 3;

    pdf.text(`Lorry: ${entry.lorryNumber}`, 10, yPosition);
    yPosition += 3;

    const loadedDate = entry.loadedDate.split('T')[0];
    pdf.text(`Date: ${loadedDate}`, 10, yPosition);
    yPosition += 4;

    const items = [
      { label: 'Bags', value: String(entry.bags || 0) },
      { label: 'KG/Bag', value: String(entry.kgperBag || 0) },
      { label: 'Weight', value: `${entry.totalWeight?.toLocaleString() || '0'} KG` },
    ];

    items.forEach(item => {
      pdf.text(item.label, 12, yPosition);
      const valueWidth = pdf.getTextWidth(item.value);
      pdf.text(item.value, pageWidth - 10 - valueWidth, yPosition);
      yPosition += 3;
    });

    yPosition += 1;

    const bagAmount = userRole === 'vendor' ? entry.dealerBagAmount : entry.bagAmount;
    const finalAmount = userRole === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
    const status = userRole === 'vendor' ? entry.dealerPaddyStatus : entry.status;

    pdf.text('Rate/Bag', 12, yPosition);
    const rateText = `₹${(bagAmount || 0).toLocaleString()}`;
    const rateWidth = pdf.getTextWidth(rateText);
    pdf.text(rateText, pageWidth - 10 - rateWidth, yPosition);
    yPosition += 3;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount', 12, yPosition);
    const amtText = `₹${(finalAmount || 0).toLocaleString()}`;
    const amtWidth = pdf.getTextWidth(amtText);
    pdf.text(amtText, pageWidth - 10 - amtWidth, yPosition);
    yPosition += 3;

    const statusLabel = status === 'paid' ? 'PAID ✓' :
                        status === 'pending' ? 'PENDING' :
                        'PARTIAL';
    const statusColor = status === 'paid' ? [34, 197, 94] :
                        status === 'pending' ? [239, 68, 68] :
                        [251, 191, 36];

    pdf.setTextColor(...statusColor);
    pdf.setFontSize(7);
    pdf.text(`[${statusLabel}]`, 12, yPosition);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    yPosition += 4;
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, yPosition, pageWidth - 10, yPosition);
    pdf.setDrawColor(0, 0, 0);
    yPosition += 4;

    grandTotal += finalAmount || 0;
    totalBags += entry.bags || 0;
    totalWeight += entry.totalWeight || 0;
  });

  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 10;
  }

  yPosition += 2;
  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('SUMMARY', 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  const summaryItems = [
    { label: 'Total Entries:', value: String(entries.length) },
    { label: 'Total Bags:', value: totalBags.toLocaleString() },
    { label: 'Total Weight:', value: `${totalWeight.toLocaleString()} KG` },
  ];

  summaryItems.forEach(item => {
    pdf.text(item.label, 10, yPosition);
    const valueWidth = pdf.getTextWidth(item.value);
    pdf.text(item.value, pageWidth - 10 - valueWidth, yPosition);
    yPosition += 4;
  });

  yPosition += 2;
  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('GRAND TOTAL', 10, yPosition);
  const grandTotalText = `₹${grandTotal.toLocaleString()}`;
  const grandTotalWidth = pdf.getTextWidth(grandTotalText);
  pdf.text(grandTotalText, pageWidth - 10 - grandTotalWidth, yPosition);
  yPosition += 2;

  pdf.setLineWidth(0.5);
  pdf.line(10, yPosition, pageWidth - 10, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const thankYou = 'Thank you for your business!';
  const thankYouWidth = pdf.getTextWidth(thankYou);
  pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);

  yPosition += 4;
  pdf.setFontSize(7);
  pdf.setTextColor(128, 128, 128);
  const footer = 'Computer-generated receipt';
  const footerWidth = pdf.getTextWidth(footer);
  pdf.text(footer, (pageWidth - footerWidth) / 2, yPosition);
  pdf.setTextColor(0, 0, 0);

  pdf.save(`paddy_receipts_bulk_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
};
