import { api } from './api';
import { PaddyField, CreatePaddyFieldInput } from '../types/paddyField';

export const paddyFieldService = {
  getAllPaddyFields: async (): Promise<PaddyField[]> => {
    const response = await api.get('/api/paddyfields');
    return response.data;
  },

  getPaddyFieldById: async (id: string): Promise<PaddyField> => {
    const response = await api.get(`/api/paddyfields/${id}`);
    return response.data;
  },

  createPaddyField: async (input: CreatePaddyFieldInput): Promise<PaddyField> => {
    const response = await api.post('/api/paddyfields', input);
    return response.data;
  },

  updatePaddyField: async (field: PaddyField): Promise<PaddyField> => {
    const response = await api.put(`/api/paddyfields/${field.id}`, field);
    return response.data;
  },

  deletePaddyField: async (id: string): Promise<void> => {
    await api.delete(`/api/paddyfields/${id}`);
  }
};

// Backward compatibility exports
export const getAllPaddyFields = paddyFieldService.getAllPaddyFields;
export const getPaddyFieldById = paddyFieldService.getPaddyFieldById;
export const createPaddyField = paddyFieldService.createPaddyField;
export const updatePaddyField = paddyFieldService.updatePaddyField;
export const deletePaddyField = paddyFieldService.deletePaddyField;
