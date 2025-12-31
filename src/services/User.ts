import { api } from './api';
import { User } from '../types/auth';

export const userService = {
  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};