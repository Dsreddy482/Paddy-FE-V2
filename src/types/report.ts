export interface DailyLoadingReport {
  date: string;
  lorryNumber: string;
  dealer: string;
  farmer: string;
  bags: number;
  weight: number;
  farmerAmount: number;
  dealerAmount: number;
  commission: number;
}

export interface MonthlyReport {
  month: string;
  totalBags: number;
  totalWeight: number;
  totalFarmerPayment: number;
  totalDealerCollection: number;
  totalCommission: number;
  totalAmaliPayment: number;
  netProfit: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  dealerId?: string;
  farmerId?: string;
  reportType: 'daily' | 'monthly' | 'custom';
}
