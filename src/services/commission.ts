import { api } from './api';
import { CommissionTransaction, CommissionSummary } from '../types/commission';

export const commissionService = {
  async getCommissionSummary(): Promise<CommissionSummary> {
    const response = await api.get('/api/Commission/summary');
    return response.data;
  },

  async getCommissionTransactions(startDate?: string, endDate?: string): Promise<CommissionTransaction[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/api/Commission/transactions?${params.toString()}`);
    return response.data;
  },

  async getTodayCommission(): Promise<number> {
    const response = await api.get('/api/Commission/today');
    return response.data;
  },

  async getMonthlyCommission(): Promise<number> {
    const response = await api.get('/api/Commission/monthly');
    return response.data;
  },
};
