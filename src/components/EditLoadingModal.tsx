import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './Input';
import { loadingService } from '../services/loading';
import { LoadingEntry } from '../types/loading';
import { authService } from '../services/auth';
import { User } from '../types/auth';
import Alert from './Alert';

interface EditLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loadingEntry: LoadingEntry | null;
}

export const EditLoadingModal: React.FC<EditLoadingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  loadingEntry,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<LoadingEntry | null>(null);
  const [dealers, setDealers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealersList, usersList] = await Promise.all([
          authService.getDealers(),
          authService.searchUsers('')
        ]);
        setDealers(dealersList);
        setUsers(usersList.filter(u => u.role !== 'vendor'));
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load dealers and users');
      }
    };

    if (isOpen && loadingEntry) {
      setFormData(loadingEntry);
      setSelectedDealerId(loadingEntry.dealerId || '');
      setSelectedUserId(loadingEntry.amaliId || '');
      fetchData();
    }
  }, [isOpen, loadingEntry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'dealer') {
      setSelectedDealerId(value);
      setFormData(prev => prev ? {
        ...prev,
        dealerId: value
      } : null);
    } else if (name === 'amali') {
      setSelectedUserId(value);
      setFormData(prev => prev ? {
        ...prev,
        amaliId: value
      } : null);
    } else if (name === 'date') {
      setFormData(prev => prev ? {
        ...prev,
        loadedDate: value
      } : null);
    } else if (type === 'checkbox') {
      setFormData(prev => prev ? {
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      } : null);
    } else {
      setFormData(prev => prev ? {
        ...prev,
        [name]: value
      } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData) return;

    setError('');
    setSuccess('');
    setLoading(true);

    if (!selectedDealerId) {
      setError('Please select a dealer');
      setLoading(false);
      return;
    }

    if (!selectedUserId) {
      setError('Please select a user for amali');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        ...formData,
        dealerId: selectedDealerId,
        amaliId: selectedUserId,
      };

      await loadingService.updateLoadingEntry(formData.userId!, updateData);

      setSuccess('Loading entry updated successfully!');
      setTimeout(() => {
        setSuccess('');
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to update loading entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 w-full max-w-md sm:align-middle mx-4 sm:mx-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Loading Entry</h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  value={formData.loadedDate ? new Date(formData.loadedDate).toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <Input
                  label="Lorry Number"
                  name="lorryNumber"
                  type="text"
                  required
                  value={formData.lorryNumber}
                  onChange={handleChange}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Total Load Weight (kg)"
                    name="totalLoadWeight"
                    type="number"
                    value={formData.totalLoadWeight || ''}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
                <div>
                  <Input
                    label="Total No. of Bags"
                    name="totalNoOfBags"
                    type="number"
                    value={formData.totalNoOfBags || ''}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status || 'loading not started'}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="loading not started">loading not started</option>
                  <option value="Loading Started">Loading Started</option>
                  <option value="Loading Completed">Loading Completed</option>
                  <option value="Amount Received">Amount Received</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="paymentDone"
                  id="paymentDone"
                  checked={formData.paymentDone || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="paymentDone" className="ml-2 block text-sm font-medium text-gray-700">
                  Payment Done
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dealer
                </label>
                <select
                  name="dealer"
                  required
                  value={selectedDealerId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="">Select a dealer</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amali (User)
                </label>
                <select
                  name="amali"
                  required
                  value={selectedUserId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
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
