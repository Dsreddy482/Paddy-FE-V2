import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, TrendingUp, TrendingDown, History, Search, AlertTriangle, UserPlus } from 'lucide-react';
import Header from '../components/Header';
import Alert from '../components/Alert';
import AddInventoryItemModal from '../components/AddInventoryItemModal';
import EditInventoryItemModal from '../components/EditInventoryItemModal';
import StockTransactionModal from '../components/StockTransactionModal';
import StockHistoryModal from '../components/StockHistoryModal';
import AllocateInventoryModal from '../components/AllocateInventoryModal';
import AllocationHistoryModal from '../components/AllocationHistoryModal';
import { inventoryService } from '../services/inventory';
import type { InventoryItem, CreateInventoryItemData, UpdateInventoryItemData, CreateStockTransactionData, CreateInventoryAllocationData } from '../types/inventory';
import { INVENTORY_CATEGORIES } from '../types/inventory';

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [transactionItem, setTransactionItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [allocateItem, setAllocateItem] = useState<InventoryItem | null>(null);
  const [allocationHistoryItem, setAllocationHistoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, searchTerm]);

  const loadItems = async () => {
    try {
      const data = await inventoryService.getAllItems();
      setItems(data);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load inventory items' });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(term) ||
        item.item_code.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddItem = async (data: CreateInventoryItemData) => {
    try {
      await inventoryService.createItem(data);
      setAlert({ type: 'success', message: 'Inventory item added successfully' });
      await loadItems();
    } catch (error) {
      throw new Error('Failed to add inventory item');
    }
  };

  const handleUpdateItem = async (id: string, data: UpdateInventoryItemData) => {
    try {
      await inventoryService.updateItem(id, data);
      setAlert({ type: 'success', message: 'Inventory item updated successfully' });
      await loadItems();
    } catch (error) {
      throw new Error('Failed to update inventory item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await inventoryService.deleteItem(id);
      setAlert({ type: 'success', message: 'Inventory item deleted successfully' });
      await loadItems();
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete inventory item' });
    }
  };

  const handleStockTransaction = async (data: CreateStockTransactionData, newStock?: number) => {
    try {
      if (data.transaction_type === 'addition') {
        await inventoryService.addStock(data);
      } else if (data.transaction_type === 'removal') {
        await inventoryService.removeStock(data);
      } else if (data.transaction_type === 'adjustment' && newStock !== undefined) {
        await inventoryService.adjustStock(data, newStock);
      }
      setAlert({ type: 'success', message: 'Stock updated successfully' });
      await loadItems();
    } catch (error) {
      throw new Error('Failed to update stock');
    }
  };

  const handleAllocateInventory = async (data: CreateInventoryAllocationData) => {
    try {
      await inventoryService.allocateInventory(data);
      setAlert({ type: 'success', message: 'Inventory allocated successfully' });
      await loadItems();
    } catch (error) {
      throw new Error('Failed to allocate inventory');
    }
  };

  const lowStockItems = items.filter(item => item.current_stock <= item.minimum_stock && item.status === 'active');

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) return 'out-of-stock';
    if (item.current_stock <= item.minimum_stock) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out-of-stock':
        return 'Out of Stock';
      case 'low-stock':
        return 'Low Stock';
      default:
        return 'In Stock';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          </div>
          <p className="text-gray-600">Manage inventory items and track stock levels</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {lowStockItems.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Low Stock Alert</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need restocking
                </p>
                <div className="mt-2 space-y-1">
                  {lowStockItems.slice(0, 3).map(item => (
                    <div key={item.id} className="text-sm text-yellow-800">
                      • {item.item_name}: {item.current_stock} {item.unit} (Min: {item.minimum_stock} {item.unit})
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <div className="text-sm text-yellow-700">
                      and {lowStockItems.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, code, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {INVENTORY_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading inventory...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || selectedCategory !== 'all'
                  ? 'No items found matching your criteria'
                  : 'No inventory items yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Item Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Item Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Stock</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm">{item.item_code}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{item.item_name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">{item.category}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-semibold">{item.current_stock} {item.unit}</div>
                            <div className="text-xs text-gray-500">Min: {item.minimum_stock}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(stockStatus)}`}>
                              {getStockStatusText(stockStatus)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setTransactionItem(item)}
                                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                title="Manage Stock"
                              >
                                <Package className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setAllocateItem(item)}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Allocate to User/Field"
                              >
                                <UserPlus className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setHistoryItem(item)}
                                className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded"
                                title="Stock History"
                              >
                                <History className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
                                title="Edit Item"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Delete Item"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddInventoryItemModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddItem}
        />
      )}

      {editingItem && (
        <EditInventoryItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdateItem}
        />
      )}

      {transactionItem && (
        <StockTransactionModal
          item={transactionItem}
          onClose={() => setTransactionItem(null)}
          onSubmit={handleStockTransaction}
        />
      )}

      {historyItem && (
        <StockHistoryModal
          item={historyItem}
          onClose={() => setHistoryItem(null)}
        />
      )}

      {allocateItem && (
        <AllocateInventoryModal
          item={allocateItem}
          onClose={() => setAllocateItem(null)}
          onSubmit={handleAllocateInventory}
        />
      )}

      {allocationHistoryItem && (
        <AllocationHistoryModal
          item={allocationHistoryItem}
          onClose={() => setAllocationHistoryItem(null)}
        />
      )}
    </div>
  );
}
