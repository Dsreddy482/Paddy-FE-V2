import React, { useState } from 'react';
import { X } from 'lucide-react';
import { amaliTeamService } from '../services/amaliTeam';
import { AmaliTeam } from '../types/amaliTeam';

interface EditAmaliTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: AmaliTeam;
}

const AMALI_TEAMS = [
  'Team A',
  'Team B',
  'Team C',
  'Team D',
  'Team E',
  'Team F',
  'Team G',
  'Team H'
];

const LOADING_TYPES = [
  { value: 'potha', label: 'Potha' },
  { value: 'kata', label: 'Kata' },
  { value: 'loading', label: 'Loading' },
  { value: 'combined', label: 'Combined' }
];

export default function EditAmaliTeamModal({
  isOpen,
  onClose,
  onSuccess,
  team
}: EditAmaliTeamModalProps) {
  const [formData, setFormData] = useState<AmaliTeam>({
    ...team
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amaliTeamName || !formData.loadingType || !formData.ratePerBag) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await amaliTeamService.updateAmaliTeam(formData.id!, formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to update amali team:', error);
      alert('Failed to update amali team');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Amali Team</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amali Team *
            </label>
            <select
              value={formData.amaliTeamName}
              onChange={(e) => setFormData({ ...formData, amaliTeamName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Team</option>
              {AMALI_TEAMS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Loading *
            </label>
            <select
              value={formData.loadingType}
              onChange={(e) => setFormData({ ...formData, loadingType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {LOADING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount for Each Bag (Rs.) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.ratePerBag}
              onChange={(e) => setFormData({ ...formData, ratePerBag: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
