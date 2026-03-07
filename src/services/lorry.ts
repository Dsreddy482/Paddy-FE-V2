import { api } from './api';
import { Lorry, LorryStats } from '../types/lorry';

export const lorryService = {
  async createLorry(lorry: Lorry): Promise<Lorry> {
    const response = await api.post('/api/Lorry', lorry);
    return response.data;
  },

  async updateLorry(id: string, lorry: Lorry): Promise<Lorry> {
    const response = await api.put(`/api/Lorry/${id}`, lorry);
    return response.data;
  },

  async getAllLorries(): Promise<Lorry[]> {
    const response = await api.get('/api/Lorry');
    return response.data;
  },

  async getLorryById(id: string): Promise<Lorry> {
    const response = await api.get(`/api/Lorry/${id}`);
    return response.data;
  },

  async getLorryStats(): Promise<LorryStats[]> {
    const response = await api.get('/api/Lorry/stats');
    return response.data;
  },

  async deleteLorry(id: string): Promise<void> {
    await api.delete(`/api/Lorry/${id}`);
  },
};
