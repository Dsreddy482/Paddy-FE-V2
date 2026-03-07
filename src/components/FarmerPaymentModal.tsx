import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FarmerPayment } from '../types/payment';
import { paymentService } from '../services/payment';

interface FarmerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farmerId: string;
  farmerName: string;
  paddyEntryId: string;
  totalAmount: number;
  balanceAmount: number;
}

export const FarmerPaymentModal: React.FC<FarmerPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  farmerId,
  farmerName,
  paddyEntryId,
  totalAmount,
  balanceAmount,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const paymentAmount = parseFloat(formData.amount);

    if (paymentAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > balanceAmount) {
      setError('Payment amount cannot exceed balance amount');
      return;
    }

    setLoading(true);

    try {
      const payment: FarmerPayment = {
        farmerId,
        paddyEntryId,
        totalAmount,
        paidAmount: paymentAmount,
        balanceAmount: balanceAmount - paymentAmount,
        paymentDate: new Date().toISOString(),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      await paymentService.createFarmerPayment(payment);
      onSuccess();
      onClose();
      setFormData({ amount: '', paymentMethod: 'cash', notes: '' });
    } catch (err) {
      setError('Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Record Farmer Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Farmer: <span className="font-semibold text-gray-900">{farmerName}</span></p>
          <p className="text-sm text-gray-600">Total Amount: <span className="font-semibold text-gray-900">₹{totalAmount.toLocaleString()}</span></p>
          <p className="text-sm text-gray-600">Balance: <span className="font-semibold text-red-600">₹{balanceAmount.toLocaleString()}</span></p>
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
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
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
