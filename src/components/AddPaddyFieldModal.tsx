import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CreatePaddyFieldInput } from '../types/paddyField';
import { Input } from './Input';

interface AddPaddyFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (field: CreatePaddyFieldInput) => Promise<void>;
}

export const AddPaddyFieldModal: React.FC<AddPaddyFieldModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState<CreatePaddyFieldInput>({
    fieldName: '',
    location: '',
    area: 0,
    unit: 'acres',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fieldName.trim()) {
      setError('Field name is required');
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    if (formData.area <= 0) {
      setError('Area must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({
        fieldName: '',
        location: '',
        area: 0,
        unit: 'acres',
        status: 'active',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add field');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fieldName: '',
      location: '',
      area: 0,
      unit: 'acres',
      status: 'active',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Field</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <Input
              type="text"
              value={formData.fieldName}
              onChange={(e) =>
                setFormData({ ...formData, fieldName: e.target.value })
              }
              placeholder="Enter field name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Enter location"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.area || ''}
                onChange={(e) =>
                  setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value as 'acres' | 'hectares' | 'guntas' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
                <option value="guntas">Guntas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
