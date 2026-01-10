import { api } from './api';
import { LoadingEntry, LoadingEntryDetails } from '../types/loading';

export const loadingService = {
  async getLoadingEntries(): Promise<LoadingEntryDetails[]> {
    try {
      const response = await api.post('/Account/getLoadingDetails');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch loading entries:', error);
      throw error;
    }
  },

  async createLoadingEntry(data: LoadingEntry): Promise<LoadingEntry> {
    try {
      const response = await api.post('/Account/insertLoadingDetails', {
        loadedDate: data.loadedDate,
        lorryNumber: data.lorryNumber,
        dealerId: data.dealerId,
        amaliId: data.amaliId,
        userId: data.userId || "0",
        seasonId: data.seasonId || 0
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create loading entry:', error);
      throw error;
    }
  },

  async updateLoadingEntry(userId: string, data: LoadingEntry): Promise<LoadingEntry> {
    try {
      const response = await api.post('/Account/updateLoadingDetails', {
        userId,
        loadedDate: data.loadedDate,
        lorryNumber: data.lorryNumber,
        dealerId: data.dealerId,
        amaliId: data.amaliId,
        seasonId: data.seasonId || 0
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update loading entry:', error);
      throw error;
    }
  },

  async deleteLoadingEntry(userId: string): Promise<void> {
    try {
      await api.post('/Account/deleteLoadingDetails', { userId });
    } catch (error) {
      console.error('Failed to delete loading entry:', error);
      throw error;
    }
  },
};
