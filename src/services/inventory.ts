import { api } from './api';
import type {
  InventoryItem,
  StockTransaction,
  StockTransactionWithItem,
  CreateInventoryItemData,
  UpdateInventoryItemData,
  CreateStockTransactionData
} from '../types/inventory';

export const inventoryService = {
  async getAllItems(): Promise<InventoryItem[]> {
    const { data } = await api.get('/Inventory/getAllItems');
    return data || [];
  },

  async getItemById(id: string): Promise<InventoryItem | null> {
    const { data } = await api.get(`/Inventory/getItem/${id}`);
    return data;
  },

  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    const { data } = await api.get(`/Inventory/getItemsByCategory/${category}`);
    return data || [];
  },

  async getActiveItems(): Promise<InventoryItem[]> {
    const { data } = await api.get('/Inventory/getActiveItems');
    return data || [];
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data } = await api.get('/Inventory/getLowStockItems');
    return data || [];
  },

  async createItem(itemData: CreateInventoryItemData): Promise<InventoryItem> {
    const { data } = await api.post('/Inventory/createItem', itemData);
    return data;
  },

  async updateItem(id: string, updates: UpdateInventoryItemData): Promise<InventoryItem> {
    const { data } = await api.put(`/Inventory/updateItem/${id}`, updates);
    return data;
  },

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/Inventory/deleteItem/${id}`);
  },

  async searchItems(searchTerm: string): Promise<InventoryItem[]> {
    const { data } = await api.post('/Inventory/searchItems', { search: searchTerm });
    return data || [];
  },

  async addStock(transactionData: CreateStockTransactionData): Promise<void> {
    await api.post('/Inventory/addStock', transactionData);
  },

  async removeStock(transactionData: CreateStockTransactionData): Promise<void> {
    await api.post('/Inventory/removeStock', transactionData);
  },

  async adjustStock(transactionData: CreateStockTransactionData, newStock: number): Promise<void> {
    await api.post('/Inventory/adjustStock', {
      ...transactionData,
      new_stock: newStock
    });
  },

  async getTransactionsByItem(itemId: string): Promise<StockTransactionWithItem[]> {
    const { data } = await api.get(`/Inventory/getTransactionsByItem/${itemId}`);
    return data || [];
  },

  async getAllTransactions(): Promise<StockTransactionWithItem[]> {
    const { data } = await api.get('/Inventory/getAllTransactions');
    return data || [];
  }
};
