export interface FarmerPayment {
  id?: string;
  farmerId: string;
  farmerName?: string;
  paddyEntryId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  createdDate?: string;
}

export interface DealerPayment {
  id?: string;
  dealerId: string;
  dealerName?: string;
  loadingId: string;
  totalAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  paymentDate: string;
  paymentMode: string;
  notes?: string;
  createdDate?: string;
}

export interface AmaliPayment {
  id?: string;
  amaliId: string;
  amaliName?: string;
  loadingId: string;
  totalBags: number;
  ratePerBag: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentDate?: string;
  createdDate?: string;
}

export interface FarmerLedger {
  farmerId: string;
  farmerName: string;
  totalBags: number;
  totalAmount: number;
  totalPaid: number;
  pendingBalance: number;
  payments: FarmerPayment[];
}

export interface DealerLedger {
  dealerId: string;
  dealerName: string;
  totalBags: number;
  totalAmount: number;
  totalReceived: number;
  pendingAmount: number;
  payments: DealerPayment[];
}

export interface AmaliLedger {
  amaliId: string;
  amaliName: string;
  totalBags: number;
  totalPayableAmount: number;
  totalPaid: number;
  pendingAmount: number;
  payments: AmaliPayment[];
}
