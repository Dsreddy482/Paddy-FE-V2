import { api } from './api';
import type {
  InventoryItem,
  StockTransaction,
  StockTransactionWithItem,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  CreateStockTransactionData
} from '../types/inventory';

// Transform API response to match our InventoryItem type
function transformInventoryItem(apiItem: any): InventoryItem {
  console.log('🔍 Raw API Item:', apiItem);

  const transformed = {
    id: apiItem.id || apiItem.Id || '',
    item_name: apiItem.itemName || apiItem.ItemName || apiItem.item_name || '',
    item_code: apiItem.itemCode || apiItem.ItemCode || apiItem.item_code || '',
    category: apiItem.category || apiItem.Category || '',
    unit: apiItem.unit || apiItem.Unit || '',
    description: apiItem.description || apiItem.Description || '',
    minimum_stock: Number(apiItem.minimumStock || apiItem.MinimumStock || apiItem.minimum_stock || 0),
    current_stock: Number(apiItem.currentStock || apiItem.CurrentStock || apiItem.current_stock || 0),
    unit_price: Number(apiItem.unitPrice || apiItem.UnitPrice || apiItem.unit_price || 0),
    status: (apiItem.status || apiItem.Status || 'active') as 'active' | 'inactive',
    created_at: apiItem.createdAt || apiItem.CreatedAt || apiItem.created_at || new Date().toISOString(),
    updated_at: apiItem.updatedAt || apiItem.UpdatedAt || apiItem.updated_at || new Date().toISOString()
  };

  console.log('✅ Transformed Item:', transformed);
  return transformed;
}

// Transform API response to match our StockTransactionWithItem type
function transformStockTransaction(apiTransaction: any): StockTransactionWithItem {
  console.log('🔍 Raw API Transaction:', apiTransaction);

  const transformed = {
    id: apiTransaction.id || apiTransaction.Id || '',
    inventory_item_id: apiTransaction.inventoryItemId || apiTransaction.InventoryItemId || apiTransaction.inventory_item_id || '',
    transaction_type: (apiTransaction.transactionType || apiTransaction.TransactionType || apiTransaction.transaction_type || 'adjustment') as 'addition' | 'removal' | 'adjustment',
    quantity: Number(apiTransaction.quantity || apiTransaction.Quantity || 0),
    transaction_date: apiTransaction.transactionDate || apiTransaction.TransactionDate || apiTransaction.transaction_date || new Date().toISOString(),
    reference_number: apiTransaction.referenceNumber || apiTransaction.ReferenceNumber || apiTransaction.reference_number || '',
    notes: apiTransaction.notes || apiTransaction.Notes || '',
    item_name: apiTransaction.itemName || apiTransaction.ItemName || apiTransaction.item_name || '',
    item_code: apiTransaction.itemCode || apiTransaction.ItemCode || apiTransaction.item_code || ''
  };

  console.log('✅ Transformed Transaction:', transformed);
  return transformed;
}

export const inventoryService = {
  async getAllItems(): Promise<InventoryItem[]> {
    const { data } = await api.get('/api/Inventory/getAllItems');
    return (data || []).map(transformInventoryItem);
  },

  async getItemById(id: string): Promise<InventoryItem | null> {
    const { data } = await api.get(`/api/Inventory/getItem/${id}`);
    return data ? transformInventoryItem(data) : null;
  },

  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    const { data } = await api.get(`/api/Inventory/getItemsByCategory/${category}`);
    return (data || []).map(transformInventoryItem);
  },

  async getActiveItems(): Promise<InventoryItem[]> {
    const { data } = await api.get('/api/Inventory/getActiveItems');
    return (data || []).map(transformInventoryItem);
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data } = await api.get('/api/Inventory/getLowStockItems');
    return (data || []).map(transformInventoryItem);
  },

  async createItem(itemData: CreateInventoryItemData): Promise<InventoryItem> {
    const payload = {
      itemName: itemData.item_name,
      itemCode: itemData.item_code,
      category: itemData.category.toLowerCase(),
      unit: itemData.unit,
      description: itemData.description || '',
      minimumStock: itemData.minimum_stock,
      currentStock: itemData.current_stock,
      unitPrice: itemData.unit_price,
      status: itemData.status
    };
    const { data } = await api.post('/api/Inventory/createItem', payload);
    return transformInventoryItem(data);
  },

  async updateItem(id: string, updates: UpdateInventoryItemData): Promise<InventoryItem> {
    const payload: any = {};
    if (updates.item_name !== undefined) payload.itemName = updates.item_name;
    if (updates.item_code !== undefined) payload.itemCode = updates.item_code;
    if (updates.category !== undefined) payload.category = updates.category.toLowerCase();
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.minimum_stock !== undefined) payload.minimumStock = updates.minimum_stock;
    if (updates.unit_price !== undefined) payload.unitPrice = updates.unit_price;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data } = await api.put(`/api/Inventory/updateItem/${id}`, payload);
    return transformInventoryItem(data);
  },

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/api/Inventory/deleteItem/${id}`);
  },

  async searchItems(searchTerm: string): Promise<InventoryItem[]> {
    const { data } = await api.post('/api/Inventory/searchItems', { search: searchTerm });
    return (data || []).map(transformInventoryItem);
  },

  async addStock(transactionData: CreateStockTransactionData): Promise<void> {
    const payload = {
      inventoryItemId: transactionData.inventory_item_id,
      transactionType: 'in',
      quantity: Math.abs(transactionData.quantity),
      referenceNumber: transactionData.reference_number,
      notes: transactionData.notes,
      transactionDate: transactionData.transaction_date
    };
    await api.post('/api/Inventory/addStock', payload);
  },

  async removeStock(transactionData: CreateStockTransactionData): Promise<void> {
    const payload = {
      inventoryItemId: transactionData.inventory_item_id,
      transactionType: 'out',
      quantity: Math.abs(transactionData.quantity),
      referenceNumber: transactionData.reference_number,
      notes: transactionData.notes,
      transactionDate: transactionData.transaction_date
    };
    await api.post('/api/Inventory/removeStock', payload);
  },

  async adjustStock(transactionData: CreateStockTransactionData, newStock: number): Promise<void> {
    const payload = {
      transaction: {
        inventoryItemId: transactionData.inventory_item_id,
        transactionType: 'adjustment',
        quantity: transactionData.quantity,
        referenceNumber: transactionData.reference_number,
        notes: transactionData.notes,
        transactionDate: transactionData.transaction_date
      },
      newStock: newStock
    };
    await api.post('/api/Inventory/adjustStock', payload);
  },

  async getTransactionsByItem(itemId: string): Promise<StockTransactionWithItem[]> {
    const { data } = await api.get(`/api/Inventory/getTransactionsByItem/${itemId}`);
    return (data || []).map(transformStockTransaction);
  },

  async getAllTransactions(): Promise<StockTransactionWithItem[]> {
    const { data } = await api.get('/api/Inventory/getAllTransactions');
    return (data || []).map(transformStockTransaction);
  }
};
