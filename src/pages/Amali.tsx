import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { amaliTeamService } from '../services/amaliTeam';
import { authService } from '../services/auth';
import { AmaliTeamDetails } from '../types/amaliTeam';
import { User } from '../types/auth';
import { Header } from '../components/Header';
import { AmaliPaymentModal } from '../components/AmaliPaymentModal';
import { LOADING_TYPES } from '../components/AddPaddyAmaliModal';

export const Amali: React.FC = () => {
  const navigate = useNavigate();
  const [amaliUsers, setAmaliUsers] = useState<User[]>([]);
  const [selectedAmali, setSelectedAmali] = useState<string>('');
  const [amaliTeams, setAmaliTeams] = useState<AmaliTeamDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchAmaliUsers();
  }, []);

  useEffect(() => {
    if (selectedAmali) {
      fetchTeams(selectedAmali);
    } else {
      fetchAllTeams();
    }
    setSelectedIds(new Set());
  }, [selectedAmali]);

  const fetchAmaliUsers = async () => {
    try {
      const users = await authService.getUsersByRole('amali');
      setAmaliUsers(users);
    } catch (err) {
      console.error('Failed to fetch amali users:', err);
    }
  };

  const fetchTeams = async (amaliName: string) => {
    setLoading(true);
    setError('');
    try {
      const teams = await amaliTeamService.getAmaliTeamsByAmaliName(amaliName);
      setAmaliTeams(teams);
    } catch (err) {
      setError('Failed to load amali assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTeams = async () => {
    setLoading(true);
    setError('');
    try {
      const teams = await amaliTeamService.getAllAmaliTeams();
      setAmaliTeams(teams);
    } catch (err) {
      setError('Failed to load amali assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === amaliTeams.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(amaliTeams.map(t => t.id!).filter(Boolean)));
    }
  };

  const handleSelect = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const getTypeLabel = (value: string) =>
    LOADING_TYPES.find(t => t.value === value)?.label ?? value;

  const totalSelectedAmount = amaliTeams
    .filter(t => t.id && selectedIds.has(t.id))
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  // Selected amali team rows
  const selectedTeams = amaliTeams.filter(t => t.id && selectedIds.has(t.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Amali Details</h1>
          </div>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Calculator className="h-5 w-5" />
              Calculate Amount ({selectedIds.size}) — ₹{totalSelectedAmount.toFixed(2)}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
        )}

        {/* Amali filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Amali</label>
          <select
            value={selectedAmali}
            onChange={e => setSelectedAmali(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Amali</option>
            {amaliUsers.map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-r-transparent" />
            </div>
          ) : amaliTeams.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No amali assignments found{selectedAmali ? ` for ${selectedAmali}` : ''}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === amaliTeams.length && amaliTeams.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lorry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rythu</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amali</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loading Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/Bag</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bags</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {amaliTeams.map(team => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!(team.id && selectedIds.has(team.id))}
                          onChange={() => team.id && handleSelect(team.id)}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {team.loadedDate ? new Date(team.loadedDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{team.lorryNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{team.rythu || '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{team.amaliTeamName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {getTypeLabel(team.loadingType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">₹{team.ratePerBag.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-900">{team.totalBags ?? 0}</td>
                      <td className="px-4 py-3 text-gray-900">{team.totalWeight != null ? `${team.totalWeight} kg` : '—'}</td>
                      <td className="px-4 py-3 text-gray-900">₹{(team.totalAmount ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={9} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Grand Total:
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{amaliTeams.reduce((s, t) => s + (t.totalAmount ?? 0), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      <AmaliPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setSelectedIds(new Set());
          selectedAmali ? fetchTeams(selectedAmali) : fetchAllTeams();
        }}
        selectedLoadings={[]}
        selectedTeams={selectedTeams}
      />
    </div>
  );
};

export default Amali;
