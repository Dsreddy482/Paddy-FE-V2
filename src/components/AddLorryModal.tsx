import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Lorry } from '../types/lorry';
import { lorryService } from '../services/lorry';
import { api } from '../services/api';

interface AddLorryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLorryModal: React.FC<AddLorryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    lorryNumber: '',
    driverName: '',
    driverPhone: '',
    dealerId: '',
  });
  const [dealers, setDealers] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDealers();
    }
  }, [isOpen]);

  const fetchDealers = async () => {
    try {
      const response = await api.get('/users/dealers');
      setDealers(response.data);
    } catch (err) {
      console.error('Failed to fetch dealers:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.lorryNumber || !formData.driverName || !formData.driverPhone) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const lorry: Lorry = {
        lorryNumber: formData.lorryNumber,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        dealerId: formData.dealerId || undefined,
      };

      await lorryService.createLorry(lorry);
      onSuccess();
      onClose();
      setFormData({ lorryNumber: '', driverName: '', driverPhone: '', dealerId: '' });
    } catch (err) {
      setError('Failed to create lorry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add New Lorry</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lorry Number *
            </label>
            <input
              type="text"
              value={formData.lorryNumber}
              onChange={(e) => setFormData({ ...formData, lorryNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Enter lorry number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name *
            </label>
            <input
              type="text"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Enter driver name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Phone *
            </label>
            <input
              type="tel"
              value={formData.driverPhone}
              onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Enter driver phone"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dealer (Optional)
            </label>
            <select
              value={formData.dealerId}
              onChange={(e) => setFormData({ ...formData, dealerId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select Dealer</option>
              {dealers.map((dealer) => (
                <option key={dealer.id} value={dealer.id}>
                  {dealer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Lorry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
