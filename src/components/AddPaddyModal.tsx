import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Input } from './Input';
import { paddyService } from '../services/Paddy';
import { authService } from '../services/auth';
import { PaddyEntry, Dealer } from '../types/paddy';
import { LoadingEntryDetails } from '../types/loading';
import Alert from './Alert';
import { useAuthStore } from '../store/authStore';

interface AddPaddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paddyData?: any, rythuData?: any) => void;
  userId: string;
  loadingId?: string;
  loadingEntry?: LoadingEntryDetails | null;
  isRythuPage?: boolean;
}

export const AddPaddyModal: React.FC<AddPaddyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
  loadingId,
  loadingEntry,
  isRythuPage = false,
}) => {
  const DEFAULT_SEASON_ID = '1';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rythus, setRythus] = useState<Dealer[]>([]);
  const [rythuSearch, setRythuSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isRythuPage) {
          const user = await authService.getUserById(userId);
          setCurrentUser(user);
        } else {
          const rythusList = await authService.searchUsers('');
          setRythus(rythusList.filter(u => u.role?.toLowerCase() === 'rythu'));
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      }
    };

    if (isOpen) {
      fetchData();
      setRythuSearch('');
    }
  }, [isOpen, userId, isRythuPage]);

  const filteredRythus = useMemo(() => {
    if (!rythuSearch.trim()) {
      return rythus;
    }
    const searchLower = rythuSearch.toLowerCase();
    return rythus.filter(r =>
      r.name?.toLowerCase().includes(searchLower) ||
      r.phoneNumber?.toLowerCase().includes(searchLower)
    );
  }, [rythuSearch, rythus]);

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
    const rythuId = isRythuPage ? userId : (formData.get('rythuId') as string);

    if (!rythuId) {
      setError('Please select a rythu');
      setLoading(false);
      return;
    }


    const paddyData: PaddyEntry = {
      lorryNumber: loadingEntry?.lorryNumber || '',
      totalWeight: parseFloat(formData.get('weight') as string),
      bags: parseInt(formData.get('bags') as string),
      kgsPerBag: parseFloat(formData.get('kgsPerBag') as string),
      bagAmount: parseInt(formData.get('amountPerBag') as string),
      dealerBagAmount: parseInt(formData.get('dealerAmountPerBag') as string),
      loadedDate: loadingEntry?.loadedDate || getTodayDate(),
      userId: rythuId,
      dealerId: loadingEntry?.dealerId || '',
      rythuId: rythuId,
      loadingId: loadingId,
      loadType: formData.get('loadType') as string || 'potha',
      season_id: DEFAULT_SEASON_ID,
    };

    try {
      await paddyService.createPaddyEntry(paddyData);
      setSuccess('Paddy entry saved successfully!');

      const selectedRythu = isRythuPage ? currentUser : rythus.find(r => r.id === rythuId);

      setTimeout(() => {
        setSuccess('');
        onSuccess({
          ...paddyData,
          finalAmount: paddyData.bags * paddyData.bagAmount,
        }, selectedRythu);
        onClose();
      }, 1000);
    } catch (err) {
      setError('Failed to save paddy entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 w-full max-w-2xl sm:align-middle mx-4 sm:mx-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Add Paddy Entry</h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {loadingEntry && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Loading Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Lorry Number
                      </label>
                      <p className="text-sm font-medium text-gray-900">{loadingEntry.lorryNumber}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Dealer
                      </label>
                      <p className="text-sm font-medium text-gray-900">{loadingEntry.delaerName}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Loaded Date
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(loadingEntry.loadedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Total Bags
                      </label>
                      <p className="text-sm font-medium text-gray-900">{loadingEntry.totalNoOfBags || 0}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Total Weight
                      </label>
                      <p className="text-sm font-medium text-gray-900">{loadingEntry.totalLoadWeight || 0} kg</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isRythuPage && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rythu
                    </label>
                    <input
                      type="text"
                      placeholder="Search rythu by name or phone..."
                      value={rythuSearch}
                      onChange={(e) => setRythuSearch(e.target.value)}
                      className="mt-1 mb-2 block w-full rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                    <select
                      name="rythuId"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-12 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    >
                      <option value="">Select a rythu</option>
                      {filteredRythus.map((rythu) => (
                        <option key={rythu.id} value={rythu.id}>
                          {rythu.name} {rythu.phoneNumber ? `- ${rythu.phoneNumber}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {isRythuPage && currentUser && (
                  <div className="sm:col-span-2">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rythu
                      </label>
                      <p className="text-base font-semibold text-gray-900">{currentUser.name}</p>
                      {currentUser.phoneNumber && (
                        <p className="text-sm text-gray-600">{currentUser.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Input
                    label="Weight (KGs)"
                    name="weight"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Enter total weight in KGs"
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
                    placeholder="Enter number of bags"
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
                    placeholder="Enter KGs per bag"
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    label="Amount per Bag (₹)"
                    name="amountPerBag"
                    type="number"
                    required
                    min="1"
                    placeholder="Enter amount per bag"
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    label="Dealer Amount per Bag (₹)"
                    name="dealerAmountPerBag"
                    type="number"
                    required
                    min="1"
                    placeholder="Enter dealer amount per bag"
                    className="h-12"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Load Type
                  </label>
                  <select
                    name="loadType"
                    defaultValue="potha"
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