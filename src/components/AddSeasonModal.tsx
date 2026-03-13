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
    year: currentYear,
    season_number: 1 as 1 | 2,
    start_date: '',
    end_date: '',
    is_active: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      const seasonData: CreateSeasonData = {
        ...formData,
        name: `${formData.year} - Season ${formData.season_number}`,
      };

      await seasonService.createSeason(seasonData);
      onSuccess();
      onClose();
      setFormData({
        year: currentYear,
        season_number: 1,
        start_date: '',
        end_date: '',
        is_active: false,
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
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
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
            <select
              value={formData.season_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  season_number: parseInt(e.target.value) as 1 | 2,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value={1}>Season 1</option>
              <option value={2}>Season 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
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
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
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
