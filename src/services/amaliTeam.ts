import { api } from './api';
import { AmaliTeam, AmaliTeamDetails } from '../types/amaliTeam';

export const amaliTeamService = {
  async getAmaliTeamsByLoading(loadingId: number): Promise<AmaliTeam[]> {
    try {
      const response = await api.post('/Account/getAmaliTeamsByLoading', { loadingId });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch amali teams:', error);
      throw error;
    }
  },

  async getAmaliTeamsByPaddyDetail(paddyDetailId: string): Promise<AmaliTeam[]> {
    try {
      const response = await api.post('/Account/getAmaliTeamsByPaddyDetail', { paddyDetailId: parseInt(paddyDetailId, 10) });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch amali teams by paddy detail:', error);
      throw error;
    }
  },

  async getAmaliTeamsByAmaliName(amaliName: string): Promise<AmaliTeamDetails[]> {
    try {
      const response = await api.post('/Account/getAmaliTeamsByAmaliName', { amaliName });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch amali teams by name:', error);
      throw error;
    }
  },

  async getAllAmaliTeams(): Promise<AmaliTeamDetails[]> {
    try {
      const response = await api.post('/Account/getAllAmaliTeams');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all amali teams:', error);
      throw error;
    }
  },

  async getAmaliTeamsByAmali(amaliId: string): Promise<AmaliTeamDetails[]> {
    try {
      const response = await api.post('/Account/getAmaliTeamsByAmali', { amaliId });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch amali teams by amali:', error);
      throw error;
    }
  },

  async createAmaliTeam(data: AmaliTeam): Promise<AmaliTeam> {
    try {
      const dto: any = {
        loadingId: data.loadingId,
        amaliTeamName: data.amaliTeamName,
        loadingType: data.loadingType,
        ratePerBag: data.ratePerBag
      };
      if (data.paddyDetailId !== undefined && data.paddyDetailId !== null) {
        dto.paddyDetailId = parseInt(data.paddyDetailId, 10);
      }
      const response = await api.post('/Account/insertAmaliTeam', { dto });
      return response.data;
    } catch (error) {
      console.error('Failed to create amali team:', error);
      throw error;
    }
  },

  async updateAmaliTeam(teamId: number, data: AmaliTeam): Promise<AmaliTeam> {
    try {
      const payload = {
        id: teamId,
        loadingId: data.loadingId,
        amaliTeamName: data.amaliTeamName,
        loadingType: data.loadingType,
        ratePerBag: data.ratePerBag,
        totalBags: data.totalBags,
        totalAmount: data.totalAmount
      };
      const response = await api.post('/Account/updateAmaliTeam', payload);
      return response.data;
    } catch (error) {
      console.error('Failed to update amali team:', error);
      throw error;
    }
  },

  async deleteAmaliTeam(teamId: number): Promise<void> {
    try {
      await api.post('/Account/deleteAmaliTeam', { id: teamId });
    } catch (error) {
      console.error('Failed to delete amali team:', error);
      throw error;
    }
  }
};
