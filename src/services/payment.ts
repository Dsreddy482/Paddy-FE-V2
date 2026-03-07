import { api } from './api';
import { FarmerPayment, DealerPayment, AmaliPayment, FarmerLedger, DealerLedger, AmaliLedger } from '../types/payment';

export const paymentService = {
  async createFarmerPayment(payment: FarmerPayment): Promise<FarmerPayment> {
    const response = await api.post('/api/FarmerPayment', payment);
    return response.data;
  },

  async getFarmerLedger(farmerId: string): Promise<FarmerLedger> {
    const response = await api.get(`/api/FarmerPayment/ledger/${farmerId}`);
    return response.data;
  },

  async getAllFarmerLedgers(): Promise<FarmerLedger[]> {
    const response = await api.get('/api/FarmerPayment/ledgers');
    return response.data;
  },

  async createDealerPayment(payment: DealerPayment): Promise<DealerPayment> {
    const response = await api.post('/api/DealerPayment', payment);
    return response.data;
  },

  async getDealerLedger(dealerId: string): Promise<DealerLedger> {
    const response = await api.get(`/api/DealerPayment/ledger/${dealerId}`);
    return response.data;
  },

  async getAllDealerLedgers(): Promise<DealerLedger[]> {
    const response = await api.get('/api/DealerPayment/ledgers');
    return response.data;
  },

  async createAmaliPayment(payment: AmaliPayment): Promise<AmaliPayment> {
    const response = await api.post('/api/AmaliPayment', payment);
    return response.data;
  },

  async getAmaliLedger(amaliId: string): Promise<AmaliLedger> {
    const response = await api.get(`/api/AmaliPayment/ledger/${amaliId}`);
    return response.data;
  },

  async getAllAmaliLedgers(): Promise<AmaliLedger[]> {
    const response = await api.get('/api/AmaliPayment/ledgers');
    return response.data;
  },
};
