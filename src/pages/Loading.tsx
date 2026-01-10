import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, PackagePlus } from 'lucide-react';
import { loadingService } from '../services/loading';
import { LoadingEntryDetails, LoadingEntry } from '../types/loading';
import { AddLoadingModal } from '../components/AddLoadingModal';
import { EditLoadingModal } from '../components/EditLoadingModal';
import { AddPaddyModal } from '../components/AddPaddyModal';
import { Header } from '../components/Header';

export const Loading: React.FC = () => {
  const navigate = useNavigate();
  const [loadingEntries, setLoadingEntries] = useState<LoadingEntryDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPaddyModalOpen, setIsAddPaddyModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LoadingEntry | null>(null);
  const [selectedLoadingEntry, setSelectedLoadingEntry] = useState<LoadingEntryDetails | null>(null);

  useEffect(() => {
    fetchLoadingEntries();
  }, []);

  const fetchLoadingEntries = async () => {
    try {
      setLoading(true);
      const entries = await loadingService.getLoadingEntries();
      setLoadingEntries(entries);
    } catch (err) {
      setError('Failed to load loading entries');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (entry: LoadingEntryDetails) => {
    setSelectedEntry(entry as LoadingEntry);
    setIsEditModalOpen(true);
  };

  const handleAddPaddyClick = (entry: LoadingEntryDetails) => {
    setSelectedLoadingEntry(entry);
    setIsAddPaddyModalOpen(true);
  };

  const handleDeleteClick = async (userId: string | undefined) => {
    if (!userId) return;

    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await loadingService.deleteLoadingEntry(userId);
        setLoadingEntries(entries => entries.filter(e => e.userId !== userId));
      } catch (err) {
        setError('Failed to delete loading entry');
      }
    }
  };

  const handleSuccess = async () => {
    await fetchLoadingEntries();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Loading Details</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Loading Entry
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loadingEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No loading entries found. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lorry Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dealer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amali
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingEntries.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.loadedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.lorryNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.delaerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.amaliName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleAddPaddyClick(entry)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                        >
                          <PackagePlus className="h-4 w-4 mr-1" />
                          Add Paddy
                        </button>
                        <button
                          onClick={() => handleEditClick(entry)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(entry.userId)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddLoadingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditLoadingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEntry(null);
        }}
        onSuccess={handleSuccess}
        loadingEntry={selectedEntry}
      />

      <AddPaddyModal
        isOpen={isAddPaddyModalOpen}
        onClose={() => {
          setIsAddPaddyModalOpen(false);
          setSelectedLoadingEntry(null);
        }}
        onSuccess={handleSuccess}
        userId={selectedLoadingEntry?.id?.toString() || ''}
        loadingId={selectedLoadingEntry?.id?.toString() || ''}
        loadingEntry={selectedLoadingEntry}
      />
    </div>
  );
};

export default Loading;
