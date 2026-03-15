import { api } from './api';
import { Season, CreateSeasonData, UpdateSeasonData } from '../types/season';

export const seasonService = {
  async getAllSeasons(): Promise<Season[]> {
    const response = await api.get('/api/season');
    return response.data;
  },

  async getActiveSeason(): Promise<Season | null> {
    const response = await api.get('/api/season/active');
    return response.data;
  },

  async getSeasonById(id: string): Promise<Season | null> {
    const response = await api.get(`/api/season/${id}`);
    return response.data;
  },

  async createSeason(seasonData: CreateSeasonData): Promise<Season> {
    const response = await api.post('/api/season', seasonData);
    return response.data;
  },

  async updateSeason(id: string, updates: UpdateSeasonData): Promise<Season> {
    const response = await api.put(`/api/season/${id}`, updates);
    return response.data;
  },

  async setActiveSeason(id: string): Promise<Season> {
    const response = await api.put(`/api/season/${id}/activate`);
    return response.data;
  },

  async deleteSeason(id: string): Promise<void> {
    await api.delete(`/api/season/${id}`);
  },

  async getSeasonsByYear(year: number): Promise<Season[]> {
    const response = await api.get(`/api/season/year/${year}`);
    return response.data;
  }
};
