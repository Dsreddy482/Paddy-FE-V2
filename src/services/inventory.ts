import { api } from './api';
import type {
  InventoryItem,
  StockTransaction,
  StockTransactionWithItem,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  CreateStockTransactionData,
  InventoryAllocation,
  CreateInventoryAllocationData
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
    selling_price_per_unit: Number(apiItem.sellingPricePerUnit || apiItem.SellingPricePerUnit || apiItem.selling_price_per_unit || 0),
    total_investment: Number(apiItem.totalInvestment || apiItem.TotalInvestment || apiItem.total_investment || 0),
    total_collected: Number(apiItem.totalCollected || apiItem.TotalCollected || apiItem.total_collected || 0),
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
    amount_per_unit: Number(apiTransaction.amountPerUnit || apiTransaction.AmountPerUnit || apiTransaction.amount_per_unit || 0),
    total_amount: Number(apiTransaction.totalAmount || apiTransaction.TotalAmount || apiTransaction.total_amount || 0),
    collection_from_user_id: apiTransaction.collectionFromUserId || apiTransaction.CollectionFromUserId || apiTransaction.collection_from_user_id,
    transaction_date: apiTransaction.transactionDate || apiTransaction.TransactionDate || apiTransaction.transaction_date || new Date().toISOString(),
    reference_number: apiTransaction.referenceNumber || apiTransaction.ReferenceNumber || apiTransaction.reference_number || '',
    notes: apiTransaction.notes || apiTransaction.Notes || '',
    item_name: apiTransaction.itemName || apiTransaction.ItemName || apiTransaction.item_name || '',
    item_code: apiTransaction.itemCode || apiTransaction.ItemCode || apiTransaction.item_code || ''
  };

  console.log('✅ Transformed Transaction:', transformed);
  return transformed;
}

// Transform API response to match our InventoryAllocation type
function transformInventoryAllocation(apiAllocation: any): InventoryAllocation {
  console.log('🔍 Raw API Allocation:', apiAllocation);

  const transformed = {
    id: apiAllocation.id || apiAllocation.Id || '',
    inventory_item_id: apiAllocation.inventoryItemId || apiAllocation.InventoryItemId || apiAllocation.inventory_item_id || '',
    item_name: apiAllocation.itemName || apiAllocation.ItemName || apiAllocation.item_name || '',
    item_code: apiAllocation.itemCode || apiAllocation.ItemCode || apiAllocation.item_code || '',
    quantity: Number(apiAllocation.quantity || apiAllocation.Quantity || 0),
    unit_price: Number(apiAllocation.unitPrice || apiAllocation.UnitPrice || apiAllocation.unit_price || 0),
    allocated_to_type: (apiAllocation.allocatedToType || apiAllocation.AllocatedToType || apiAllocation.allocated_to_type || 'user') as 'user' | 'paddy_field',
    allocated_to_id: apiAllocation.allocatedToId || apiAllocation.AllocatedToId || apiAllocation.allocated_to_id || '',
    allocated_to_name: apiAllocation.allocatedToName || apiAllocation.AllocatedToName || apiAllocation.allocated_to_name || '',
    allocation_date: apiAllocation.allocationDate || apiAllocation.AllocationDate || apiAllocation.allocation_date || new Date().toISOString(),
    purpose: apiAllocation.purpose || apiAllocation.Purpose || '',
    notes: apiAllocation.notes || apiAllocation.Notes || '',
    status: (apiAllocation.status || apiAllocation.Status || 'allocated') as 'allocated' | 'returned' | 'consumed',
    created_at: apiAllocation.createdAt || apiAllocation.CreatedAt || apiAllocation.created_at || new Date().toISOString()
  };

  console.log('✅ Transformed Allocation:', transformed);
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
      sellingPricePerUnit: itemData.selling_price_per_unit,
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
    if (updates.selling_price_per_unit !== undefined) payload.sellingPricePerUnit = updates.selling_price_per_unit;
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
      amountPerUnit: transactionData.amount_per_unit || 0,
      totalAmount: transactionData.total_amount || 0,
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
      amountPerUnit: transactionData.amount_per_unit || 0,
      totalAmount: transactionData.total_amount || 0,
      collectionFromUserId: transactionData.collection_from_user_id,
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
  },

  async allocateInventory(allocationData: CreateInventoryAllocationData): Promise<void> {
    const payload = {
      inventoryItemId: allocationData.inventory_item_id,
      quantity: allocationData.quantity,
      allocatedToType: allocationData.allocated_to_type,
      allocatedToId: String(allocationData.allocated_to_id),
      purpose: allocationData.purpose,
      notes: allocationData.notes,
      allocationDate: new Date().toISOString()
    };
    await api.post('/api/Inventory/allocateInventory', payload);
  },

  async getAllocationsByItem(itemId: string): Promise<InventoryAllocation[]> {
    const { data } = await api.get(`/api/Inventory/getAllocationsByItem/${itemId}`);
    return (data || []).map(transformInventoryAllocation);
  },

  async getAllAllocations(): Promise<InventoryAllocation[]> {
    const { data } = await api.get('/api/Inventory/getAllAllocations');
    return (data || []).map(transformInventoryAllocation);
  },

  async getAllocationsByUser(userId: string): Promise<InventoryAllocation[]> {
    const { data } = await api.get(`/api/Inventory/getAllocationsByUser/${userId}`);
    return (data || []).map(transformInventoryAllocation);
  },

  async getAllocationsByPaddyField(fieldId: string): Promise<InventoryAllocation[]> {
    const { data } = await api.get(`/api/Inventory/getAllocationsByPaddyField/${fieldId}`);
    return (data || []).map(transformInventoryAllocation);
  }
};
