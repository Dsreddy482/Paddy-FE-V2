import React, { useState, useEffect } from 'react';
import { X, Plus, CreditCard as Edit2, Check, XCircle } from 'lucide-react';
import { amaliTeamService } from '../services/amaliTeam';
import { authService } from '../services/auth';
import { AmaliTeam } from '../types/amaliTeam';
import { User } from '../types/auth';

interface AddPaddyAmaliModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loadingId: number;
  paddyDetailId: string;
}

export const LOADING_TYPES: { value: AmaliTeam['loadingType']; label: string }[] = [
  { value: 'potha', label: 'Potha' },
  { value: 'kata', label: 'Kata' },
  { value: 'loading', label: 'Loading' },
  { value: 'potha_kata', label: 'Potha + Kata' },
  { value: 'potha_loading', label: 'Potha + Loading' },
  { value: 'kata_loading', label: 'Kata + Loading' },
  { value: 'potha_kata_loading', label: 'Potha + Kata + Loading' },
];

const emptyForm = (loadingId: number, paddyDetailId: string): Partial<AmaliTeam> => ({
  loadingId,
  paddyDetailId,
  amaliTeamName: '',
  loadingType: 'potha',
  ratePerBag: 0,
});

export const AddPaddyAmaliModal: React.FC<AddPaddyAmaliModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  loadingId,
  paddyDetailId,
}) => {
  const [amaliUsers, setAmaliUsers] = useState<User[]>([]);
  const [existingTeams, setExistingTeams] = useState<AmaliTeam[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<AmaliTeam>>(emptyForm(loadingId, paddyDetailId));
  const [editingTeam, setEditingTeam] = useState<AmaliTeam | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AmaliTeam>>({});

  useEffect(() => {
    if (isOpen) {
      setShowAddForm(false);
      setEditingTeam(null);
      setError('');
      setFormData(emptyForm(loadingId, paddyDetailId));
      fetchData();
    }
  }, [isOpen, loadingId, paddyDetailId]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [users, teams] = await Promise.all([
        authService.getUsersByRole('amali'),
        amaliTeamService.getAmaliTeamsByPaddyDetail(paddyDetailId),
      ]);
      setAmaliUsers(users);
      setExistingTeams(teams);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amaliTeamName) { setError('Please select an amali'); return; }
    if (!formData.ratePerBag || formData.ratePerBag <= 0) { setError('Please enter a valid rate per bag'); return; }
    setSaving(true);
    setError('');
    try {
      await amaliTeamService.createAmaliTeam(formData as AmaliTeam);
      setShowAddForm(false);
      setFormData(emptyForm(loadingId, paddyDetailId));
      await fetchData();
      onSuccess();
    } catch (err) {
      setError('Failed to assign amali. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (team: AmaliTeam) => {
    setEditingTeam(team);
    setEditFormData({ ...team });
    setError('');
  };

  const handleEditSave = async () => {
    if (!editingTeam?.id) return;
    if (!editFormData.ratePerBag || editFormData.ratePerBag <= 0) { setError('Please enter a valid rate per bag'); return; }
    setSaving(true);
    setError('');
    try {
      await amaliTeamService.updateAmaliTeam(editingTeam.id, editFormData as AmaliTeam);
      setEditingTeam(null);
      await fetchData();
      onSuccess();
    } catch (err) {
      setError('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (value: string) =>
    LOADING_TYPES.find(t => t.value === value)?.label ?? value;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Amali Assignments</h2>
            <p className="text-xs text-gray-500 mt-0.5">Loading #{loadingId} &nbsp;·&nbsp; Paddy #{paddyDetailId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* Existing assignments */}
          {loadingData ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-r-transparent" />
              Loading...
            </div>
          ) : existingTeams.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amali</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate/Bag</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bags</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {existingTeams.map((team) => (
                    <tr key={team.id}>
                      {editingTeam?.id === team.id ? (
                        <>
                          <td className="px-4 py-2">
                            <select
                              value={editFormData.amaliTeamName}
                              onChange={e => setEditFormData({ ...editFormData, amaliTeamName: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-green-500 focus:border-green-500"
                            >
                              <option value="">Select</option>
                              {amaliUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={editFormData.loadingType}
                              onChange={e => setEditFormData({ ...editFormData, loadingType: e.target.value as AmaliTeam['loadingType'] })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-green-500 focus:border-green-500"
                            >
                              {LOADING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editFormData.ratePerBag || ''}
                              onChange={e => setEditFormData({ ...editFormData, ratePerBag: parseFloat(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-green-500 focus:border-green-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-gray-500">{team.totalBags ?? 0}</td>
                          <td className="px-4 py-2 text-gray-500">₹{(team.totalAmount ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button onClick={handleEditSave} disabled={saving} className="text-green-600 hover:text-green-800" title="Save">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setEditingTeam(null); setError(''); }} className="text-gray-400 hover:text-gray-600" title="Cancel">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 text-gray-900">{team.amaliTeamName}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {getTypeLabel(team.loadingType)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-900">₹{team.ratePerBag.toFixed(2)}</td>
                          <td className="px-4 py-2 text-gray-900">{team.totalBags ?? 0}</td>
                          <td className="px-4 py-2 text-gray-900">₹{(team.totalAmount ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <button onClick={() => startEdit(team)} className="text-blue-600 hover:text-blue-800" title="Edit">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !showAddForm && (
              <p className="text-sm text-gray-500 italic">No amali assigned to this paddy row yet.</p>
            )
          )}

          {/* Add new form */}
          {showAddForm ? (
            <form onSubmit={handleAdd} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">New Assignment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amali <span className="text-red-500">*</span></label>
                  <select
                    value={formData.amaliTeamName}
                    onChange={e => setFormData({ ...formData, amaliTeamName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select Amali</option>
                    {amaliUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Loading Type <span className="text-red-500">*</span></label>
                  <select
                    value={formData.loadingType}
                    onChange={e => setFormData({ ...formData, loadingType: e.target.value as AmaliTeam['loadingType'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    {LOADING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate/Bag (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ratePerBag || ''}
                    onChange={e => setFormData({ ...formData, ratePerBag: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setError(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => { setShowAddForm(true); setError(''); }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-green-400 text-green-700 rounded-md text-sm hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
              Add Amali Assignment
            </button>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaddyAmaliModal;
