import { api } from './api';
import { PaddyField, CreatePaddyFieldInput } from '../types/paddyField';

export const getAllPaddyFields = async (): Promise<PaddyField[]> => {
  const response = await api.get('/paddyfield');
  return response.data;
};

export const getPaddyFieldById = async (id: string): Promise<PaddyField> => {
  const response = await api.get(`/paddyfield/${id}`);
  return response.data;
};

export const createPaddyField = async (input: CreatePaddyFieldInput): Promise<PaddyField> => {
  const response = await api.post('/paddyfield', input);
  return response.data;
};

export const updatePaddyField = async (field: PaddyField): Promise<PaddyField> => {
  const response = await api.put(`/paddyfield/${field.id}`, field);
  return response.data;
};

export const deletePaddyField = async (id: string): Promise<void> => {
  await api.delete(`/paddyfield/${id}`);
};
