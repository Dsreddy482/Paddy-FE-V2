export const shareOnWhatsApp = (message: string, phoneNumber?: string) => {
  const encodedMessage = encodeURIComponent(message);
  const phone = phoneNumber ? `phone=${phoneNumber}&` : '';
  const url = `https://api.whatsapp.com/send?${phone}text=${encodedMessage}`;
  window.open(url, '_blank');
};

export const formatLoadingDetailsForWhatsApp = (entry: {
  lorryNumber: string;
  loadedDate: string;
  delaerName: string;
  amaliName: string;
  totalNoOfBags: number;
  totalLoadWeight: number;
  paddyDetails?: Array<{
    rythu: string;
    bags: number;
    kgperBag: number;
    totalWeight: number;
    bagAmount: number;
    dealerBagAmount: number;
  }>;
}) => {
  const formattedDate = new Date(entry.loadedDate).toLocaleDateString();

  let message = `*Loading Details*\n\n`;
  message += `📅 Date: ${formattedDate}\n`;
  message += `🚛 Lorry Number: ${entry.lorryNumber}\n`;
  message += `👤 Dealer: ${entry.delaerName}\n`;
  message += `👤 Amali: ${entry.amaliName}\n`;
  message += `📦 Total Bags: ${entry.totalNoOfBags}\n`;
  message += `⚖️ Total Weight: ${entry.totalLoadWeight} kg\n`;

  if (entry.paddyDetails && entry.paddyDetails.length > 0) {
    message += `\n*Paddy Details (${entry.paddyDetails.length} entries):*\n\n`;
    entry.paddyDetails.forEach((paddy, index) => {
      message += `${index + 1}. ${paddy.rythu}\n`;
      message += `   Bags: ${paddy.bags} | KG/Bag: ${paddy.kgperBag}\n`;
      message += `   Weight: ${paddy.totalWeight}kg | Amount: ₹${paddy.bagAmount}/bag\n`;
      message += `   Dealer Amount: ₹${paddy.dealerBagAmount}/bag\n\n`;
    });
  }

  return message;
};

export const formatPaddyEntryForWhatsApp = (
  entry: {
    lorryNumber: string;
    loadedDate: string;
    totalWeight: number;
    bags: number;
    kgperBag: number;
    bagAmount: number;
    finalAmount: number;
    status?: string;
  },
  userName: string
) => {
  const formattedDate = entry.loadedDate.split('T')[0];

  let message = `*Paddy Entry Details*\n\n`;
  message += `👤 User: ${userName}\n`;
  message += `📅 Date: ${formattedDate}\n`;
  message += `🚛 Lorry: ${entry.lorryNumber}\n`;
  message += `⚖️ Weight: ${entry.totalWeight.toLocaleString()} kg\n`;
  message += `📦 Bags: ${entry.bags.toLocaleString()}\n`;
  message += `📏 KG per Bag: ${entry.kgperBag.toLocaleString()}\n`;
  message += `💰 Amount/Bag: ₹${entry.bagAmount.toLocaleString()}\n`;
  message += `💵 Total: ₹${entry.finalAmount.toLocaleString()}\n`;
  if (entry.status) {
    message += `📊 Status: ${entry.status}\n`;
  }

  return message;
};

export const formatUserSummaryForWhatsApp = (
  userName: string,
  paddyAmount: number,
  pendingPayables: number,
  pendingReceivables: number,
  netBalance: number
) => {
  let message = `*User Summary*\n\n`;
  message += `👤 Name: ${userName}\n\n`;
  message += `💰 Paddy Amount: ₹${paddyAmount.toLocaleString()}\n`;
  message += `📤 Pending Payables: ₹${pendingPayables.toLocaleString()}\n`;
  message += `📥 Pending Receivables: ₹${pendingReceivables.toLocaleString()}\n`;
  message += `💵 Net Balance: ₹${netBalance.toLocaleString()}\n`;

  return message;
};

export const formatFarmerPaymentNotification = (
  farmerName: string,
  bags: number,
  weight: number,
  totalAmount: number,
  paidAmount: number,
  balanceAmount: number
) => {
  let message = `*Farmer Payment Notification*\n\n`;
  message += `👤 Dear ${farmerName},\n\n`;
  message += `Your paddy has been loaded successfully.\n\n`;
  message += `📦 Bags: ${bags}\n`;
  message += `⚖️ Weight: ${weight} kg\n`;
  message += `💰 Total Amount: ₹${totalAmount.toLocaleString()}\n`;
  message += `✅ Paid: ₹${paidAmount.toLocaleString()}\n`;
  message += `⏳ Balance: ₹${balanceAmount.toLocaleString()}\n\n`;
  message += `Thank you for your business!\n`;

  return message;
};

export const formatDealerPaymentNotification = (
  dealerName: string,
  lorryNumber: string,
  bags: number,
  totalAmount: number,
  receivedAmount: number,
  pendingAmount: number
) => {
  let message = `*Dealer Payment Received*\n\n`;
  message += `👤 Dear ${dealerName},\n\n`;
  message += `Payment received for:\n\n`;
  message += `🚛 Lorry: ${lorryNumber}\n`;
  message += `📦 Bags: ${bags}\n`;
  message += `💰 Total Amount: ₹${totalAmount.toLocaleString()}\n`;
  message += `✅ Received: ₹${receivedAmount.toLocaleString()}\n`;
  message += `⏳ Pending: ₹${pendingAmount.toLocaleString()}\n\n`;
  message += `Thank you for your payment!\n`;

  return message;
};

export const formatAmaliPaymentNotification = (
  amaliName: string,
  bags: number,
  totalAmount: number,
  paidAmount: number,
  pendingAmount: number
) => {
  let message = `*Amali Payment Notification*\n\n`;
  message += `👤 Dear ${amaliName},\n\n`;
  message += `Payment details:\n\n`;
  message += `📦 Bags Loaded: ${bags}\n`;
  message += `💰 Total Amount: ₹${totalAmount.toLocaleString()}\n`;
  message += `✅ Paid: ₹${paidAmount.toLocaleString()}\n`;
  message += `⏳ Pending: ₹${pendingAmount.toLocaleString()}\n\n`;
  message += `Thank you for your service!\n`;

  return message;
};
