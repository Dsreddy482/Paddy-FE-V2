import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, PackagePlus, ChevronDown, ChevronRight, Share2 } from 'lucide-react';
import { loadingService } from '../services/loading';
import { LoadingEntryDetails, LoadingEntry } from '../types/loading';
import { PaddyEntryDetails } from '../types/paddy';
import { paddyService } from '../services/Paddy';
import { AddLoadingModal } from '../components/AddLoadingModal';
import { EditLoadingModal } from '../components/EditLoadingModal';
import { AddPaddyModal } from '../components/AddPaddyModal';
import { EditPaddyModal } from '../components/EditPaddyModal';
import { PaddyConfirmationModal } from '../components/PaddyConfirmationModal';
import { Header } from '../components/Header';
import { shareOnWhatsApp, formatLoadingDetailsForWhatsApp, formatPaddyEntryForWhatsApp } from '../utils/whatsapp';

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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [paddyDetails, setPaddyDetails] = useState<Map<number, PaddyEntryDetails[]>>(new Map());
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [newPaddyEntry, setNewPaddyEntry] = useState<any>(null);
  const [newRythuData, setNewRythuData] = useState<any>(null);
  const [isEditPaddyModalOpen, setIsEditPaddyModalOpen] = useState(false);
  const [selectedPaddyEntry, setSelectedPaddyEntry] = useState<PaddyEntryDetails | null>(null);

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
    setSelectedEntry({
      ...entry,
      loadingId: entry.id
    } as LoadingEntry);
    setIsEditModalOpen(true);
  };

  const handleAddPaddyClick = (entry: LoadingEntryDetails) => {
    setSelectedLoadingEntry(entry);
    setIsAddPaddyModalOpen(true);
  };

  const handleEditPaddyClick = (paddy: PaddyEntryDetails) => {
    setSelectedPaddyEntry(paddy);
    setIsEditPaddyModalOpen(true);
  };

  const toggleRowExpansion = async (entryId: number) => {
    const newExpandedRows = new Set(expandedRows);

    if (expandedRows.has(entryId)) {
      newExpandedRows.delete(entryId);
    } else {
      newExpandedRows.add(entryId);
      if (!paddyDetails.has(entryId)) {
        try {
          const paddy = await paddyService.getPaddyByLoadingId(entryId.toString());
          setPaddyDetails(prev => new Map(prev).set(entryId, paddy));
        } catch (err) {
          console.error('Failed to fetch paddy details:', err);
        }
      }
    }

    setExpandedRows(newExpandedRows);
  };

  const handleSuccess = async (paddyData?: any, rythuData?: any) => {
    await fetchLoadingEntries();
    const expandedIds = Array.from(expandedRows);
    const newPaddyDetailsMap = new Map<number, PaddyEntryDetails[]>();

    for (const id of expandedIds) {
      try {
        const paddy = await paddyService.getPaddyByLoadingId(id.toString());
        newPaddyDetailsMap.set(id, paddy);
      } catch (err) {
        console.error('Failed to refresh paddy details:', err);
      }
    }

    setPaddyDetails(newPaddyDetailsMap);

    if (paddyData && rythuData) {
      setNewPaddyEntry(paddyData);
      setNewRythuData(rythuData);
      setIsConfirmationModalOpen(true);
    }
  };

  const handlePaddySuccess = async () => {
    await fetchLoadingEntries();
    const expandedIds = Array.from(expandedRows);
    const newPaddyDetailsMap = new Map<number, PaddyEntryDetails[]>();

    for (const id of expandedIds) {
      try {
        const paddy = await paddyService.getPaddyByLoadingId(id.toString());
        newPaddyDetailsMap.set(id, paddy);
      } catch (err) {
        console.error('Failed to refresh paddy details:', err);
      }
    }

    setPaddyDetails(newPaddyDetailsMap);
  };

  const handleSharePaddyEntry = (paddy: PaddyEntryDetails) => {
    const message = formatPaddyEntryForWhatsApp(
      {
        lorryNumber: paddy.lorryNumber,
        loadedDate: paddy.loadedDate,
        totalWeight: paddy.totalWeight || 0,
        bags: paddy.bags,
        kgperBag: paddy.kgperBag,
        bagAmount: paddy.bagAmount,
        finalAmount: paddy.finalAmount,
        status: paddy.status,
      },
      paddy.rythu
    );

    const phoneNumber = paddy.rythuPhone || '';
    shareOnWhatsApp(message, phoneNumber);
  };

  const handleShareLoading = async (entry: LoadingEntryDetails) => {
    let paddy = paddyDetails.get(entry.id);

    if (!paddy) {
      try {
        paddy = await paddyService.getPaddyByLoadingId(entry.id.toString());
      } catch (err) {
        console.error('Failed to fetch paddy details for sharing:', err);
      }
    }

    const message = formatLoadingDetailsForWhatsApp({
      ...entry,
      paddyDetails: paddy
    });

    shareOnWhatsApp(message);
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    </th>
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
                      Total Bags
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingEntries.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => toggleRowExpansion(entry.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedRows.has(entry.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                        </td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.totalNoOfBags || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.totalLoadWeight || 0} kg
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
                            onClick={() => handleShareLoading(entry)}
                            className="text-emerald-600 hover:text-emerald-900 inline-flex items-center"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(entry.id) && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="overflow-x-auto">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Paddy Details</h4>
                              {paddyDetails.get(entry.id)?.length ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Rythu
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Bags
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        KGs per Bag
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Total Weight
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Amount/Bag
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Dealer Amount/Bag
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Load Type
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {paddyDetails.get(entry.id)?.map((paddy) => (
                                      <tr key={paddy.id}>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {paddy.rythu}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {paddy.bags}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {paddy.kgperBag}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {paddy.totalWeight} kg
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          ₹{paddy.bagAmount}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          ₹{paddy.dealerBagAmount}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {paddy.loadType || 'potha'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            paddy.status === 'completed'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {paddy.status || 'pending'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium space-x-2">
                                          <button
                                            onClick={() => handleEditPaddyClick(paddy)}
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                          >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleSharePaddyEntry(paddy)}
                                            className="text-emerald-600 hover:text-emerald-900 inline-flex items-center"
                                            title="Share on WhatsApp"
                                          >
                                            <Share2 className="h-4 w-4 mr-1" />
                                            Share
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No paddy entries found for this loading.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

      <PaddyConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => {
          setIsConfirmationModalOpen(false);
          setNewPaddyEntry(null);
          setNewRythuData(null);
        }}
        paddyEntry={newPaddyEntry}
        rythu={newRythuData}
      />

      <EditPaddyModal
        isOpen={isEditPaddyModalOpen}
        onClose={() => {
          setIsEditPaddyModalOpen(false);
          setSelectedPaddyEntry(null);
        }}
        onSuccess={handlePaddySuccess}
        paddyEntry={selectedPaddyEntry ? {
          id: selectedPaddyEntry.id,
          lorryNumber: selectedPaddyEntry.lorryNumber,
          bags: selectedPaddyEntry.bags,
          kgsPerBag: selectedPaddyEntry.kgperBag,
          bagAmount: selectedPaddyEntry.bagAmount,
          dealerBagAmount: selectedPaddyEntry.dealerBagAmount,
          loadedDate: selectedPaddyEntry.loadedDate,
          totalWeight: selectedPaddyEntry.totalWeight,
          loadType: selectedPaddyEntry.loadType,
          userId: selectedPaddyEntry.userId,
          dealerId: selectedPaddyEntry.dealerId,
          loadingId: selectedPaddyEntry.loadingId
        } : null}
      />
    </div>
  );
};

export default Loading;
