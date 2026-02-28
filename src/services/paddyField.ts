import { api } from './api';
import { PaddyField, CreatePaddyFieldInput } from '../types/paddyField';

export const getAllPaddyFields = async (): Promise<PaddyField[]> => {
  const response = await api.get('/api/paddyfields');
  return response.data;
};

export const getPaddyFieldById = async (id: string): Promise<PaddyField> => {
  const response = await api.get(`/api/paddyfields/${id}`);
  return response.data;
};

export const createPaddyField = async (input: CreatePaddyFieldInput): Promise<PaddyField> => {
  const response = await api.post('/api/paddyfields', input);
  return response.data;
};

export const updatePaddyField = async (field: PaddyField): Promise<PaddyField> => {
  const response = await api.put(`/api/paddyfields/${field.id}`, field);
  return response.data;
};

export const deletePaddyField = async (id: string): Promise<void> => {
  await api.delete(`/api/paddyfields/${id}`);
};
