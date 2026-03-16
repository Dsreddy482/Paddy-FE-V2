export interface AmaliTeam {
  id?: number;
  loadingId: number;
  amaliTeamName: string;
  loadingType: 'potha' | 'kata' | 'loading' | 'combined';
  ratePerBag: number;
  totalBags?: number;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AmaliTeamDetails extends AmaliTeam {
  loadedDate?: string;
  lorryNumber?: string;
  dealerName?: string;
  amaliName?: string;
}
