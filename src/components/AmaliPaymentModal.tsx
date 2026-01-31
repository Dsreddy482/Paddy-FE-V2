import React, { useState, useEffect } from 'react';
import { X, FileDown } from 'lucide-react';
import { LoadingEntryDetails } from '../types/loading';
import { PaddyEntryDetails } from '../types/paddy';
import { paddyService } from '../services/Paddy';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LoadingWithPaddy {
  loading: LoadingEntryDetails;
  paddyEntries: PaddyEntryDetails[];
}

interface PaddyAmountEntry {
  paddyId: string;
  amountPerBag: number;
}

interface AmaliPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedLoadings: LoadingEntryDetails[];
}

export const AmaliPaymentModal: React.FC<AmaliPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedLoadings,
}) => {
  const [loadingsWithPaddy, setLoadingsWithPaddy] = useState<LoadingWithPaddy[]>([]);
  const [amounts, setAmounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && selectedLoadings.length > 0) {
      fetchPaddyDetails();
    }
  }, [isOpen, selectedLoadings]);

  const fetchPaddyDetails = async () => {
    try {
      setLoading(true);
      const loadingsData: LoadingWithPaddy[] = [];

      for (const loading of selectedLoadings) {
        const paddyEntries = await paddyService.getPaddyByLoadingId(loading.id.toString());
        loadingsData.push({
          loading,
          paddyEntries,
        });
      }

      loadingsData.sort((a, b) => a.loading.id - b.loading.id);

      setLoadingsWithPaddy(loadingsData);

      const initialAmounts = new Map<string, number>();
      loadingsData.forEach(({ paddyEntries }) => {
        paddyEntries.forEach((paddy) => {
          if (paddy.id) {
            initialAmounts.set(paddy.id, 0);
          }
        });
      });
      setAmounts(initialAmounts);
    } catch (err) {
      console.error('Failed to fetch paddy details:', err);
      setError('Failed to load paddy details');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (paddyId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAmounts(prev => new Map(prev).set(paddyId, numValue));
  };

  const calculatePaddyTotal = (paddy: PaddyEntryDetails): number => {
    const amountPerBag = amounts.get(paddy.id || '') || 0;
    return paddy.bags * amountPerBag;
  };

  const calculateLoadingTotal = (paddyEntries: PaddyEntryDetails[]): number => {
    return paddyEntries.reduce((sum, paddy) => sum + calculatePaddyTotal(paddy), 0);
  };

  const calculateGrandTotal = (): number => {
    return loadingsWithPaddy.reduce(
      (sum, { paddyEntries }) => sum + calculateLoadingTotal(paddyEntries),
      0
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      for (const { paddyEntries } of loadingsWithPaddy) {
        for (const paddy of paddyEntries) {
          if (paddy.id) {
            const newAmount = amounts.get(paddy.id) || 0;
            if (newAmount !== paddy.bagAmount) {
              await paddyService.updatePaddyEntry(paddy.id, {
                ...paddy,
                bagAmount: newAmount,
                kgsPerBag: paddy.kgperBag,
              });
            }
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save amounts:', err);
      setError('Failed to save payment amounts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Amali Payment Details', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;

    loadingsWithPaddy.forEach(({ loading, paddyEntries }, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Loading #${loading.id}`, 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Lorry Number: ${loading.lorryNumber}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Date: ${new Date(loading.loadedDate).toLocaleDateString()}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Amali: ${loading.amaliName}`, 14, yPosition);
      yPosition += 8;

      if (paddyEntries.length > 0) {
        const tableData = paddyEntries.map((paddy) => {
          const amountPerBag = amounts.get(paddy.id || '') || 0;
          const total = paddy.bags * amountPerBag;
          return [
            paddy.loadType || 'potha',
            paddy.rythu,
            paddy.bags.toString(),
            amountPerBag.toFixed(2),
            total.toFixed(2)
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Load Type', 'Rythu', 'Bags', 'Amount/Bag', 'Total']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 50 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
          },
          foot: [[
            '', '', '', 'Subtotal:',
            calculateLoadingTotal(paddyEntries).toFixed(2)
          ]],
          footStyles: { fillColor: [243, 244, 246], textColor: 0, fontStyle: 'bold' }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(128);
        doc.text('No paddy entries found', 14, yPosition);
        yPosition += 10;
      }
    });

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Grand Total:', pageWidth - 80, yPosition);
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text(calculateGrandTotal().toFixed(2), pageWidth - 14, yPosition, { align: 'right' });

    const amaliName = selectedLoadings[0]?.amaliName || 'Amali';
    const fileName = `${amaliName}_Payment_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Calculate Amali Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {loadingsWithPaddy.map(({ loading, paddyEntries }, index) => (
                <div key={loading.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Loading ID:</span>
                        <span className="ml-2 text-base font-semibold text-gray-900">#{loading.id}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Lorry Number:</span>
                        <span className="ml-2 text-base font-semibold text-gray-900">{loading.lorryNumber}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span> {new Date(loading.loadedDate).toLocaleDateString()}
                    </div>
                  </div>

                  {paddyEntries.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No paddy entries found</p>
                  ) : (
                    <div className="bg-white rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Load Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Rythu
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Bags
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Amount/Bag (₹)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Total (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paddyEntries.map((paddy) => (
                            <tr key={paddy.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {paddy.loadType || 'potha'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {paddy.rythu}
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                {paddy.bags}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={amounts.get(paddy.id || '') || 0}
                                  onChange={(e) => handleAmountChange(paddy.id || '', e.target.value)}
                                  className="w-28 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-green-500 focus:border-green-500"
                                  placeholder="0"
                                  step="0.01"
                                  min="0"
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                ₹{calculatePaddyTotal(paddy).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                              Subtotal for Loading #{loading.id}:
                            </td>
                            <td className="px-4 py-3 text-right text-base font-bold text-gray-900">
                              ₹{calculateLoadingTotal(paddyEntries).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t-2 border-gray-300 pt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Grand Total:</span>
                    <span className="text-3xl font-bold text-green-700">
                      ₹{calculateGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleGeneratePDF}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="h-4 w-4" />
            Generate PDF
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
