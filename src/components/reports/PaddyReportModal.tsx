import React, { useState, useEffect } from 'react';
import { X, Download, Filter } from 'lucide-react';
import { paddyService } from '../../services/Paddy';
import { PaddyEntryDetails } from '../../types/paddy';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PaddyReportModalProps {
  onClose: () => void;
}

export const PaddyReportModal: React.FC<PaddyReportModalProps> = ({ onClose }) => {
  const [paddyData, setPaddyData] = useState<PaddyEntryDetails[]>([]);
  const [filteredData, setFilteredData] = useState<PaddyEntryDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dealerFilter, setDealerFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [paddyData, startDate, endDate, statusFilter, dealerFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await paddyService.getAllPaddyEntries();
      setPaddyData(data);
    } catch (error) {
      console.error('Failed to fetch paddy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...paddyData];

    if (startDate) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(endDate));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (dealerFilter !== 'all') {
      filtered = filtered.filter(item => item.dealer === dealerFilter);
    }

    setFilteredData(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Paddy Purchase Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 34);
    }

    const uniqueLorries = new Set(filteredData.map(d => d.lorryNumber)).size;
    const totalAmount = filteredData.reduce((sum, d) => sum + d.finalAmount, 0);
    const totalWeight = filteredData.reduce((sum, d) => sum + d.netWeight, 0);

    doc.setFontSize(10);
    doc.text(`Total Unique Lorries: ${uniqueLorries}`, 14, 42);
    doc.text(`Total Weight: ${totalWeight.toLocaleString()} kg`, 14, 48);
    doc.text(`Total Amount: ₹${totalAmount.toLocaleString()}`, 14, 54);

    const tableData = filteredData.map(item => [
      new Date(item.date).toLocaleDateString('en-IN'),
      item.lorryNumber,
      item.dealer,
      item.variety,
      item.netWeight.toLocaleString(),
      item.rate.toLocaleString(),
      item.finalAmount.toLocaleString(),
      item.status
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Date', 'Lorry No.', 'Dealer', 'Variety', 'Weight (kg)', 'Rate', 'Amount', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`paddy-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const uniqueDealers = Array.from(new Set(paddyData.map(p => p.dealer)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Paddy Purchase Report</h2>
            <p className="text-sm text-gray-500 mt-1">Generate detailed paddy purchase reports</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dealer
              </label>
              <select
                value={dealerFilter}
                onChange={(e) => setDealerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dealers</option>
                {uniqueDealers.map(dealer => (
                  <option key={dealer} value={dealer}>{dealer}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Unique Lorries</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {new Set(filteredData.map(d => d.lorryNumber)).size}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Weight</p>
                  <p className="text-2xl font-bold text-green-900">
                    {filteredData.reduce((sum, d) => sum + d.netWeight, 0).toLocaleString()} kg
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ₹{filteredData.reduce((sum, d) => sum + d.finalAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lorry No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variety</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.lorryNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.dealer}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.variety}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.netWeight.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₹{item.rate.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₹{item.finalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status.toLowerCase() === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            disabled={filteredData.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
