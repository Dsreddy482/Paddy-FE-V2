import { createClient } from '@supabase/supabase-js';
import { PaddyField, CreatePaddyFieldInput } from '../types/paddyField';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAllPaddyFields = async (): Promise<PaddyField[]> => {
  const { data, error } = await supabase
    .from('paddy_fields')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(field => ({
    id: field.id,
    fieldName: field.field_name,
    location: field.location,
    area: field.area,
    unit: field.unit,
    status: field.status,
    createdAt: field.created_at,
    updatedAt: field.updated_at,
  }));
};

export const getPaddyFieldById = async (id: string): Promise<PaddyField> => {
  const { data, error } = await supabase
    .from('paddy_fields')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Field not found');
  }

  return {
    id: data.id,
    fieldName: data.field_name,
    location: data.location,
    area: data.area,
    unit: data.unit,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const createPaddyField = async (input: CreatePaddyFieldInput): Promise<PaddyField> => {
  const { data, error } = await supabase
    .from('paddy_fields')
    .insert({
      field_name: input.fieldName,
      location: input.location,
      area: input.area,
      unit: input.unit,
      status: input.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    fieldName: data.field_name,
    location: data.location,
    area: data.area,
    unit: data.unit,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const updatePaddyField = async (field: PaddyField): Promise<PaddyField> => {
  const { data, error } = await supabase
    .from('paddy_fields')
    .update({
      field_name: field.fieldName,
      location: field.location,
      area: field.area,
      unit: field.unit,
      status: field.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', field.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    fieldName: data.field_name,
    location: data.location,
    area: data.area,
    unit: data.unit,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const deletePaddyField = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('paddy_fields')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};
