import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { InventoryItem, StockTransactionWithItem, UpdatePaymentStatusData } from '../types/inventory';
import { inventoryService } from '../services/inventory';
import CollectPaymentModal from './CollectPaymentModal';

interface StockHistoryModalProps {
  item: InventoryItem;
  onClose: () => void;
}

export default function StockHistoryModal({ item, onClose }: StockHistoryModalProps) {
  const [transactions, setTransactions] = useState<StockTransactionWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransactionWithItem | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [item.id]);

  const loadTransactions = async () => {
    try {
      const data = await inventoryService.getTransactionsByItem(item.id);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'removal':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'adjustment':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'text-green-600';
      case 'removal':
        return 'text-red-600';
      case 'adjustment':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'collected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Collected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Partial
          </span>
        );
      default:
        return null;
    }
  };

  const handleCollectPayment = async (paymentData: UpdatePaymentStatusData) => {
    await inventoryService.updatePaymentStatus(paymentData);
    await loadTransactions();
    setSelectedTransaction(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Stock History</h2>
            <p className="text-sm text-gray-600 mt-1">{item.item_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions found</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getTransactionIcon(transaction.transaction_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium capitalize">
                            {transaction.transaction_type}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(transaction.transaction_date)}
                          </div>
                        </div>
                        <div className={`text-right ${getTransactionColor(transaction.transaction_type)}`}>
                          <div className="font-semibold text-lg">
                            {transaction.quantity > 0 ? '+' : ''}
                            {transaction.quantity} {item.unit}
                          </div>
                        </div>
                      </div>

                      {transaction.reference_number && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Reference:</span> {transaction.reference_number}
                        </div>
                      )}

                      {transaction.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {transaction.notes}
                        </div>
                      )}

                      {transaction.transaction_type === 'removal' && transaction.total_amount > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Amount:</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  ₹{transaction.total_amount.toFixed(2)}
                                </span>
                                {getPaymentStatusBadge(transaction.payment_status)}
                              </div>
                              {transaction.payment_status === 'partial' && (
                                <div className="text-xs text-gray-600">
                                  Collected: ₹{transaction.amount_collected.toFixed(2)} |
                                  Remaining: ₹{(transaction.total_amount - transaction.amount_collected).toFixed(2)}
                                </div>
                              )}
                            </div>
                            {(transaction.payment_status === 'pending' || transaction.payment_status === 'partial') && (
                              <button
                                onClick={() => setSelectedTransaction(transaction)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                <DollarSign className="w-4 h-4" />
                                Collect
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>

      {selectedTransaction && (
        <CollectPaymentModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onSubmit={handleCollectPayment}
        />
      )}
    </div>
  );
}
