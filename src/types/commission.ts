export interface CommissionTransaction {
  id?: string;
  loadingId: string;
  paddyEntryId?: string;
  totalBags: number;
  farmerPricePerBag: number;
  dealerPricePerBag: number;
  commissionPerBag: number;
  totalCommission: number;
  date: string;
  lorryNumber?: string;
  dealerName?: string;
  farmerName?: string;
}

export interface CommissionSummary {
  todayCommission: number;
  monthlyCommission: number;
  totalCommission: number;
  todayBags: number;
  monthlyBags: number;
  totalBags: number;
  transactions: CommissionTransaction[];
}
