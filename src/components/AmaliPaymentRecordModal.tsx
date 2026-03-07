import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AmaliPayment } from '../types/payment';
import { paymentService } from '../services/payment';

interface AmaliPaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amaliId: string;
  amaliName: string;
  loadingId: string;
  totalAmount: number;
  pendingAmount: number;
}

export const AmaliPaymentRecordModal: React.FC<AmaliPaymentRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amaliId,
  amaliName,
  loadingId,
  totalAmount,
  pendingAmount,
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const paidAmount = parseFloat(amount);

    if (paidAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (paidAmount > pendingAmount) {
      setError('Payment amount cannot exceed pending amount');
      return;
    }

    setLoading(true);

    try {
      const payment: AmaliPayment = {
        amaliId,
        loadingId,
        totalBags: 0,
        ratePerBag: 0,
        totalAmount,
        paidAmount,
        balanceAmount: pendingAmount - paidAmount,
        paymentDate: new Date().toISOString(),
      };

      await paymentService.createAmaliPayment(payment);
      onSuccess();
      onClose();
      setAmount('');
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
          <h2 className="text-xl font-bold text-gray-900">Record Amali Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Amali: <span className="font-semibold text-gray-900">{amaliName}</span></p>
          <p className="text-sm text-gray-600">Total Payable: <span className="font-semibold text-gray-900">₹{totalAmount.toLocaleString()}</span></p>
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
              Payment Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Enter amount"
              required
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
