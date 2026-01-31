import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './Input';
import { paddyService } from '../services/Paddy';
import { authService } from '../services/auth';
import { PaddyEntry, Dealer } from '../types/paddy';
import Alert from './Alert';

interface EditPaddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paddyEntry: PaddyEntry | null;
}

export const EditPaddyModal: React.FC<EditPaddyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  paddyEntry,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<PaddyEntry | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(paddyEntry);
    }
  }, [isOpen, paddyEntry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData) return;

    if (!formData.userId || !formData.dealerId || !formData.loadingId) {
      setError('Missing required fields: userId, dealerId, or loadingId');
      setLoading(false);
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await paddyService.updatePaddyEntry(formData.id!, {
        ...formData,
        userId: formData.userId,
        dealerId: formData.dealerId,
        loadingId: formData.loadingId,
        totalWeight: parseFloat(formData.totalWeight?.toString() || '0'),
        bags: parseInt(formData.bags.toString()),
        kgsPerBag: Number(formData.kgsPerBag),
        bagAmount: parseInt(formData.bagAmount.toString()),
        dealerBagAmount: parseInt(formData.dealerBagAmount?.toString() || '0'),
      });
      
      setSuccess('Paddy entry updated successfully!');
      setTimeout(() => {
        setSuccess('');
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to update paddy entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 w-full max-w-2xl sm:align-middle mx-4 sm:mx-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Paddy Entry</h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Weight (KGs)"
                    name="totalWeight"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.totalWeight}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    label="Number of Bags"
                    name="bags"
                    type="number"
                    required
                    min="1"
                    value={formData.bags}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    label="KGs per Bag"
                    name="kgsPerBag"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.kgsPerBag}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    label="Amount per Bag (₹)"
                    name="bagAmount"
                    type="number"
                    required
                    min="1"
                    value={formData.bagAmount}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    label="Dealer Amount per Bag (₹)"
                    name="dealerBagAmount"
                    type="number"
                    required
                    min="1"
                    value={formData.dealerBagAmount}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Load Type
                  </label>
                  <select
                    name="loadType"
                    value={formData.loadType || 'potha'}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-12 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    <option value="potha">Potha</option>
                    <option value="potha+loading">Potha+Loading</option>
                    <option value="potha+kata+loading">Potha+Kata+Loading</option>
                  </select>
                </div>
              </div>

              {error && <Alert type="error" message={error} />}
              {success && <Alert type="success" message={success} />}

              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};