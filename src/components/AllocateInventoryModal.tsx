import { useState, useEffect } from 'react';
import { X, User, MapPin, Search } from 'lucide-react';
import Input from './Input';
import type { InventoryItem, CreateInventoryAllocationData } from '../types/inventory';
import type { User as UserType } from '../types/auth';
import type { PaddyField } from '../types/paddyField';
import { authService } from '../services/auth';
import { paddyFieldService } from '../services/paddyField';

interface AllocateInventoryModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSubmit: (data: CreateInventoryAllocationData) => Promise<void>;
}

export default function AllocateInventoryModal({ item, onClose, onSubmit }: AllocateInventoryModalProps) {
  const [allocationType, setAllocationType] = useState<'user' | 'paddy_field'>('user');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedField, setSelectedField] = useState<PaddyField | null>(null);
  const [paddyFields, setPaddyFields] = useState<PaddyField[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (allocationType === 'paddy_field') {
      loadPaddyFields();
    }
  }, [allocationType]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearchQuery.trim() || allocationType !== 'user') {
        setUsers([]);
        return;
      }

      setSearchingUsers(true);
      try {
        const results = await authService.searchUsers(userSearchQuery);
        setUsers(results);
      } catch (error) {
        console.error('Failed to search users:', error);
        setUsers([]);
      } finally {
        setSearchingUsers(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, allocationType]);

  const loadPaddyFields = async () => {
    try {
      console.log('🔄 Loading paddy fields...');
      const fields = await paddyFieldService.getAllPaddyFields();
      console.log('✅ Paddy fields loaded:', fields);
      const activeFields = fields.filter(f => f.status === 'active');
      console.log('✅ Active paddy fields:', activeFields);
      setPaddyFields(activeFields);
    } catch (error) {
      console.error('❌ Failed to load paddy fields:', error);
      setError('Failed to load paddy fields. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (quantity > item.current_stock) {
      setError('Insufficient stock available');
      return;
    }

    if (allocationType === 'user' && !selectedUser) {
      setError('Please select a user');
      return;
    }

    if (allocationType === 'paddy_field' && !selectedField) {
      setError('Please select a paddy field');
      return;
    }

    setLoading(true);
    try {
      const allocationData: CreateInventoryAllocationData = {
        inventory_item_id: item.id,
        quantity,
        allocated_to_type: allocationType,
        allocated_to_id: allocationType === 'user' ? selectedUser!.id : selectedField!.id,
        purpose: purpose || undefined,
        notes: notes || undefined
      };

      await onSubmit(allocationData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to allocate inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Allocate Inventory</h2>
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Item</div>
            <div className="font-semibold text-gray-900">{item.item_name}</div>
            <div className="text-sm text-gray-600 mt-2">
              Available Stock: <span className="font-semibold text-gray-900">{item.current_stock} {item.unit}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allocate To
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAllocationType('user');
                  setSelectedField(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  allocationType === 'user'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5" />
                User
              </button>
              <button
                type="button"
                onClick={() => {
                  setAllocationType('paddy_field');
                  setSelectedUser(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  allocationType === 'paddy_field'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-5 h-5" />
                Paddy Field
              </button>
            </div>
          </div>

          {allocationType === 'user' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-lg border-gray-300 pl-10 py-2 border focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by name, email, or phone"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
              {selectedUser && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{selectedUser.name}</div>
                      <div className="text-sm text-gray-600">{selectedUser.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setUserSearchQuery('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              {userSearchQuery && !selectedUser && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchingUsers ? (
                    <div className="text-center py-4 text-gray-500">Searching...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No users found</div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {users.map((user) => (
                        <li
                          key={user.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserSearchQuery('');
                          }}
                        >
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-500">{user.phone}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Paddy Field
              </label>
              <select
                value={selectedField?.id || ''}
                onChange={(e) => {
                  const field = paddyFields.find(f => f.id === e.target.value);
                  setSelectedField(field || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a paddy field...</option>
                {paddyFields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.fieldName} - {field.location} ({field.area} {field.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label={`Quantity (${item.unit})`}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            min="0"
            max={item.current_stock}
            step="0.01"
            required
          />

          <Input
            label="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Planting, Fertilization, Pest Control"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any additional notes..."
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
              {loading ? 'Allocating...' : 'Allocate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
