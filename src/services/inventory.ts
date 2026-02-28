import { supabase } from './supabase';
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
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getItemById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('category', category)
      .order('item_name');

    if (error) throw error;
    return data || [];
  },

  async getActiveItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('status', 'active')
      .order('item_name');

    if (error) throw error;
    return data || [];
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('status', 'active')
      .order('item_name');

    if (error) throw error;

    return (data || []).filter(item => item.current_stock <= item.minimum_stock);
  },

  async createItem(itemData: CreateInventoryItemData): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateItem(id: string, updates: UpdateInventoryItemData): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async searchItems(searchTerm: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .or(`item_name.ilike.%${searchTerm}%,item_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('item_name');

    if (error) throw error;
    return data || [];
  },

  async addStock(transactionData: CreateStockTransactionData): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', transactionData.inventory_item_id)
      .single();

    if (fetchError) throw fetchError;

    const newStock = item.current_stock + Math.abs(transactionData.quantity);

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', transactionData.inventory_item_id);

    if (updateError) throw updateError;

    const { data: user } = await supabase.auth.getUser();

    const { error: transactionError } = await supabase
      .from('inventory_stock_transactions')
      .insert([{
        ...transactionData,
        quantity: Math.abs(transactionData.quantity),
        created_by: user.user?.id,
        transaction_date: transactionData.transaction_date || new Date().toISOString()
      }]);

    if (transactionError) throw transactionError;
  },

  async removeStock(transactionData: CreateStockTransactionData): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', transactionData.inventory_item_id)
      .single();

    if (fetchError) throw fetchError;

    const newStock = Math.max(0, item.current_stock - Math.abs(transactionData.quantity));

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', transactionData.inventory_item_id);

    if (updateError) throw updateError;

    const { data: user } = await supabase.auth.getUser();

    const { error: transactionError } = await supabase
      .from('inventory_stock_transactions')
      .insert([{
        ...transactionData,
        quantity: -Math.abs(transactionData.quantity),
        created_by: user.user?.id,
        transaction_date: transactionData.transaction_date || new Date().toISOString()
      }]);

    if (transactionError) throw transactionError;
  },

  async adjustStock(transactionData: CreateStockTransactionData, newStock: number): Promise<void> {
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', transactionData.inventory_item_id);

    if (updateError) throw updateError;

    const { data: user } = await supabase.auth.getUser();

    const { error: transactionError } = await supabase
      .from('inventory_stock_transactions')
      .insert([{
        ...transactionData,
        created_by: user.user?.id,
        transaction_date: transactionData.transaction_date || new Date().toISOString()
      }]);

    if (transactionError) throw transactionError;
  },

  async getTransactionsByItem(itemId: string): Promise<StockTransactionWithItem[]> {
    const { data, error } = await supabase
      .from('inventory_stock_transactions')
      .select(`
        *,
        inventory_item:inventory_items(*)
      `)
      .eq('inventory_item_id', itemId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllTransactions(): Promise<StockTransactionWithItem[]> {
    const { data, error } = await supabase
      .from('inventory_stock_transactions')
      .select(`
        *,
        inventory_item:inventory_items(*)
      `)
      .order('transaction_date', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }
};
