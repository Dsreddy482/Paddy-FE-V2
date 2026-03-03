import React, { useState, useEffect } from 'react';
import { X, Download, Filter } from 'lucide-react';
import { loadingService } from '../../services/loading';
import { LoadingEntry } from '../../types/loading';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LoadingReportModalProps {
  onClose: () => void;
}

export const LoadingReportModal: React.FC<LoadingReportModalProps> = ({ onClose }) => {
  const [loadingData, setLoadingData] = useState<LoadingEntry[]>([]);
  const [filteredData, setFilteredData] = useState<LoadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [loadingData, startDate, endDate, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await loadingService.getAllLoadingEntries();
      setLoadingData(data);
    } catch (error) {
      console.error('Failed to fetch loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loadingData];

    if (startDate) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(endDate));
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.operationType === typeFilter);
    }

    setFilteredData(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Loading & Unloading Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 34);
    }

    const totalOperations = filteredData.length;
    const totalCost = filteredData.reduce((sum, d) => sum + d.totalCost, 0);
    const totalLabor = filteredData.reduce((sum, d) => sum + (d.numberOfLabourers || 0), 0);

    doc.text(`Total Operations: ${totalOperations}`, 14, 42);
    doc.text(`Total Labor Count: ${totalLabor}`, 14, 48);
    doc.text(`Total Cost: ₹${totalCost.toLocaleString()}`, 14, 54);

    const tableData = filteredData.map(item => [
      new Date(item.date).toLocaleDateString('en-IN'),
      item.operationType,
      item.vehicleNumber || 'N/A',
      (item.numberOfLabourers || 0).toString(),
      (item.costPerLabourer || 0).toLocaleString(),
      item.totalCost.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Date', 'Type', 'Vehicle', 'Laborers', 'Cost/Labor', 'Total Cost']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [251, 146, 60] }
    });

    doc.save(`loading-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Loading & Unloading Report</h2>
            <p className="text-sm text-gray-500 mt-1">Track all operations with labor and cost details</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Types</option>
                <option value="Loading">Loading</option>
                <option value="Unloading">Unloading</option>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Total Operations</p>
                  <p className="text-2xl font-bold text-orange-900">{filteredData.length}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Laborers</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {filteredData.reduce((sum, d) => sum + (d.numberOfLabourers || 0), 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Cost</p>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{filteredData.reduce((sum, d) => sum + d.totalCost, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Avg Cost/Operation</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ₹{filteredData.length > 0
                      ? Math.round(filteredData.reduce((sum, d) => sum + d.totalCost, 0) / filteredData.length).toLocaleString()
                      : '0'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laborers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/Laborer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.operationType === 'Loading'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.operationType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.vehicleNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.numberOfLabourers || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₹{(item.costPerLabourer || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.totalCost.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.notes || '-'}</td>
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
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
