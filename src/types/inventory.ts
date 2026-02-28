export interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string;
  category: string;
  unit: string;
  description?: string;
  minimum_stock: number;
  current_stock: number;
  unit_price: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  inventory_item_id: string;
  transaction_type: 'addition' | 'removal' | 'adjustment';
  quantity: number;
  reference_number?: string;
  notes?: string;
  transaction_date: string;
  created_by?: string;
  created_at: string;
}

export interface StockTransactionWithItem extends StockTransaction {
  inventory_item?: InventoryItem;
  item_name?: string;
  item_code?: string;
}

export interface CreateInventoryItemData {
  item_name: string;
  item_code: string;
  category: string;
  unit: string;
  description?: string;
  minimum_stock: number;
  current_stock: number;
  unit_price: number;
  status: 'active' | 'inactive';
}

export interface UpdateInventoryItemData {
  item_name?: string;
  item_code?: string;
  category?: string;
  unit?: string;
  description?: string;
  minimum_stock?: number;
  unit_price?: number;
  status?: 'active' | 'inactive';
}

export interface CreateStockTransactionData {
  inventory_item_id: string;
  transaction_type: 'addition' | 'removal' | 'adjustment';
  quantity: number;
  reference_number?: string;
  notes?: string;
  transaction_date?: string;
}

export interface InventoryAllocation {
  id: string;
  inventory_item_id: string;
  item_name?: string;
  item_code?: string;
  quantity: number;
  unit_price?: number;
  allocated_to_type: 'user' | 'paddy_field';
  allocated_to_id: string;
  allocated_to_name?: string;
  allocation_date: string;
  purpose?: string;
  notes?: string;
  status: 'allocated' | 'returned' | 'consumed';
  created_at: string;
}

export interface CreateInventoryAllocationData {
  inventory_item_id: string;
  quantity: number;
  allocated_to_type: 'user' | 'paddy_field';
  allocated_to_id: string;
  purpose?: string;
  notes?: string;
}

export const INVENTORY_CATEGORIES = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Tools',
  'Equipment',
  'Packaging Materials',
  'Other'
] as const;

export const INVENTORY_UNITS = [
  'kg',
  'grams',
  'liters',
  'ml',
  'pieces',
  'bags',
  'boxes',
  'units'
] as const;
