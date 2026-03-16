export interface TeamInfo {
  teamId?: string;
  teamName: string;
  ratePerBag: number;
}

export interface LoadingEntry {
  userId?: string;
  loadingId?: number;
  lorryNumber: string;
  loadedDate: string;
  dealerId: string;
  amaliId: string;
  season_id?: string;
  amaliName?: string;
  dealerName?: string;
  totalLoadWeight?: number;
  totalNoOfBags?: number;
  status?: string;
  paymentDone?: boolean;
  id: number;

  isCombinedOperation?: boolean;
  combinedTeam?: TeamInfo;

  pothaTeam?: TeamInfo;
  kataTeam?: TeamInfo;
  loadingTeam?: TeamInfo;
}

export interface LoadingEntryDetails {
  userId: string;
  lorryNumber: string;
  loadedDate: string;
  dealerId: string;
  amaliId: string;
  season_id?: string;
  amaliName: string;
  delaerName: string;
  id: number;
  totalLoadWeight?: number;
  totalNoOfBags?: number;
  status?: string;
  paymentDone?: boolean;

  isCombinedOperation?: boolean;
  combinedTeam?: TeamInfo;

  pothaTeam?: TeamInfo;
  kataTeam?: TeamInfo;
  loadingTeam?: TeamInfo;
}
