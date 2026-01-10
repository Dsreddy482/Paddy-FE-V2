export interface LoadingEntry {
  id?: string;
  date: string;
  lorryNumber: string;
  dealer: string;
  amali: string;
  createdAt?: string;
}

export interface LoadingEntryDetails extends LoadingEntry {
  createdAt: string;
}
