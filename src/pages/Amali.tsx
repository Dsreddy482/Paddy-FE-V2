import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import { loadingService } from '../services/loading';
import { LoadingEntryDetails } from '../types/loading';
import { PaddyEntryDetails } from '../types/paddy';
import { paddyService } from '../services/Paddy';
import { Header } from '../components/Header';
import { EditLoadingModal } from '../components/EditLoadingModal';
import { EditPaddyModal } from '../components/EditPaddyModal';

export const Amali: React.FC = () => {
  const navigate = useNavigate();
  const [loadingEntries, setLoadingEntries] = useState<LoadingEntryDetails[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LoadingEntryDetails[]>([]);
  const [amaliList, setAmaliList] = useState<string[]>([]);
  const [selectedAmali, setSelectedAmali] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [paddyDetails, setPaddyDetails] = useState<Map<number, PaddyEntryDetails[]>>(new Map());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLoadingEntry, setSelectedLoadingEntry] = useState<LoadingEntryDetails | null>(null);
  const [isEditPaddyModalOpen, setIsEditPaddyModalOpen] = useState(false);
  const [selectedPaddyEntry, setSelectedPaddyEntry] = useState<PaddyEntryDetails | null>(null);

  useEffect(() => {
    fetchLoadingEntries();
  }, []);

  useEffect(() => {
    if (selectedAmali) {
      const filtered = loadingEntries.filter(entry => entry.amaliName === selectedAmali);
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(loadingEntries);
    }
  }, [selectedAmali, loadingEntries]);

  const fetchLoadingEntries = async () => {
    try {
      setLoading(true);
      const entries = await loadingService.getLoadingEntries();
      setLoadingEntries(entries);

      const uniqueAmali = Array.from(new Set(entries.map(entry => entry.amaliName).filter(Boolean)));
      setAmaliList(uniqueAmali.sort());

      if (uniqueAmali.length > 0 && !selectedAmali) {
        setSelectedAmali(uniqueAmali[0]);
      }
    } catch (err) {
      setError('Failed to load loading entries');
    } finally {
      setLoading(false);
    }
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

  const handleEditClick = (entry: LoadingEntryDetails) => {
    setSelectedLoadingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleEditPaddyClick = (paddy: PaddyEntryDetails) => {
    setSelectedPaddyEntry(paddy);
    setIsEditPaddyModalOpen(true);
  };

  const handlePaddySuccess = async () => {
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

  const handleSuccess = async () => {
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
            <h1 className="text-2xl font-bold text-gray-900">Amali Details</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Amali
          </label>
          <select
            value={selectedAmali}
            onChange={(e) => setSelectedAmali(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Amali</option>
            {amaliList.map((amali) => (
              <option key={amali} value={amali}>
                {amali}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No loading entries found for the selected amali.</p>
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
                      Total Bags
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
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
                          {entry.totalNoOfBags || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.totalLoadWeight || 0} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            entry.paymentDone
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.paymentDone ? 'Done' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(entry)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
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
                                        <td className="px-4 py-2 text-sm font-medium">
                                          <button
                                            onClick={() => handleEditPaddyClick(paddy)}
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                          >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
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

      <EditLoadingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLoadingEntry(null);
        }}
        onSuccess={handleSuccess}
        loadingEntry={selectedLoadingEntry ? {
          ...selectedLoadingEntry,
          loadingId: selectedLoadingEntry.id
        } : null}
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
          loadType: selectedPaddyEntry.loadType
        } : null}
      />
    </div>
  );
};

export default Amali;
