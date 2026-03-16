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
      const payload = {
        loadingId: data.loadingId,
        amaliTeamName: data.amaliTeamName,
        loadingType: data.loadingType,
        ratePerBag: data.ratePerBag
      };
      const response = await api.post('/Account/insertAmaliTeam', payload);
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
