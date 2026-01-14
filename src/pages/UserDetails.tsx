import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Plus, Download, CheckCircle, Clock, Edit, Filter, IndianRupee, Share2 } from 'lucide-react';
import { authService } from '../services/auth';
import { paddyService } from '../services/Paddy';
import { transactionService } from '../services/transaction';
import { AddPaddyModal } from '../components/AddPaddyModal';
import { EditPaddyModal } from '../components/EditPaddyModal';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionsModal } from '../components/TransactionsModal';
import { PaddyConfirmationModal } from '../components/PaddyConfirmationModal';
import { useAuthStore } from '../store/authStore';
import { PaddyEntry, PaddyEntryDetails } from '../types/paddy';
import { Transaction } from '../types/transaction';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Header } from '../components/Header';
import { shareOnWhatsApp, formatPaddyEntryForWhatsApp, formatUserSummaryForWhatsApp } from '../utils/whatsapp';

interface FilterState {
  lorryNumber: string;
  dateFrom: string;
  dateTo: string;
  amountFrom: string;
  amountTo: string;
}

type TabType = 'all' | 'completed' | 'pending';

export const UserDetails: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const loggedInUser = useAuthStore((state) => state.user);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [paddyEntries, setPaddyEntries] = useState<PaddyEntryDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddPaddyModalOpen, setIsAddPaddyModalOpen] = useState(false);
  const [isEditPaddyModalOpen, setIsEditPaddyModalOpen] = useState(false);
  const [selectedPaddyEntry, setSelectedPaddyEntry] = useState<PaddyEntry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    lorryNumber: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
  });
  const [isAddPayableModalOpen, setIsAddPayableModalOpen] = useState(false);
  const [isAddReceivableModalOpen, setIsAddReceivableModalOpen] = useState(false);
  const [isPayablesModalOpen, setIsPayablesModalOpen] = useState(false);
  const [isReceivablesModalOpen, setIsReceivablesModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [newPaddyEntry, setNewPaddyEntry] = useState<any>(null);
  const [newRythuData, setNewRythuData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const [userData, paddyData, payables, receivables] = await Promise.all([
          authService.getUserById(userId),
          paddyService.getUserPaddyEntries(userId),
          transactionService.getUserTransactions(userId, 'payable'),
          transactionService.getUserTransactions(userId, 'receivable')
        ]);
        
        setSelectedUser(userData);
        setPaddyEntries(paddyData);
        setTransactions([...payables, ...receivables]);

        if (paddyData.length > 10 && tableRef.current) {
          setTimeout(() => {
            tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      } catch (err) {
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleTransactionSuccess = async () => {
    if (userId) {
      try {
        const [payables, receivables] = await Promise.all([
          transactionService.getUserTransactions(userId, 'payable'),
          transactionService.getUserTransactions(userId, 'receivable')
        ]);
        setTransactions([...payables, ...receivables]);
      } catch (err) {
        console.error('Failed to refresh transactions:', err);
      }
    }
  };

  const calculateTransactionTotals = () => {
    const payables = transactions
      .filter(t => t.type === 'payable' && t.status.toLowerCase() === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const receivables = transactions
      .filter(t => t.type === 'receivable' && t.status.toLowerCase() === 'pending' )
      .reduce((sum, t) => sum + t.amount, 0);

    return { payables, receivables };
  };

  const downloadPendingTransactionsPDF = (type: 'payable' | 'receivable') => {
    const pendingTransactions = transactions.filter(t => 
      t.type === type && t.status.toLowerCase() === 'pending'
    );

    if (pendingTransactions.length === 0) return;

    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text(`${type === 'payable' ? 'Payables' : 'Receivables'} Report`, 20, 20);

    pdf.setFontSize(12);
    pdf.text(`User: ${selectedUser.name}`, 20, 35);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 42);

    const tableHead = [
      ['Date', 'Amount', 'Reason']
    ];

    const tableBody = pendingTransactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      `${transaction.amount.toLocaleString()}`,
      transaction.reason
    ]);

    autoTable(pdf, {
      startY: 50,
      head: tableHead,
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 20,
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
      },
    });

    const finalY = (pdf as any).lastAutoTable.finalY + 20;

    const totalAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);

    pdf.text('Summary:', 20, finalY);
    
    const summaryData = [
      ['Total Entries', pendingTransactions.length.toString()],
      ['Total Amount', `${totalAmount.toLocaleString()}`]
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

    pdf.save(`pending-${type}-${new Date().toISOString()}.pdf`);
  };

  const handlePaddySuccess = async (paddyData?: any, rythuData?: any) => {
    if (userId) {
      try {
        const paddyDataList = await paddyService.getUserPaddyEntries(userId);
        setPaddyEntries(paddyDataList);

        if (paddyData && rythuData) {
          setNewPaddyEntry(paddyData);
          setNewRythuData(rythuData);
          setIsConfirmationModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to refresh paddy entries:', err);
      }
    }
  };

  const handleEditClick = (entry: PaddyEntryDetails) => {
    const details = {
      "id": entry.id,
      "lorryNumber": entry.lorryNumber,
      "bags": entry.bagAmount,
      "kgsPerBag": entry.kgperBag,
      "bagAmount": entry.bagAmount,
      "loadedDate": entry.loadedDate,
      "totalWeight": entry.totalWeight,
      "userId": entry.userId,
      "dealerId": entry.dealerId,
      "dealerBagAmount": entry.dealerBagAmount,
    } as unknown as PaddyEntry;
    setSelectedPaddyEntry(details);
    setIsEditPaddyModalOpen(true);
  };

  const calculateGrandTotal = () => {
    return paddyEntries.reduce((total, entry) => {
      return total + (selectedUser.role === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount);
    }, 0);
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'completed') => {
    if (!id) return;
    
    setUpdatingStatus(id);
    try {
      await paddyService.updatePaddyStatus(id, newStatus, selectedUser.role);
      if (selectedUser.role === 'vendor') {
        setPaddyEntries(entries => 
          entries.map(entry => 
            entry.id === id ? { ...entry, dealerPaddyStatus: newStatus } : entry
          )
        ); 
      }
      else {
        setPaddyEntries(entries => 
          entries.map(entry => 
            entry.id === id ? { ...entry, status: newStatus } : entry
          )
        );
      }
      
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    });
  };

  const getFilteredEntries = () => {
    let filtered = paddyEntries;

    switch (activeTab) {
      case 'completed':
        filtered = filtered.filter(entry => 
          (selectedUser.role === 'vendor' ? entry.dealerPaddyStatus.toLowerCase() : entry.status.toLowerCase()) === 'completed'
        );
        break;
      case 'pending':
        filtered = filtered.filter(entry => 
          (selectedUser.role === 'vendor' ? entry.dealerPaddyStatus.toLowerCase() : entry.status.toLowerCase()) === 'pending'
        );
        break;
    }

    if (filters.lorryNumber) {
      filtered = filtered.filter(entry =>
        entry.lorryNumber.toLowerCase().includes(filters.lorryNumber.toLowerCase())
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
        (selectedUser.role === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount) >= minAmount
      );
    }
    if (filters.amountTo) {
      const maxAmount = parseFloat(filters.amountTo);
      filtered = filtered.filter(entry =>
        (selectedUser.role === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount) <= maxAmount
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

  const getCombinedData = () => {
    const combinedMap = new Map();
    
    getFilteredEntries().forEach(entry => {
      const key = `${entry.lorryNumber}-${entry.loadedDate.split('T')[0]}-${entry.dealerBagAmount}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          lorryNumber: entry.lorryNumber,
          date: entry.loadedDate.split('T')[0],
          totalWeight: 0,
          totalBags: 0,
          totalAmount: 0,
          dealerBagAmount: entry.dealerBagAmount,
          entries: []
        });
      }
      const data = combinedMap.get(key);
      data.totalWeight += entry.totalWeight || 0;
      data.totalBags += entry.bags;
      data.totalAmount += selectedUser.role === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount;
      data.entries.push(entry);
    });

    return Array.from(combinedMap.values());
  };

  const downloadSelectedPDF = async () => {
    if (selectedEntries.size === 0) return;
  
    try {
      const pdf = new jsPDF();
  
      pdf.setFontSize(20);
      pdf.text('Paddy Details Report', 20, 20);
  
      pdf.setFontSize(12);
      pdf.text(`User: ${selectedUser.name}`, 20, 35);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42);
  
      let startY = 60;
      const selectedEntriesList = paddyEntries.filter(entry => selectedEntries.has(entry.id!));
  
      const tableHead = [
        [
          'Lorry Number',
          'Weight (KGs)',
          'Number of Bags',
          'KGs per Bag',
          'Amount per Bag',
          'Total Amount',
          'Status',
          'Date'
        ]
      ];
  
      const tableBody = selectedEntriesList.map(entry => [
        entry.lorryNumber,
        entry.totalWeight!.toLocaleString(),
        entry.bags.toLocaleString(),
        entry.kgperBag.toLocaleString(),
        selectedUser.role == 'vendor' ?  entry.dealerBagAmount.toLocaleString() : entry.bagAmount.toLocaleString(),
        selectedUser.role == 'vendor' ?  entry.dealerFinalAmount.toLocaleString() : entry.finalAmount.toLocaleString(),
        entry.status === 'completed' ? 'Completed' : 'Pending',
        entry.loadedDate.split('T')[0],
      ]);
  
      autoTable(pdf, {
        startY,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: 20,
        },
        styles: {
          fontSize: 10,
          cellPadding: 2,
        },
      });
  
      startY = (pdf as any).lastAutoTable.finalY + 20;
  
      const totalAmount = selectedEntriesList.reduce((sum, entry) => sum + (selectedUser.role == 'vendor' ? entry.dealerFinalAmount : entry.finalAmount), 0);
      const totalBags = selectedEntriesList.reduce((sum, entry) => sum + entry.bags, 0);
      const totalWeight = selectedEntriesList.reduce((sum, entry) => sum + entry.totalWeight!, 0);
  
      pdf.text('Summary:', 20, startY);
      startY += 10;
  
      const summaryData = [
        ['Total Entries', selectedEntriesList.length.toString()],
        ['Total Bags', totalBags.toLocaleString()],
        ['Total Weight (KGs)', totalWeight.toLocaleString()],
        ['Total Amount', totalAmount.toLocaleString()],
      ];
  
      autoTable(pdf, {
        startY,
        body: summaryData,
        theme: 'striped',
        styles: {
          fontSize: 10,
          cellPadding: 2,
        },
      });
  
      pdf.save(`paddy_entries_${new Date().toISOString()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const downloadPDF = (entry: PaddyEntryDetails) => {
    const pdf = new jsPDF();
    const formattedDate = entry.loadedDate.split('T')[0];
  
    pdf.setFontSize(20);
    pdf.text('Paddy Entry Details', 20, 20);
  
    pdf.setFontSize(12);
    pdf.text(`User: ${selectedUser.name}`, 20, 35);
    pdf.text(`Date: ${formattedDate}`, 20, 42);
  
    const tableHead = [
      [
        'Lorry Number',
        'Weight (KGs)',
        'Number of Bags',
        'KGs per Bag',
        'Amount per Bag',
        'Total Amount'
      ]
    ];
  
    const tableBody = [
      [
        entry.lorryNumber,
        entry.totalWeight!.toLocaleString(),
        entry.bags.toLocaleString(),
        entry.kgperBag.toLocaleString(),
        entry.bagAmount.toLocaleString(),
        entry.finalAmount.toLocaleString(),
      ]
    ];
  
    autoTable(pdf, {
      startY: 50,
      head: tableHead,
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 20,
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
      },
    });
  
    const pageHeight = pdf.internal.pageSize.height;
    pdf.setFontSize(10);
    pdf.text('Generated on: ' + new Date().toLocaleString(), 20, pageHeight - 20);
  
    pdf.save(`paddy-entry-${entry.lorryNumber}-${entry.loadedDate.split('T')[0]}.pdf`);
  };

  const downloadCombinedPDF = () => {
    const combinedData = getCombinedData();
    const pdf = new jsPDF();

    pdf.setFontSize(20);
    pdf.text('Combined Paddy Report', 20, 20);

    pdf.setFontSize(12);
    pdf.text(`Vendor: ${selectedUser.name}`, 20, 35);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 42);

    const tableHead = [
      [
        'Lorry Number',
        'Date',
        'Total Weight (KGs)',
        'Total Bags',
        'Bag Amount',
        'Total Amount'
      ]
    ];

    const tableBody = combinedData.map(data => [
      data.lorryNumber,
      data.date,
      data.totalWeight.toLocaleString(),
      data.totalBags.toLocaleString(),
      data.dealerBagAmount.toLocaleString(),
      data.totalAmount.toLocaleString()
    ]);

    autoTable(pdf, {
      startY: 50,
      head: tableHead,
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 20,
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
      },
    });

    const finalY = (pdf as any).lastAutoTable.finalY + 20;

    const totalWeight = combinedData.reduce((sum, data) => sum + data.totalWeight, 0);
    const totalBags = combinedData.reduce((sum, data) => sum + data.totalBags, 0);
    const totalAmount = combinedData.reduce((sum, data) => sum + data.totalAmount, 0);

    pdf.text('Summary:', 20, finalY);

    const summaryData = [
      ['Total Entries', combinedData.length.toString()],
      ['Total Weight (KGs)', totalWeight.toLocaleString()],
      ['Total Bags', totalBags.toLocaleString()],
      ['Total Amount', totalAmount.toLocaleString()]
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

    pdf.save(`combined-paddy-report-${new Date().toISOString()}.pdf`);
  };

  const handleSharePaddyEntry = (entry: PaddyEntryDetails) => {
    const message = formatPaddyEntryForWhatsApp(
      {
        lorryNumber: entry.lorryNumber,
        loadedDate: entry.loadedDate,
        totalWeight: entry.totalWeight,
        bags: entry.bags,
        kgperBag: entry.kgperBag,
        bagAmount: selectedUser.role === 'vendor' ? entry.dealerBagAmount : entry.bagAmount,
        finalAmount: selectedUser.role === 'vendor' ? entry.dealerFinalAmount : entry.finalAmount,
        status: selectedUser.role === 'vendor' ? entry.dealerPaddyStatus : entry.status,
      },
      selectedUser.role === 'vendor' ? entry.rythu : selectedUser.name
    );

    const phoneNumber = selectedUser.role === 'vendor'
      ? (entry.rythuPhone || selectedUser.phoneNumber)
      : selectedUser.phoneNumber;

    shareOnWhatsApp(message, phoneNumber);
  };

  const handleShareUserSummary = () => {
    const { payables, receivables } = calculateTransactionTotals();
    const paddyAmount = calculateGrandTotal();
    const netBalance = paddyAmount - receivables - payables;

    const message = formatUserSummaryForWhatsApp(
      selectedUser.name,
      paddyAmount,
      payables,
      receivables,
      netBalance
    );
    shareOnWhatsApp(message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
      </div>
    );
  }

  if (error || !selectedUser || !userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'User not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const filteredEntries = getFilteredEntries();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex space-x-2">
            {selectedUser?.role !== 'vendor' && (
              <button
                onClick={() => setIsAddPaddyModalOpen(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Paddy</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-4 py-5 sm:px-6 bg-green-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-green-800">
                    {selectedUser.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-green-600 font-medium">{selectedUser.role}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsAddPayableModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payable
                </button>
                <button
                  onClick={() => setIsAddReceivableModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Receivable
                </button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500">Paddy Amount:</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">₹{calculateGrandTotal().toLocaleString()}</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsPayablesModalOpen(true)}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Pending Payables
                    </button>
                    <span className="text-xl font-bold text-red-600">
                      ₹{calculateTransactionTotals().payables.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadPendingTransactionsPDF('payable')}
                    className="mt-2 inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Report
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsReceivablesModalOpen(true)}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Pending Receivables
                    </button>
                    <span className="text-xl font-bold text-green-600">
                      ₹{calculateTransactionTotals().receivables.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadPendingTransactionsPDF('receivable')}
                    className="mt-2 inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Report
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">Net Balance</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{(calculateGrandTotal() - calculateTransactionTotals().receivables - calculateTransactionTotals().payables).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={handleShareUserSummary}
                    className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedUser.role === 'vendor' && (
          <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Combined Data View</h3>
                <button
                  onClick={downloadCombinedPDF}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Combined Report
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lorry Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Bags
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bag Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCombinedData().map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.lorryNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.totalWeight.toLocaleString()} KGs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.totalBags.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{data.dealerBagAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{data.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-2 sm:px-6 border-b-2 font-medium text-sm`}
            >
              All ({paddyEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`${
                activeTab === 'completed'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-2 sm:px-6 border-b-2 font-medium text-sm`}
            >
              Completed ({paddyEntries.filter(e => (selectedUser.role == 'vendor'?  e.dealerPaddyStatus.toLowerCase() : e.status.toLowerCase()) === 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`${
                activeTab === 'pending'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-2 sm:px-6 border-b-2 font-medium text-sm`}
            >
              Pending ({paddyEntries.filter(e => (selectedUser.role == 'vendor'?  e.dealerPaddyStatus.toLowerCase() : e.status.toLowerCase()) === 'pending').length})
            </button>
          </nav>
        </div>

        <div ref={tableRef} className="bg-white rounded-lg shadow-md overflow-hidden mt-4">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Paddy Entries</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center mb-4 sm:mb-0">
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
            <div className={`max-h-[600px] overflow-y-auto ${paddyEntries.length > 10 ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
              {filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No paddy entries found for this user.
                </div>
              ) : (
                <div className="min-w-full divide-y divide-gray-200">
                  <div className="bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
                      <div className="font-medium text-xs text-gray-500 uppercase">Select</div>
                      <div className="font-medium text-xs text-gray-500 uppercase">Lorry Details</div>
                      <div className="font-medium text-xs text-gray-500 uppercase">Weight & Bags</div>
                      <div className="font-medium text-xs text-gray-500 uppercase">Amount Details</div>
                      <div className="font-medium text-xs text-gray-500 uppercase">Status</div>
                      <div className="font-medium text-xs text-gray-500 uppercase">Actions</div>
                    </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map((entry) => (
                      <div key={entry.id} className="hover:bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedEntries.has(entry.id!)}
                              onChange={() => toggleEntrySelection(entry.id!)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{entry.lorryNumber}</p>
                            <p className="text-sm text-gray-500">{entry.loadedDate.split('T')[0]}</p>
                            <p className="text-sm text-gray-500">{selectedUser.role == 'vendor' ? entry.rythu :entry.dealer}</p>
                            
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">{entry.totalWeight!.toLocaleString()} KGs</p>
                            <p className="text-sm text-gray-500">{entry.bags.toLocaleString()} bags</p>
                            <p className="text-sm text-gray-500">{entry.kgperBag.toLocaleString()} KGs/bag</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">₹{selectedUser.role == 'vendor' ? entry.dealerBagAmount.toLocaleString() : entry.bagAmount.toLocaleString()}/bag</p>
                            <p className="text-sm font-medium text-green-600">
                              Total: ₹{selectedUser.role == 'vendor' ? entry.dealerFinalAmount.toLocaleString() : entry.finalAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            {updatingStatus === entry.id ? (
                              <div className="flex items-center">
                                <div className="h-4 w-4 mr-2 rounded-full animate-pulse bg-gray-400"></div>
                                <span className="text-sm text-gray-500">Updating...</span>
                              </div>
                            ) : (selectedUser.role == 'vendor' ? entry.dealerPaddyStatus : entry.status) === 'completed' ? (
                              <div className="flex items-center">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  <CheckCircle className="h-4 w-4 mr-1" /> Completed
                                </span>
                                <button 
                                  onClick={() => handleStatusChange(entry.id!, 'pending')}
                                  className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Mark as Pending
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  <Clock className="h-4 w-4 mr-1" /> Pending
                                </span>
                                <button 
                                  onClick={() => handleStatusChange(entry.id!, 'completed')}
                                  className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Mark as Completed
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadPDF(entry)}
                              className="text-gray-600 hover:text-gray-900 focus:outline-none"
                              title="Download PDF"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleSharePaddyEntry(entry)}
                              className="text-emerald-600 hover:text-emerald-900 focus:outline-none"
                              title="Share on WhatsApp"
                            >
                              <Share2 className="h-5 w-5" />
                            </button>
                            {selectedUser?.role !== 'vendor' && (
                              <button
                              onClick={() => handleEditClick(entry)}
                              className="text-gray-600 hover:text-gray-900 focus:outline-none"
                              title="Edit Entry"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddPaddyModal
        isOpen={isAddPaddyModalOpen}
        onClose={() => setIsAddPaddyModalOpen(false)}
        onSuccess={handlePaddySuccess}
        userId={userId}
      />

      <EditPaddyModal
        isOpen={isEditPaddyModalOpen}
        onClose={() => {
          setIsEditPaddyModalOpen(false);
          setSelectedPaddyEntry(null);
        }}
        onSuccess={handlePaddySuccess}
        paddyEntry={selectedPaddyEntry}
      />

      <AddTransactionModal
        isOpen={isAddPayableModalOpen}
        onClose={() => setIsAddPayableModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        userId={userId}
        type="payable"
      />

      <AddTransactionModal
        isOpen={isAddReceivableModalOpen}
        onClose={() => setIsAddReceivableModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        userId={userId}
        type="receivable"
      />

      <TransactionsModal
        isOpen={isPayablesModalOpen}
        onClose={() => setIsPayablesModalOpen(false)}
        userId={userId}
        type="payable"
      />

      <TransactionsModal
        isOpen={isReceivablesModalOpen}
        onClose={() => setIsReceivablesModalOpen(false)}
        userId={userId}
        type="receivable"
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
    </div>
  );
};

export default UserDetails;