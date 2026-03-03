import React, { useState, useEffect } from 'react';
import { X, Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { paddyService } from '../../services/Paddy';
import { loadingService } from '../../services/loading';
import { inventoryService } from '../../services/inventory';
import { PaddyEntryDetails } from '../../types/paddy';
import { LoadingEntry } from '../../types/loading';
import { InventoryItem } from '../../types/inventory';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialReportModalProps {
  onClose: () => void;
}

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  paddyPurchases: number;
  loadingCosts: number;
  inventoryInvestment: number;
  inventoryValue: number;
}

export const FinancialReportModal: React.FC<FinancialReportModalProps> = ({ onClose }) => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    paddyPurchases: 0,
    loadingCosts: 0,
    inventoryInvestment: 0,
    inventoryValue: 0
  });
  const [paddyData, setPaddyData] = useState<PaddyEntryDetails[]>([]);
  const [loadingData, setLoadingData] = useState<LoadingEntry[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateFinancials();
  }, [paddyData, loadingData, inventoryData, startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paddy, loadingEntries, inventory] = await Promise.all([
        paddyService.getAllPaddyEntries(),
        loadingService.getAllLoadingEntries(),
        inventoryService.getAllInventoryItems()
      ]);
      setPaddyData(paddy);
      setLoadingData(loadingEntries);
      setInventoryData(inventory);
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancials = () => {
    let filteredPaddy = [...paddyData];
    let filteredLoading = [...loadingData];

    if (startDate) {
      filteredPaddy = filteredPaddy.filter(p => new Date(p.date) >= new Date(startDate));
      filteredLoading = filteredLoading.filter(l => new Date(l.date) >= new Date(startDate));
    }
    if (endDate) {
      filteredPaddy = filteredPaddy.filter(p => new Date(p.date) <= new Date(endDate));
      filteredLoading = filteredLoading.filter(l => new Date(l.date) <= new Date(endDate));
    }

    const paddyPurchases = filteredPaddy.reduce((sum, p) => sum + p.finalAmount, 0);
    const loadingCosts = filteredLoading.reduce((sum, l) => sum + l.totalCost, 0);
    const inventoryInvestment = inventoryData.reduce((sum, i) => sum + (i.totalInvestment || 0), 0);
    const inventoryValue = inventoryData.reduce((sum, i) => sum + (i.currentStock * (i.sellingPrice || 0)), 0);

    const totalExpenses = paddyPurchases + loadingCosts + inventoryInvestment;
    const totalRevenue = inventoryValue;
    const totalProfit = totalRevenue - totalExpenses;

    setFinancialData({
      totalRevenue,
      totalExpenses,
      totalProfit,
      paddyPurchases,
      loadingCosts,
      inventoryInvestment,
      inventoryValue
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Financial Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 34);
    }

    doc.setFontSize(12);
    doc.text('Summary', 14, 44);

    const summaryData = [
      ['Total Revenue', `₹${financialData.totalRevenue.toLocaleString()}`],
      ['Total Expenses', `₹${financialData.totalExpenses.toLocaleString()}`],
      ['Net Profit/Loss', `₹${financialData.totalProfit.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 48,
      head: [['Metric', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    doc.setFontSize(12);
    doc.text('Expense Breakdown', 14, (doc as any).lastAutoTable.finalY + 10);

    const expenseData = [
      ['Paddy Purchases', `₹${financialData.paddyPurchases.toLocaleString()}`],
      ['Loading & Unloading Costs', `₹${financialData.loadingCosts.toLocaleString()}`],
      ['Inventory Investment', `₹${financialData.inventoryInvestment.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [['Category', 'Amount']],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] }
    });

    doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Financial Report</h2>
            <p className="text-sm text-gray-500 mt-1">Revenue, expenses, and profit analysis</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Date Range Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading financial data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">Total Revenue</p>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    ₹{financialData.totalRevenue.toLocaleString()}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-red-700 font-semibold uppercase tracking-wide">Total Expenses</p>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-900">
                    ₹{financialData.totalExpenses.toLocaleString()}
                  </p>
                </div>

                <div className={`bg-gradient-to-br ${
                  financialData.totalProfit >= 0
                    ? 'from-blue-50 to-blue-100 border-blue-200'
                    : 'from-orange-50 to-orange-100 border-orange-200'
                } p-6 rounded-xl border-2 shadow-md`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-semibold uppercase tracking-wide ${
                      financialData.totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      Net {financialData.totalProfit >= 0 ? 'Profit' : 'Loss'}
                    </p>
                    {financialData.totalProfit >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <p className={`text-3xl font-bold ${
                    financialData.totalProfit >= 0 ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    ₹{Math.abs(financialData.totalProfit).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Paddy Purchases</p>
                      <p className="text-sm text-gray-600">{paddyData.length} transactions</p>
                    </div>
                    <p className="text-xl font-bold text-blue-900">
                      ₹{financialData.paddyPurchases.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Loading & Unloading Costs</p>
                      <p className="text-sm text-gray-600">{loadingData.length} operations</p>
                    </div>
                    <p className="text-xl font-bold text-orange-900">
                      ₹{financialData.loadingCosts.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Inventory Investment</p>
                      <p className="text-sm text-gray-600">{inventoryData.length} items</p>
                    </div>
                    <p className="text-xl font-bold text-purple-900">
                      ₹{financialData.inventoryInvestment.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-700">Inventory Value (Selling Price)</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{financialData.inventoryValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium">Profit Margin</p>
                    <p className={`text-lg font-bold ${
                      financialData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {financialData.totalExpenses > 0
                        ? ((financialData.totalProfit / financialData.totalExpenses) * 100).toFixed(2)
                        : '0.00'}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={generatePDF}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
