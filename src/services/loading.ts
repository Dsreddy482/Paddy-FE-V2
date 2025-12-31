import { api } from './api';
import { LoadingEntry, LoadingEntryDetails } from '../types/loading';

export const loadingService = {
  async getLoadingEntries(): Promise<LoadingEntryDetails[]> {
    try {
      const response = await api.get('/Account/getLoadingDetails');
      return response.data;
    } catch (error) {
      return [
        {
          id: '1',
          date: '2024-03-15',
          lorryNumber: 'AP 05 BD 1234',
          dealer: 'John Doe',
          amali: 5000,
          createdAt: '2024-03-15T10:30:00Z',
        },
        {
          id: '2',
          date: '2024-03-14',
          lorryNumber: 'TS 09 XY 5678',
          dealer: 'Jane Smith',
          amali: 3000,
          createdAt: '2024-03-14T15:45:00Z',
        }
      ];
    }
  },

  async createLoadingEntry(data: LoadingEntry): Promise<LoadingEntry> {
    try {
      const response = await api.post('/Account/insertLoadingDetails', {
        date: data.date,
        lorryNumber: data.lorryNumber,
        dealer: data.dealer,
        amali: data.amali,
      });
      return response.data;
    } catch (error) {
      return {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
    }
  },

  async updateLoadingEntry(id: string, data: Partial<LoadingEntry>): Promise<LoadingEntry> {
    try {
      const response = await api.post('/Account/updateLoadingDetails', {
        id,
        date: data.date,
        lorryNumber: data.lorryNumber,
        dealer: data.dealer,
        amali: data.amali,
      });
      return response.data;
    } catch (error) {
      return {
        ...data,
        id,
      } as LoadingEntry;
    }
  },

  async deleteLoadingEntry(id: string): Promise<void> {
    try {
      await api.post('/Account/deleteLoadingDetails', { id });
    } catch (error) {
      console.error('Failed to delete loading entry:', error);
    }
  },
};
