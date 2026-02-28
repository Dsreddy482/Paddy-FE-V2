import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from '../types/inventory';
import type { InventoryItem, UpdateInventoryItemData } from '../types/inventory';

interface EditInventoryItemModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateInventoryItemData) => Promise<void>;
}

export default function EditInventoryItemModal({ item, onClose, onSubmit }: EditInventoryItemModalProps) {
  console.log('📝 Edit Modal - Received Item:', item);

  const [formData, setFormData] = useState<UpdateInventoryItemData>({
    item_name: item.item_name || '',
    item_code: item.item_code || '',
    category: item.category || '',
    unit: item.unit || '',
    description: item.description || '',
    minimum_stock: item.minimum_stock || 0,
    unit_price: item.unit_price || 0,
    status: item.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('📝 Edit Modal - Form Data:', formData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.item_name?.trim()) {
      setError('Item name is required');
      return;
    }

    if (!formData.item_code?.trim()) {
      setError('Item code is required');
      return;
    }

    if (formData.minimum_stock !== undefined && formData.minimum_stock < 0) {
      setError('Minimum stock cannot be negative');
      return;
    }

    if (formData.unit_price !== undefined && formData.unit_price < 0) {
      setError('Unit price cannot be negative');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(item.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Inventory Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              value={formData.item_name || ''}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              required
            />

            <Input
              label="Item Code"
              value={formData.item_code || ''}
              onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {INVENTORY_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {INVENTORY_UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <Input
              label="Minimum Stock"
              type="number"
              value={formData.minimum_stock ?? 0}
              onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />

            <Input
              label="Unit Price (₹)"
              type="number"
              value={formData.unit_price ?? 0}
              onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Current Stock: <span className="font-semibold text-gray-900">{item.current_stock} {item.unit}</span></p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter item description..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
