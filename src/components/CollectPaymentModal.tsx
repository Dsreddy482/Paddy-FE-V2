import { useState } from 'react';
import { X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import Input from './Input';
import type { StockTransactionWithItem, UpdatePaymentStatusData } from '../types/inventory';

interface CollectPaymentModalProps {
  transaction: StockTransactionWithItem;
  userName?: string;
  onClose: () => void;
  onSubmit: (data: UpdatePaymentStatusData) => Promise<void>;
}

export default function CollectPaymentModal({
  transaction,
  userName,
  onClose,
  onSubmit
}: CollectPaymentModalProps) {
  const [amountCollected, setAmountCollected] = useState<number>(
    transaction.payment_status === 'partial'
      ? transaction.total_amount - transaction.amount_collected
      : transaction.total_amount
  );
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalDue = transaction.total_amount;
  const alreadyCollected = transaction.amount_collected || 0;
  const remainingAmount = totalDue - alreadyCollected;
  const newTotalCollected = alreadyCollected + amountCollected;
  const isFullPayment = newTotalCollected >= totalDue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amountCollected <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amountCollected > remainingAmount) {
      setError(`Amount cannot exceed remaining balance of ₹${remainingAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const paymentData: UpdatePaymentStatusData = {
        transaction_id: transaction.id,
        payment_status: isFullPayment ? 'collected' : 'partial',
        amount_collected: newTotalCollected,
        payment_date: new Date().toISOString(),
        payment_notes: paymentNotes || undefined
      };

      await onSubmit(paymentData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">Collect Payment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Item</span>
              <span className="font-semibold text-gray-900">{transaction.item_name}</span>
            </div>
            {userName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">User</span>
                <span className="font-semibold text-gray-900">{userName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantity</span>
              <span className="font-semibold text-gray-900">{transaction.quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price per Unit</span>
              <span className="font-semibold text-gray-900">₹{transaction.amount_per_unit.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-semibold text-gray-900">₹{totalDue.toFixed(2)}</span>
            </div>
            {alreadyCollected > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Already Collected</span>
                  <span className="text-green-600 font-medium">₹{alreadyCollected.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">Remaining Balance</span>
                  <span className="font-semibold text-red-600">₹{remainingAmount.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <Input
            label="Amount to Collect (₹)"
            type="number"
            value={amountCollected}
            onChange={(e) => setAmountCollected(parseFloat(e.target.value) || 0)}
            min="0.01"
            max={remainingAmount}
            step="0.01"
            required
          />

          {amountCollected > 0 && (
            <div className={`p-4 rounded-lg border-2 ${
              isFullPayment
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className={`w-5 h-5 ${
                  isFullPayment ? 'text-green-600' : 'text-yellow-600'
                }`} />
                <span className={`font-semibold ${
                  isFullPayment ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {isFullPayment ? 'Full Payment' : 'Partial Payment'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Collecting Now</span>
                  <span className="font-medium">₹{amountCollected.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Collected After</span>
                  <span className="font-semibold">₹{newTotalCollected.toFixed(2)}</span>
                </div>
                {!isFullPayment && (
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-600">Will Remain Due</span>
                    <span className="font-medium text-red-600">
                      ₹{(totalDue - newTotalCollected).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Notes (Optional)
            </label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="e.g., Cash payment, Check #1234, UPI transaction..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || amountCollected <= 0}
              className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Collect ₹${amountCollected.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
