export interface PaddyEntry {
    id?: string;
    lorryNumber: string;
    bags: number;
    kgsPerBag: number;
    bagAmount: number;
    loadedDate: string;
    totalWeight?: number;
    userId?: string;
    dealerId?: string;
    rythuId?: string;
    dealerBagAmount: number;
    loadingId?: string;
    loadType?: string;
  }

  export interface PaddyEntryDetails {
    status: string;
    id?: string;
    lorryNumber: string;
    bags: number;
    kgperBag: number;
    bagAmount: number;
    loadedDate: string;
    totalWeight?: number;
    userId?: string;
    finalAmount: number;
    dealer: string;
    rythu: string;
    dealerPaddyStatus:string;
    dealerBagAmount:number;
    dealerFinalAmount:number;
    dealerId: string;
    rythuPhone?: string;
    dealerPhone?: string;
    loadType?: string;
  }