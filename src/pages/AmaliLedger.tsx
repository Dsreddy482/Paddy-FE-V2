import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus } from 'lucide-react';
import { Header } from '../components/Header';
import { AmaliLedger as AmaliLedgerType } from '../types/payment';
import { paymentService } from '../services/payment';
import { AmaliPaymentRecordModal } from '../components/AmaliPaymentRecordModal';

export const AmaliLedger: React.FC = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<AmaliLedgerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLedger, setSelectedLedger] = useState<AmaliLedgerType | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAllAmaliLedgers();
      setLedgers(data);
    } catch (err) {
      setError('Failed to load amali ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (ledger: AmaliLedgerType) => {
    setSelectedLedger(ledger);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchLedgers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Amali Ledger</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ledgers.map((ledger) => (
            <div key={ledger.amaliId} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{ledger.amaliName}</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Bags Loaded</span>
                  <span className="font-semibold text-gray-900">{ledger.totalBags}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Payable</span>
                  <span className="font-semibold text-gray-900">₹{ledger.totalPayableAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Paid</span>
                  <span className="font-semibold text-green-600">₹{ledger.totalPaid.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium text-gray-700">Pending Amount</span>
                  <span className="font-bold text-red-600">₹{ledger.pendingAmount.toLocaleString()}</span>
                </div>
              </div>

              {ledger.pendingAmount > 0 && (
                <button
                  onClick={() => handleAddPayment(ledger)}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </button>
              )}

              {ledger.payments.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Payments</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ledger.payments.slice(0, 5).map((payment, idx) => (
                      <div key={payment.id || idx} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="font-medium text-green-600">
                          ₹{payment.paidAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {ledgers.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No amali ledgers found</p>
          </div>
        )}
      </div>

      {selectedLedger && (
        <AmaliPaymentRecordModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedLedger(null);
          }}
          onSuccess={handlePaymentSuccess}
          amaliId={selectedLedger.amaliId}
          amaliName={selectedLedger.amaliName}
          loadingId=""
          totalAmount={selectedLedger.totalPayableAmount}
          pendingAmount={selectedLedger.pendingAmount}
        />
      )}
    </div>
  );
};
