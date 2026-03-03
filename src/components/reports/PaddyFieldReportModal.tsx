import React, { useState, useEffect } from 'react';
import { X, Download, Filter } from 'lucide-react';
import { paddyFieldService } from '../../services/paddyField';
import { PaddyField } from '../../types/paddyField';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PaddyFieldReportModalProps {
  onClose: () => void;
}

export const PaddyFieldReportModal: React.FC<PaddyFieldReportModalProps> = ({ onClose }) => {
  const [fieldData, setFieldData] = useState<PaddyField[]>([]);
  const [filteredData, setFilteredData] = useState<PaddyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [fieldData, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await paddyFieldService.getAllPaddyFields();
      setFieldData(data);
    } catch (error) {
      console.error('Failed to fetch paddy field data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...fieldData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        field =>
          field.fieldName.toLowerCase().includes(term) ||
          field.ownerName.toLowerCase().includes(term) ||
          field.location.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(field => field.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredData(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Paddy Fields Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    const totalFields = filteredData.length;
    const totalArea = filteredData.reduce((sum, f) => sum + f.area, 0);
    const activeFields = filteredData.filter(f => f.status?.toLowerCase() === 'active').length;

    doc.text(`Total Fields: ${totalFields}`, 14, 36);
    doc.text(`Total Area: ${totalArea.toLocaleString()} acres`, 14, 42);
    doc.text(`Active Fields: ${activeFields}`, 14, 48);

    const tableData = filteredData.map(field => [
      field.fieldName,
      field.ownerName,
      field.location,
      field.area.toLocaleString(),
      field.soilType || 'N/A',
      field.status || 'N/A'
    ]);

    autoTable(doc, {
      startY: 54,
      head: [['Field Name', 'Owner', 'Location', 'Area (acres)', 'Soil Type', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 184, 166] }
    });

    doc.save(`paddy-fields-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Paddy Fields Report</h2>
            <p className="text-sm text-gray-500 mt-1">Field details, ownership, and location information</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Search & Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Fields</label>
              <input
                type="text"
                placeholder="Search by field name, owner, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-sm text-teal-600 font-medium">Total Fields</p>
                  <p className="text-2xl font-bold text-teal-900">{filteredData.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Area</p>
                  <p className="text-2xl font-bold text-green-900">
                    {filteredData.reduce((sum, f) => sum + f.area, 0).toLocaleString()} acres
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Active Fields</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {filteredData.filter(f => f.status?.toLowerCase() === 'active').length}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Soil Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((field) => (
                      <tr key={field.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{field.fieldName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{field.ownerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{field.location}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{field.area.toLocaleString()} acres</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{field.soilType || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            field.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {field.status || 'N/A'}
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
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
