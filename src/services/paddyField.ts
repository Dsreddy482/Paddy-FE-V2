import { api } from './api';
import { PaddyField, CreatePaddyFieldInput } from '../types/paddyField';

// Transform API response to match our PaddyField type
function transformPaddyField(apiField: any): PaddyField {
  console.log('🔍 Raw API Paddy Field:', apiField);

  const transformed = {
    id: apiField.id || apiField.Id || '',
    fieldName: apiField.fieldName || apiField.FieldName || apiField.field_name || '',
    location: apiField.location || apiField.Location || '',
    area: Number(apiField.area || apiField.Area || 0),
    unit: apiField.unit || apiField.Unit || 'acres',
    status: (apiField.status || apiField.Status || 'active') as 'active' | 'inactive',
    createdAt: apiField.createdAt || apiField.CreatedAt || apiField.created_at || new Date().toISOString(),
    updatedAt: apiField.updatedAt || apiField.UpdatedAt || apiField.updated_at || new Date().toISOString()
  };

  console.log('✅ Transformed Paddy Field:', transformed);
  return transformed;
}

export const paddyFieldService = {
  getAllPaddyFields: async (): Promise<PaddyField[]> => {
    const response = await api.get('/api/paddyfields');
    console.log('📥 Get all paddy fields response:', response.data);
    return (response.data || []).map(transformPaddyField);
  },

  getPaddyFieldById: async (id: string): Promise<PaddyField> => {
    const response = await api.get(`/api/paddyfields/${id}`);
    return transformPaddyField(response.data);
  },

  createPaddyField: async (input: CreatePaddyFieldInput): Promise<PaddyField> => {
    const response = await api.post('/api/paddyfields', input);
    return transformPaddyField(response.data);
  },

  updatePaddyField: async (field: PaddyField): Promise<PaddyField> => {
    const response = await api.put(`/api/paddyfields/${field.id}`, field);
    return transformPaddyField(response.data);
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
