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
      const payload: any = {
        loadedDate: data.loadedDate,
        lorryNumber: data.lorryNumber,
        dealerId: data.dealerId,
        amaliId: data.amaliId,
        userId: data.userId || "0",
        seasonId: data.season_id || 1,
        isCombinedOperation: data.isCombinedOperation || false
      };

      if (data.isCombinedOperation && data.combinedTeam) {
        payload.combinedTeamName = data.combinedTeam.teamName;
        payload.combinedRatePerBag = data.combinedTeam.ratePerBag;
      } else {
        if (data.pothaTeam) {
          payload.pothaTeamName = data.pothaTeam.teamName;
          payload.pothaRatePerBag = data.pothaTeam.ratePerBag;
        }
        if (data.kataTeam) {
          payload.kataTeamName = data.kataTeam.teamName;
          payload.kataRatePerBag = data.kataTeam.ratePerBag;
        }
        if (data.loadingTeam) {
          payload.loadingTeamName = data.loadingTeam.teamName;
          payload.loadingRatePerBag = data.loadingTeam.ratePerBag;
        }
      }

      const response = await api.post('/Account/insertLoadingDetails', payload);
      return response.data;
    } catch (error) {
      console.error('Failed to create loading entry:', error);
      throw error;
    }
  },

  async updateLoadingEntry(userId: string, data: LoadingEntry): Promise<LoadingEntry> {
    try {
      const payload: any = {
        userId,
        loadingId: data.id,
        loadedDate: data.loadedDate,
        lorryNumber: data.lorryNumber,
        dealerId: data.dealerId,
        amaliId: data.amaliId,
        seasonId: data.season_id || 1,
        totalLoadWeight: data.totalLoadWeight || 0,
        totalNoOfBags: data.totalNoOfBags || 0,
        status: data.status || 'loading not started',
        paymentDone: data.paymentDone || false,
        isCombinedOperation: data.isCombinedOperation || false
      };

      if (data.isCombinedOperation && data.combinedTeam) {
        payload.combinedTeamName = data.combinedTeam.teamName;
        payload.combinedRatePerBag = data.combinedTeam.ratePerBag;
      } else {
        if (data.pothaTeam) {
          payload.pothaTeamName = data.pothaTeam.teamName;
          payload.pothaRatePerBag = data.pothaTeam.ratePerBag;
        }
        if (data.kataTeam) {
          payload.kataTeamName = data.kataTeam.teamName;
          payload.kataRatePerBag = data.kataTeam.ratePerBag;
        }
        if (data.loadingTeam) {
          payload.loadingTeamName = data.loadingTeam.teamName;
          payload.loadingRatePerBag = data.loadingTeam.ratePerBag;
        }
      }

      const response = await api.post('/Account/updateLoadingDetails', payload);
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
