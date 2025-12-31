import { User } from './auth';

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  amount: number;
  reason: string;
  type: 'payable' | 'receivable';
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface TransactionDetails extends Transaction {
  user?: User;
}