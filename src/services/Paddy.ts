import { api } from './api';
import { PaddyEntry, PaddyEntryDetails } from '../types/paddy';

export const paddyService = {
  async createPaddyEntry(data: PaddyEntry) {
    try {
      const datass =  {
            "userId": data.userId,
            "lorryNumber": data.lorryNumber,
            "bags": data.bags,
            "kgperBag": data.kgsPerBag,
            "bagAmount": data.bagAmount,
            "loadedDate": data.loadedDate,
            "totalWeight": data.totalWeight,
            "dealerId": data.dealerId,
            "rythuId": data.rythuId,
            "dealerBagAmount": data.dealerBagAmount,
          }
      const response = await api.post('/Account/insertPaddy', datass);
      return response.data;
    } catch (error) {
      console.error('Failed to create paddy entry:', error);
      throw error;
    }
  },
  async updatePaddyEntry(id: string, data: Partial<PaddyEntry>) {
    try {
      const datass =  {
        "userId": data.userId,
        "lorryNumber": data.lorryNumber,
        "bags": data.bags,
        "kgperBag": data.kgsPerBag,
        "bagAmount": data.bagAmount,
        "loadedDate": data.loadedDate!.split('T')[0],
        "totalWeight": data.totalWeight,
        "dealerId": data.dealerId?.toString(),
        "dealerBagAmount": data.dealerBagAmount,
        "id": id,
      }
  const response = await api.post('/Account/updatePaddyDetails', datass);
  return response.data;
    } catch (error) {
      // For development, return mock data
      return {
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      };
    }
  },
  async getUserPaddyEntries(userId: string): Promise<PaddyEntryDetails[]> {
    try {
      const response = await api.get(`/Account/getPaddyDetails?userId=${userId}`);
      return response.data;
    } catch (error) {
      // For development, return mock data
      return [
        {
          id: '1',
          lorryNumber: 'AP 05 BD 1234',
          totalWeight: 5000,
          bags: 100,
          kgperBag: 50,
          bagAmount: 2000,
          loadedDate: '15/03/2024',
          userId,
          finalAmount: 0,
          dealer: '',
          status: ''
        },
        {
          id: '2',
          lorryNumber: 'TS 09 XY 5678',
          bags: 60,
          kgperBag: 50,
          bagAmount: 1950,
          loadedDate: '14/03/2024',
          userId,
          totalWeight: 3000,
          finalAmount: 0,
          dealer: '',
          status: ''
        }
      ];
    }
  },
  async updatePaddyStatus(id: string, status: 'pending' | 'completed', userRole: string ): Promise<PaddyEntryDetails> {
    try {
      const datass =  {
        "id": id,
        'status': status,
        userRole
      }
      const response = await api.post(`/Account/updatePaddy`, datass );
      return response.data;
    } catch (error) {
      // For development, return mock data
      return {
        id,
        lorryNumber: 'AP 05 BD 1234',
        totalWeight: 5000,
        bags: 100,
        kgperBag: 50,
        bagAmount: 2000,
        loadedDate: '15/03/2024',
        finalAmount: 0,
        dealer: '',
        status: '',
      };
    }
  },
  async getAllPaddyEntries(): Promise<PaddyEntryDetails[]> {
    try {
      const response = await api.get(`/Account/getPaddyDetails?userId=0`);
      return response.data;
    } catch (error) {
      // For development, return mock data
      return [
        {
          id: '1',
          lorryNumber: 'AP 05 BD 1234',
          bags: 100,
          kgPerBag: 50,
          bagAmount: 2000,
          dealerBagAmount: 1900,
          loadedDate: '2024-03-15',
          userId: '1',
          dealerId: '3',
          totalWeight: 5000,
          createdAt: '2024-03-15T10:30:00Z',
          status: 'completed',
          rythu: 'John Doe',
          dealer: 'Bob Wilson',
          finalAmount: 200000,
        },
        {
          id: '2',
          lorryNumber: 'TS 09 XY 5678',
          weight: 3000,
          bags: 60,
          kgsPerBag: 50,
          bagAmount: 1950,
          dealerBagAmount: 1850,
          loadedDate: '2024-03-14',
          userId: '2',
          dealerId: '4',
          totalWeight: 3000,
          createdAt: '2024-03-14T15:45:00Z',
          status: 'pending',
          rythu: 'Jane Smith',
          dealer: 'Alice Johnson',
          finalAmount: 117000,
        }
      ];
    }
  },
};