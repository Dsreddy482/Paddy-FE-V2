import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter, User, ExternalLink, Share2 } from 'lucide-react';
import { paddyService } from '../services/Paddy';
import { PaddyEntryDetails } from '../types/paddy';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Header } from './Header';
import { shareOnWhatsApp, formatPaddyEntryForWhatsApp } from '../utils/whatsapp';

interface FilterState {
  lorryNumber: string;
  dateFrom: string;
  dateTo: string;
  amountFrom: string;
  amountTo: string;
  status: 'all' | 'completed' | 'pending';
  userName: string;
}

const AllPaddyDetails: React.FC = () => {
  const navigate = useNavigate();
  const [paddyEntries, setPaddyEntries] = useState<PaddyEntryDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    lorryNumber: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    status: 'all',
    userName: ''
  });

  useEffect(() => {
    fetchPaddyEntries();
  }, []);

  const fetchPaddyEntries = async () => {
    try {
      setLoading(true);
      const entries = await paddyService.getAllPaddyEntries();
      setPaddyEntries(entries);
    } catch (err) {
      setError('Failed to load paddy entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      lorryNumber: '',
      dateFrom: '',
      dateTo: '',
      amountFrom: '',
      amountTo: '',
      status: 'all',
      userName: ''
    });
  };

  const getFilteredEntries = () => {
    let filtered = [...paddyEntries];

    if (filters.lorryNumber) {
      filtered = filtered.filter(entry =>
        entry.lorryNumber.toLowerCase().includes(filters.lorryNumber.toLowerCase())
      );
    }

    if (filters.userName) {
      filtered = filtered.filter(entry =>
        (entry.rythu?.toLowerCase() || '').includes(filters.userName.toLowerCase()) ||
        (entry.dealer?.toLowerCase() || '').includes(filters.userName.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(entry =>
        entry.loadedDate >= filters.dateFrom
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(entry =>
        entry.loadedDate <= filters.dateTo
      );
    }

    if (filters.amountFrom) {
      const minAmount = parseFloat(filters.amountFrom);
      filtered = filtered.filter(entry =>
        entry.finalAmount >= minAmount
      );
    }

    if (filters.amountTo) {
      const maxAmount = parseFloat(filters.amountTo);
      filtered = filtered.filter(entry =>
        entry.finalAmount <= maxAmount
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(entry =>
        entry.status.toLowerCase() === filters.status
      );
    }

    return filtered;
  };

  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const toggleAllEntries = () => {
    const filteredEntries = getFilteredEntries();
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map(entry => entry.id!)));
    }
  };

  const downloadSelectedPDF = async () => {
    if (selectedEntries.size === 0) return;

    try {
      const pdf = new jsPDF();
      const selectedEntriesList = paddyEntries.filter(entry => selectedEntries.has(entry.id!));

      pdf.setFontSize(20);
      pdf.text('Paddy Details Report', 20, 20);

      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

      const tableHead = [
        [
          'Date',
          'Lorry Number',
          'Rythu',
          'Dealer',
          'Weight (KGs)',
          'Bags',
          'Amount/Bag',
          'Total Amount',
          'Dealer Bag Amount',
          'Dealer Final Amount'
        ]
      ];

      const tableBody = selectedEntriesList.map(entry => [
        entry.loadedDate.split('T')[0],
        entry.lorryNumber,
        entry.rythu || '-',
        entry.dealer || '-',
        entry.totalWeight!.toLocaleString(),
        entry.bags.toLocaleString(),
        `₹${entry.bagAmount.toLocaleString()}`,
        `₹${entry.finalAmount.toLocaleString()}`,
        `${entry.dealerBagAmount.toLocaleString()}`,
        `${entry.dealerFinalAmount.toLocaleString()}`
      ]);

      autoTable(pdf, {
        startY: 45,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: 20,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
      });

      const finalY = (pdf as any).lastAutoTable.finalY + 20;

      const totalAmount = selectedEntriesList.reduce((sum, entry) => sum + entry.finalAmount, 0);
      const totalBags = selectedEntriesList.reduce((sum, entry) => sum + entry.bags, 0);
      const totalWeight = selectedEntriesList.reduce((sum, entry) => sum + entry.totalWeight!, 0);

      pdf.text('Summary:', 20, finalY);

      const summaryData = [
        ['Total Entries', selectedEntriesList.length.toString()],
        ['Total Bags', totalBags.toLocaleString()],
        ['Total Weight (KGs)', totalWeight.toLocaleString()],
        ['Total Amount', `₹${totalAmount.toLocaleString()}`]
      ];

      autoTable(pdf, {
        startY: finalY + 10,
        body: summaryData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 2,
        },
      });

      pdf.save(`paddy-entries-report-${new Date().toISOString()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const navigateToUser = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleSharePaddyEntry = (entry: PaddyEntryDetails) => {
    const message = formatPaddyEntryForWhatsApp(
      {
        lorryNumber: entry.lorryNumber,
        loadedDate: entry.loadedDate,
        totalWeight: entry.totalWeight || 0,
        bags: entry.bags,
        kgperBag: entry.kgperBag,
        bagAmount: entry.bagAmount,
        finalAmount: entry.finalAmount,
        status: entry.status,
      },
      entry.rythu
    );

    const phoneNumber = entry.rythuPhone || '';
    shareOnWhatsApp(message, phoneNumber);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
      </div>
    );
  }

  const filteredEntries = getFilteredEntries();

  return (
    <div className="min-h-screen bg-gray-50">
            <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">All Paddy Entries</h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lorry Number</label>
                  <input
                    type="text"
                    name="lorryNumber"
                    value={filters.lorryNumber}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Search lorry number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User Name</label>
                  <input
                    type="text"
                    name="userName"
                    value={filters.userName}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Search by rythu or dealer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">From Date</label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">To Date</label>
                  <input
                    type="date"
                    name="dateTo"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Amount</label>
                  <input
                    type="number"
                    name="amountFrom"
                    value={filters.amountFrom}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Min amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Amount</label>
                  <input
                    type="number"
                    name="amountTo"
                    value={filters.amountTo}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    placeholder="Max amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedEntries.size === filteredEntries.length}
                onChange={toggleAllEntries}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">
                {selectedEntries.size} selected
              </span>
            </div>
            <button
              onClick={downloadSelectedPDF}
              disabled={selectedEntries.size === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Selected
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedEntries.size === filteredEntries.length}
                      onChange={toggleAllEntries}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lorry Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight & Bags
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dealer Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(entry.id!)}
                        onChange={() => toggleEntrySelection(entry.id!)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.loadedDate.split('T')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.lorryNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => navigateToUser(entry.userId!)}
                          className="flex items-center text-sm text-gray-900 hover:text-green-600 transition-colors group"
                        >
                          <User className="h-4 w-4 mr-1 text-gray-400 group-hover:text-green-500" />
                          <span>Rythu: {entry.rythu || '-'}</span>
                          <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button
                          onClick={() => navigateToUser(entry.dealerId)}
                          className="flex items-center text-sm text-gray-900 hover:text-green-600 transition-colors group"
                        >
                          <User className="h-4 w-4 mr-1 text-gray-400 group-hover:text-green-500" />
                          <span>Dealer: {entry.dealer || '-'}</span>
                          <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.totalWeight!.toLocaleString()} KGs</div>
                      <div className="text-sm text-gray-500">{entry.bags.toLocaleString()} bags</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{entry.bagAmount.toLocaleString()}/bag</div>
                      <div className="text-sm font-medium text-green-600">
                        Total: ₹{entry.finalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{entry.dealerBagAmount.toLocaleString()}/bag</div>
                      <div className="text-sm font-medium text-green-600">
                        Total: ₹{entry.dealerFinalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleSharePaddyEntry(entry)}
                        className="text-emerald-600 hover:text-emerald-900 focus:outline-none inline-flex items-center"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="h-5 w-5 mr-1" />
                        Share
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllPaddyDetails;

export { AllPaddyDetails }