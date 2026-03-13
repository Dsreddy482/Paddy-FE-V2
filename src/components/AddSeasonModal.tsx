import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from './Input';
import { seasonService } from '../services/season';
import { CreateSeasonData } from '../types/season';

interface AddSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddSeasonModal: React.FC<AddSeasonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    Year: currentYear,
    SeasonNumber: '',
    StartDate: '',
    EndDate: '',
    IsActive: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.SeasonNumber || !formData.StartDate || !formData.EndDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.StartDate) >= new Date(formData.EndDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      const seasonData: CreateSeasonData = {
        ...formData,
        Name: `${formData.Year} - ${formData.SeasonNumber}`,
      };

      await seasonService.createSeason(seasonData);
      onSuccess();
      onClose();
      setFormData({
        Year: currentYear,
        SeasonNumber: '',
        StartDate: '',
        EndDate: '',
        IsActive: false,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create season');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add New Season</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <Input
              type="number"
              value={formData.Year}
              onChange={(e) =>
                setFormData({ ...formData, Year: parseInt(e.target.value) })
              }
              min={2000}
              max={2100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season Number
            </label>
            <Input
              type="text"
              value={formData.SeasonNumber}
              onChange={(e) =>
                setFormData({ ...formData, SeasonNumber: e.target.value })
              }
              placeholder="e.g., Yala, Maha, Season 1"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={formData.StartDate}
              onChange={(e) =>
                setFormData({ ...formData, StartDate: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={formData.EndDate}
              onChange={(e) =>
                setFormData({ ...formData, EndDate: e.target.value })
              }
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.IsActive}
              onChange={(e) =>
                setFormData({ ...formData, IsActive: e.target.checked })
              }
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-700"
            >
              Set as active season
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
