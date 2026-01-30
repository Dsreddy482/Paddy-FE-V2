export interface LoadingEntry {
  userId?: string;
  loadingId?: number;
  lorryNumber: string;
  loadedDate: string;
  dealerId: string;
  amaliId: string;
  seasonId?: number;
  amaliName?: string;
  dealerName?: string;
  totalLoadWeight?: number;
  totalNoOfBags?: number;
  status?: string;
  loadType?: string;
  paymentDone?: boolean;
  id: number;
}

export interface LoadingEntryDetails {
  userId: string;
  lorryNumber: string;
  loadedDate: string;
  dealerId: string;
  amaliId: string;
  seasonId: number;
  amaliName: string;
  delaerName: string;
  id: number;
  totalLoadWeight?: number;
  totalNoOfBags?: number;
  status?: string;
  loadType?: string;
  paymentDone?: boolean;
}
