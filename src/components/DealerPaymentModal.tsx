import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DealerPayment } from '../types/payment';
import { paymentService } from '../services/payment';

interface DealerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dealerId: string;
  dealerName: string;
  loadingId: string;
  totalAmount: number;
  pendingAmount: number;
}

export const DealerPaymentModal: React.FC<DealerPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  dealerId,
  dealerName,
  loadingId,
  totalAmount,
  pendingAmount,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMode: 'cash',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const receivedAmount = parseFloat(formData.amount);

    if (receivedAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (receivedAmount > pendingAmount) {
      setError('Payment amount cannot exceed pending amount');
      return;
    }

    setLoading(true);

    try {
      const payment: DealerPayment = {
        dealerId,
        totalAmount,
        receivedAmount,
        balanceAmount: pendingAmount - receivedAmount,
        paymentDate: new Date().toISOString(),
        paymentMode: formData.paymentMode,
        notes: formData.notes,
      };

      await paymentService.createDealerPayment(payment);
      onSuccess();
      onClose();
      setFormData({ amount: '', paymentMode: 'cash', notes: '' });
    } catch (err) {
      setError('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Record Dealer Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Dealer: <span className="font-semibold text-gray-900">{dealerName}</span></p>
          <p className="text-sm text-gray-600">Total Receivable: <span className="font-semibold text-gray-900">₹{totalAmount.toLocaleString()}</span></p>
          <p className="text-sm text-gray-600">Pending: <span className="font-semibold text-red-600">₹{pendingAmount.toLocaleString()}</span></p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Mode
            </label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              rows={3}
              placeholder="Add any notes (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
