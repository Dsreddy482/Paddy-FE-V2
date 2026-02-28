export interface PaddyField {
  id: string;
  fieldName: string;
  location: string;
  area: number;
  unit: 'acres' | 'hectares' | 'guntas';
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaddyFieldInput {
  fieldName: string;
  location: string;
  area: number;
  unit: 'acres' | 'hectares' | 'guntas';
  status: 'active' | 'inactive';
}
