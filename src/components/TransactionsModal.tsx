import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, Clock, CheckCircle } from 'lucide-react';
import { transactionService } from '../services/transaction';
import { Transaction } from '../types/transaction.ts';
import Alert from './Alert';

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'payable' | 'receivable';
}

export const TransactionsModal: React.FC<TransactionsModalProps> = ({
  isOpen,
  onClose,
  userId,
  type
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, userId, type]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getUserTransactions(userId, type);
      setTransactions(data);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'completed',  type: 'payable' | 'receivable') => {
    setUpdatingStatus(id);
    try {
      await transactionService.updateTransactionStatus(id, userId,status, type);
      setTransactions(prevTransactions =>
        prevTransactions.map(t =>
          t.id === id ? { ...t, status } : t
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredTransactions = dateFilter
    ? transactions.filter(t => t.date >= dateFilter)
    : transactions;

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 w-full max-w-4xl sm:align-middle mx-4 sm:mx-auto">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {type === 'payable' ? 'Payables' : 'Receivables'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="mt-1 block rounded-md border-gray-300 shadow-sm h-10 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                </div>
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="mt-6 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-green-500 border-r-transparent"></div>
              </div>
            ) : error ? (
              <Alert type="error" message={error} />
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No {type === 'payable' ? 'payables' : 'receivables'} found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.date.split('T')[0]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {updatingStatus === transaction.id ? (
                            <div className="flex items-center">
                              <div className="h-4 w-4 mr-2 rounded-full animate-pulse bg-gray-400"></div>
                              <span className="text-sm text-gray-500">Updating...</span>
                            </div>
                          ) : transaction.status === 'completed' ? (
                            <div className="flex items-center">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                <CheckCircle className="h-4 w-4 mr-1" /> Completed
                              </span>
                              <button 
                                onClick={() => handleStatusChange(transaction.id, 'pending', type)}
                                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                              >
                                Mark as Pending
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                <Clock className="h-4 w-4 mr-1" /> Pending
                              </span>
                              <button 
                                onClick={() => handleStatusChange(transaction.id, 'completed', type)}
                                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                              >
                                Mark as Completed
                              </button>
                            </div>
                          )}
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => {}}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none"
                          >
                            <Calendar className="h-5 w-5" />
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};