import React, { useState } from 'react';
import { X, FileDown } from 'lucide-react';
import { LoadingEntryDetails } from '../types/loading';
import { AmaliTeamDetails } from '../types/amaliTeam';
import { LOADING_TYPES } from './AddPaddyAmaliModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AmaliPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedLoadings: LoadingEntryDetails[]; // kept for backward compatibility
  // new: selected amali team rows from Amali page
  selectedTeams?: AmaliTeamDetails[];
}

export const AmaliPaymentModal: React.FC<AmaliPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedLoadings: _selectedLoadings,
  selectedTeams,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getTypeLabel = (value: string) =>
    LOADING_TYPES.find(t => t.value === value)?.label ?? value;

  // Use selectedTeams mode when provided
  const isTeamsMode = selectedTeams && selectedTeams.length > 0;

  const grandTotal = isTeamsMode
    ? selectedTeams!.reduce((s, t) => s + (t.totalAmount ?? 0), 0)
    : 0;

  // Group teams by amali name for display
  const groupedByAmali = isTeamsMode
    ? selectedTeams!.reduce<Record<string, AmaliTeamDetails[]>>((acc, team) => {
        const key = team.amaliTeamName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(team);
        return acc;
      }, {})
    : {};

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Payment save logic — backend endpoint to be wired here
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to save payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!isTeamsMode) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Amali Payment Summary', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
    y += 12;

    Object.entries(groupedByAmali).forEach(([amaliName, teams]) => {
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Amali: ${amaliName}`, 14, y);
      y += 6;

      const rows = teams.map(t => [
        t.loadedDate ? new Date(t.loadedDate).toLocaleDateString() : '—',
        t.lorryNumber || '—',
        t.rythu || '—',
        getTypeLabel(t.loadingType),
        `${t.ratePerBag.toFixed(2)}`,
        `${t.totalBags ?? 0}`,
        t.totalWeight != null ? `${t.totalWeight}` : '—',
        `${(t.totalAmount ?? 0).toFixed(2)}`,
      ]);

      const subtotal = teams.reduce((s, t) => s + (t.totalAmount ?? 0), 0);

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Lorry', 'Rythu', 'Type', 'Rate/Bag', 'Bags', 'Weight', 'Total']],
        body: rows,
        foot: [['', '', '', '', '', '', 'Subtotal:', subtotal.toFixed(2)]],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: Rs. ${grandTotal.toFixed(2)}`, pageWidth - 14, y, { align: 'right' });

    const name = selectedTeams![0]?.amaliTeamName || 'Amali';
    doc.save(`${name}_Payment_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) return null;

  // Fallback: if no teams provided, show old loading-based view placeholder
  if (!isTeamsMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Calculate Amali Payment</h2>
            <button onClick={onClose}><X className="h-6 w-6 text-gray-400" /></button>
          </div>
          <p className="text-gray-500 text-sm">No amali assignments selected.</p>
          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Amali Payment Summary</h2>
            <p className="text-sm text-gray-500 mt-0.5">{selectedTeams!.length} assignment{selectedTeams!.length !== 1 ? 's' : ''} selected</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {Object.entries(groupedByAmali).map(([amaliName, teams]) => {
            const subtotal = teams.reduce((s, t) => s + (t.totalAmount ?? 0), 0);
            return (
              <div key={amaliName} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-800">{amaliName}</span>
                  <span className="text-sm text-gray-600">{teams.length} row{teams.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lorry</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rythu</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate/Bag</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bags</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {teams.map(team => (
                        <tr key={team.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-500">
                            {team.loadedDate ? new Date(team.loadedDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-2 text-gray-900">{team.lorryNumber || '—'}</td>
                          <td className="px-4 py-2 text-gray-900">{team.rythu || '—'}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {getTypeLabel(team.loadingType)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">₹{team.ratePerBag.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-gray-900">{team.totalBags ?? 0}</td>
                          <td className="px-4 py-2 text-right text-gray-900">{team.totalWeight != null ? `${team.totalWeight}` : '—'}</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">₹{(team.totalAmount ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={7} className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Subtotal:</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">₹{subtotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Grand total */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Grand Total</span>
            <span className="text-2xl font-bold text-green-700">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 text-sm"
          >
            <FileDown className="h-4 w-4" />
            Download PDF
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
