export interface Lorry {
  id?: string;
  lorryNumber: string;
  driverName: string;
  driverPhone: string;
  dealerId?: string;
  dealerName?: string;
  createdDate?: string;
}

export interface LorryStats {
  lorryId: string;
  lorryNumber: string;
  totalTrips: number;
  totalWeight: number;
  totalBags: number;
  driverName: string;
  driverPhone: string;
}
