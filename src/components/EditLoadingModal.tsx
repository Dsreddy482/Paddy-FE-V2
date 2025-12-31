import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './Input';
import { loadingService } from '../services/loading';
import { LoadingEntry } from '../types/loading';
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

  useEffect(() => {
    if (isOpen && loadingEntry) {
      setFormData(loadingEntry);
    }
  }, [isOpen, loadingEntry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? {
      ...prev,
      [name]: name === 'amali' ? parseFloat(value) : value
    } : null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await loadingService.updateLoadingEntry(formData.id!, {
        ...formData,
        amali: parseFloat(formData.amali.toString()),
      });

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
                  value={formData.date}
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

              <div>
                <Input
                  label="Dealer"
                  name="dealer"
                  type="text"
                  required
                  value={formData.dealer}
                  onChange={handleChange}
                  className="h-10"
                />
              </div>

              <div>
                <Input
                  label="Amali (Weight in KGs)"
                  name="amali"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.amali}
                  onChange={handleChange}
                  className="h-10"
                />
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
