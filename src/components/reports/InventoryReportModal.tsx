import React, { useState, useEffect } from 'react';
import { X, Download, Filter } from 'lucide-react';
import { inventoryService } from '../../services/inventory';
import { InventoryItem } from '../../types/inventory';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InventoryReportModalProps {
  onClose: () => void;
}

export const InventoryReportModal: React.FC<InventoryReportModalProps> = ({ onClose }) => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inventoryData, categoryFilter, stockFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAllInventoryItems();
      setInventoryData(data);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inventoryData];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    if (stockFilter === 'low') {
      filtered = filtered.filter(item => (item.currentStock || 0) <= (item.minimumStock || 0));
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => (item.currentStock || 0) === 0);
    }

    setFilteredData(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Inventory Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    const totalItems = filteredData.length;
    const totalStock = filteredData.reduce((sum, d) => sum + (d.currentStock || 0), 0);
    const totalValue = filteredData.reduce((sum, d) => sum + ((d.currentStock || 0) * (d.sellingPrice || 0)), 0);
    const totalInvestment = filteredData.reduce((sum, d) => sum + (d.totalInvestment || 0), 0);

    doc.text(`Total Items: ${totalItems}`, 14, 36);
    doc.text(`Total Stock: ${totalStock} units`, 14, 42);
    doc.text(`Total Investment: ₹${totalInvestment.toLocaleString()}`, 14, 48);
    doc.text(`Total Value: ₹${totalValue.toLocaleString()}`, 14, 54);

    const tableData = filteredData.map(item => [
      item.itemName || item.name || 'N/A',
      item.category || 'N/A',
      (item.currentStock || 0).toString(),
      item.unit || 'N/A',
      (item.minimumStock || 0).toString(),
      (item.totalInvestment || 0).toLocaleString(),
      (item.sellingPrice || 0).toLocaleString(),
      item.location || 'N/A'
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Item', 'Category', 'Stock', 'Unit', 'Min Stock', 'Investment', 'Selling Price', 'Location']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [147, 51, 234] }
    });

    doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const uniqueCategories = Array.from(new Set(inventoryData.map(i => i.category)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Inventory Report</h2>
            <p className="text-sm text-gray-500 mt-1">Complete inventory status and stock levels</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
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
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-purple-900">{filteredData.length}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Stock</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {filteredData.reduce((sum, d) => sum + (d.currentStock || 0), 0)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Investment</p>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{filteredData.reduce((sum, d) => sum + (d.totalInvestment || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Low Stock Items</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {filteredData.filter(d => (d.currentStock || 0) <= (d.minimumStock || 0)).length}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName || item.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.category || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${
                            (item.currentStock || 0) === 0 ? 'text-red-600' :
                            (item.currentStock || 0) <= (item.minimumStock || 0) ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {item.currentStock || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.unit || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.minimumStock || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₹{(item.totalInvestment || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₹{(item.sellingPrice || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.location || 'N/A'}</td>
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
