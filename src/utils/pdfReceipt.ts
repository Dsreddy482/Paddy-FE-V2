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
  const statusColor = status === 'paid' ? [34, 197, 94] :
                      status === 'pending' ? [239, 68, 68] :
                      [251, 191, 36];

  pdf.setTextColor(...statusColor);
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
  const margin = 20;

  entries.forEach((entry, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    let yPosition = 20;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const title = 'PADDY RECEIPT';
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 8;

    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

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

    const rythuName = entry.rythu || 'N/A';
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
    const statusColor = status === 'paid' ? [34, 197, 94] :
                        status === 'pending' ? [239, 68, 68] :
                        [251, 191, 36];

    pdf.setTextColor(...statusColor);
    pdf.setFont('helvetica', 'bold');
    const statusWidth = pdf.getTextWidth(`Status: ${statusLabel}`);
    pdf.text(`Status: ${statusLabel}`, (pageWidth - statusWidth) / 2, yPosition);
    pdf.setTextColor(0, 0, 0);

    yPosition += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);

    const footerText = 'This is a computer-generated receipt';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, yPosition);
    pdf.setTextColor(0, 0, 0);
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
