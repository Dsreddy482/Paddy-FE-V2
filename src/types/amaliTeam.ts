export interface AmaliTeam {
  id?: number;
  loadingId: number;
  paddyDetailId?: string;
  amaliTeamName: string;
  loadingType: 'potha' | 'kata' | 'loading' | 'potha_kata' | 'potha_loading' | 'kata_loading' | 'potha_kata_loading';
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
  rythu?: string;
  paddyBags?: number;
  totalWeight?: number;
}
