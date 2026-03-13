import { api } from './api';
import { Season, CreateSeasonData, UpdateSeasonData } from '../types/season';

export const seasonService = {
  async getAllSeasons(): Promise<Season[]> {
    const response = await api.get('/api/seasons');
    return response.data;
  },

  async getActiveSeason(): Promise<Season | null> {
    const response = await api.get('/api/seasons/active');
    return response.data;
  },

  async getSeasonById(id: string): Promise<Season | null> {
    const response = await api.get(`/api/seasons/${id}`);
    return response.data;
  },

  async createSeason(seasonData: CreateSeasonData): Promise<Season> {
    const response = await api.post('/api/seasons', seasonData);
    return response.data;
  },

  async updateSeason(id: string, updates: UpdateSeasonData): Promise<Season> {
    const response = await api.put(`/api/seasons/${id}`, updates);
    return response.data;
  },

  async setActiveSeason(id: string): Promise<Season> {
    const response = await api.put(`/api/seasons/${id}/activate`);
    return response.data;
  },

  async deleteSeason(id: string): Promise<void> {
    await api.delete(`/api/seasons/${id}`);
  },

  async getSeasonsByYear(year: number): Promise<Season[]> {
    const response = await api.get(`/api/seasons/year/${year}`);
    return response.data;
  }
};
