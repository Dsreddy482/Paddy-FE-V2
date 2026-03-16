import React, { useState, useEffect } from 'react';
import { X, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { AmaliTeam } from '../types/amaliTeam';
import { amaliTeamService } from '../services/amaliTeam';
import AddAmaliTeamModal from './AddAmaliTeamModal';
import EditAmaliTeamModal from './EditAmaliTeamModal';

interface ViewAmaliModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadingId: number;
  loadingDetails: {
    lorryNumber: string;
    loadedDate: string;
    dealerName: string;
    amaliName: string;
    totalNoOfBags?: number;
  };
}

export default function ViewAmaliModal({
  isOpen,
  onClose,
  loadingId,
  loadingDetails
}: ViewAmaliModalProps) {
  const [amaliTeams, setAmaliTeams] = useState<AmaliTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AmaliTeam | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAmaliTeams();
    }
  }, [isOpen, loadingId]);

  const loadAmaliTeams = async () => {
    setLoading(true);
    try {
      const teams = await amaliTeamService.getAmaliTeamsByLoading(loadingId);
      setAmaliTeams(teams);
    } catch (error) {
      console.error('Failed to load amali teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId: number) => {
    if (!confirm('Are you sure you want to delete this amali team?')) {
      return;
    }

    try {
      await amaliTeamService.deleteAmaliTeam(teamId);
      await loadAmaliTeams();
    } catch (error) {
      console.error('Failed to delete amali team:', error);
      alert('Failed to delete amali team');
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadAmaliTeams();
  };

  const handleEditSuccess = () => {
    setEditingTeam(null);
    loadAmaliTeams();
  };

  const getLoadingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      potha: 'Potha',
      kata: 'Kata',
      loading: 'Loading',
      combined: 'Combined'
    };
    return labels[type] || type;
  };

  const totalAmount = amaliTeams.reduce((sum, team) => sum + (team.totalAmount || 0), 0);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Amali Teams</h2>
              <div className="text-sm text-gray-600 mt-2">
                <p>Lorry: {loadingDetails.lorryNumber} | Date: {new Date(loadingDetails.loadedDate).toLocaleDateString()}</p>
                <p>Dealer: {loadingDetails.dealerName} | Amali: {loadingDetails.amaliName}</p>
                {loadingDetails.totalNoOfBags && <p>Total Bags: {loadingDetails.totalNoOfBags}</p>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Amali Team
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : amaliTeams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No amali teams added yet. Click "Add Amali Team" to get started.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loading Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate Per Bag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Bags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {amaliTeams.map((team) => (
                      <tr key={team.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.amaliTeamName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {getLoadingTypeLabel(team.loadingType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {team.ratePerBag.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.totalBags || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {(team.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTeam(team)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => team.id && handleDelete(team.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right font-semibold text-gray-900">
                        Total Amount:
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        Rs. {totalAmount.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddAmaliTeamModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          loadingId={loadingId}
        />
      )}

      {editingTeam && (
        <EditAmaliTeamModal
          isOpen={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          onSuccess={handleEditSuccess}
          team={editingTeam}
        />
      )}
    </>
  );
}
