export interface LoadingEntry {
  userId?: string;
  lorryNumber: string;
  loadedDate: string;
  dealerId: string;
  amaliId: string;
  seasonId?: number;
  amaliName?: string;
  dealerName?: string;
}

export interface LoadingEntryDetails {
  userId: string;
  lorryNumber: string;
  loadedDate: string;
  dealerId: string;
  amaliId: string;
  seasonId: number;
  amaliName: string;
  dealerName: string;
}
