import { LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { api } from './api';
import { mockApi } from './mockApi';

export const authService = {
  async login(credentials: LoginCredentials) {
    const { data } = await api.post('/Account/login', credentials);
    return data;
  },

  async register(credentials: RegisterCredentials) {
    const { data } = await api.post('/Account/register', credentials);
    return data;
  },

  async updateUser(id: string, credentials: RegisterCredentials) {
    const datass =  {
      "id": id,
      "fullName":credentials.fullName,
       "email":credentials.email,
       "role":credentials.role,
       "password": "",
       "phoneNumber": credentials.phoneNumber
    }
    const { data } = await api.post('/Account/updateUser', datass);
    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get('/Account/getUserDetails');
    return data;
  },

  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await api.post('/Account/getSearchUser',{'search': query});
      return response.data;
    } catch (error) {
      // Fallback to mock API for development
      return mockApi.searchUsers(query);
    }
  },

  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get(`/Account/getUserDetails?userId=${id}`);
      return response.data;
    } catch (error) {
      // Fallback to mock API for development
      return mockApi.getUserById(id);
    }
  },
  async getDealers(): Promise<User[]> {
    try {
      const response =  await api.post('/Account/getSearchUserbyRole',{'search': 'vendor'});
      return response.data;
    } catch (error) {
      // Fallback to mock API for development
      return mockApi.getDealers();
    }
  }
};