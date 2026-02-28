import { useState } from 'react';
import { X, Plus, Minus, RefreshCw } from 'lucide-react';
import Input from './Input';
import type { InventoryItem, CreateStockTransactionData } from '../types/inventory';

interface StockTransactionModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSubmit: (data: CreateStockTransactionData, newStock?: number) => Promise<void>;
}

export default function StockTransactionModal({ item, onClose, onSubmit }: StockTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<'addition' | 'removal' | 'adjustment'>('addition');
  const [quantity, setQuantity] = useState<number>(0);
  const [newStock, setNewStock] = useState<number>(item.current_stock);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculatedStock = transactionType === 'addition'
    ? item.current_stock + quantity
    : transactionType === 'removal'
    ? Math.max(0, item.current_stock - quantity)
    : newStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (transactionType !== 'adjustment' && quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (transactionType === 'adjustment' && newStock < 0) {
      setError('Stock cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const transactionData: CreateStockTransactionData = {
        inventory_item_id: item.id,
        transaction_type: transactionType,
        quantity: transactionType === 'adjustment' ? (newStock - item.current_stock) : quantity,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined
      };

      await onSubmit(transactionData, transactionType === 'adjustment' ? newStock : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Stock Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Item</div>
            <div className="font-semibold text-gray-900">{item.item_name}</div>
            <div className="text-sm text-gray-600 mt-2">Current Stock: <span className="font-semibold text-gray-900">{item.current_stock} {item.unit}</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTransactionType('addition')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  transactionType === 'addition'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('removal')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  transactionType === 'removal'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Minus className="w-5 h-5" />
                Remove
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('adjustment')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  transactionType === 'adjustment'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                Adjust
              </button>
            </div>
          </div>

          {transactionType === 'adjustment' ? (
            <Input
              label={`New Stock (${item.unit})`}
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              required
            />
          ) : (
            <Input
              label={`Quantity (${item.unit})`}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              required
            />
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">New Stock Level</div>
            <div className={`text-2xl font-bold ${
              calculatedStock < item.minimum_stock ? 'text-red-600' : 'text-green-600'
            }`}>
              {calculatedStock.toFixed(2)} {item.unit}
            </div>
            {calculatedStock < item.minimum_stock && (
              <div className="text-xs text-red-600 mt-1">Below minimum stock level</div>
            )}
          </div>

          <Input
            label="Reference Number (Optional)"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g., PO-123, INV-456"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any notes about this transaction..."
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
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
