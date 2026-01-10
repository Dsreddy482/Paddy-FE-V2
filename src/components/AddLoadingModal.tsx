import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './Input';
import { loadingService } from '../services/loading';
import { LoadingEntry } from '../types/loading';
import { authService } from '../services/auth';
import { User } from '../types/auth';
import Alert from './Alert';

interface AddLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLoadingModal: React.FC<AddLoadingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dealers, setDealers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealersList, usersList] = await Promise.all([
          authService.getDealers(),
          authService.searchUsers('')
        ]);
        setDealers(dealersList);
        setUsers(usersList.filter(u => u.role?.toLowerCase() === 'amali'));
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load dealers and users');
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const dealerId = formData.get('dealer') as string;
    const amaliUserId = formData.get('amali') as string;

    if (!dealerId) {
      setError('Please select a dealer');
      setLoading(false);
      return;
    }

    if (!amaliUserId) {
      setError('Please select an amali');
      setLoading(false);
      return;
    }

    const loadingData: LoadingEntry = {
      loadedDate: formData.get('date') as string,
      lorryNumber: formData.get('lorryNumber') as string,
      dealerId: dealerId,
      amaliId: amaliUserId,
      seasonId: 0,
    };

    try {
      await loadingService.createLoadingEntry(loadingData);
      setSuccess('Loading entry saved successfully!');
      setTimeout(() => {
        setSuccess('');
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to save loading entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 w-full max-w-md sm:align-middle mx-4 sm:mx-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Add Loading Entry</h3>
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
                  defaultValue={getTodayDate()}
                  max={getTodayDate()}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <Input
                  label="Lorry Number"
                  name="lorryNumber"
                  type="text"
                  required
                  placeholder="Enter lorry number"
                  className="h-10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dealer
                </label>
                <select
                  name="dealer"
                  required
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
                  Amali
                </label>
                <select
                  name="amali"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                  <option value="">Select amali</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
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
                  {loading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
