import { api } from './api';
import { Transaction } from '../types/transaction';

// Mock data for development
let transactions: Transaction[] = [];

export const transactionService = {
  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    try {
      const response = await api.post('/Account/createTransaction', data);
      return response.data;
    } catch (error) {
      // For development, return mock data
      const newTransaction: Transaction = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      transactions.push(newTransaction);
      return newTransaction;
    }
  },

  async getUserTransactions(userId: string, type?: 'payable' | 'receivable'): Promise<Transaction[]> {
    try {
      const data ={'userId': userId, 'type': type }
      const response = await api.post('/Account/getUserTransactions', data);
      return response.data;
    } catch (error) {
      // For development, return filtered mock data
      return transactions.filter(t => 
        t.userId === userId && (!type || t.type === type)
      );
    }
  },

  async updateTransactionStatus(id: string, userId: string, status: 'pending' | 'completed', type?: 'payable' | 'receivable'): Promise<Transaction> {
    try {
      const data ={'id': id, 'type': type, 'status': status, 'userId': userId }
      const response = await api.post('/Account/updateTransactionStatus', data);
      return response.data;
    } catch (error) {
      // For development, update mock data
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        transaction.status = status;
        return transaction;
      }
      throw new Error('Transaction not found');
    }
  }
};