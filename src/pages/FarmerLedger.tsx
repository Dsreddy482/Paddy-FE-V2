import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Plus } from 'lucide-react';
import { Header } from '../components/Header';
import { FarmerLedger as FarmerLedgerType } from '../types/payment';
import { paymentService } from '../services/payment';
import { FarmerPaymentModal } from '../components/FarmerPaymentModal';

export const FarmerLedger: React.FC = () => {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<FarmerLedgerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLedger, setSelectedLedger] = useState<FarmerLedgerType | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAllFarmerLedgers();
      setLedgers(data);
    } catch (err) {
      setError('Failed to load farmer ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (ledger: FarmerLedgerType) => {
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
            <h1 className="text-2xl font-bold text-gray-900">Farmer Payment Ledger</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ledgers.map((ledger) => (
            <div key={ledger.farmerId} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{ledger.farmerName}</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Bags</span>
                  <span className="font-semibold text-gray-900">{ledger.totalBags}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="font-semibold text-gray-900">₹{ledger.totalAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Paid</span>
                  <span className="font-semibold text-green-600">₹{ledger.totalPaid.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium text-gray-700">Pending Balance</span>
                  <span className="font-bold text-red-600">₹{ledger.pendingBalance.toLocaleString()}</span>
                </div>
              </div>

              {ledger.pendingBalance > 0 && (
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
                          {new Date(payment.paymentDate).toLocaleDateString()}
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
            <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No farmer ledgers found</p>
          </div>
        )}
      </div>

      {selectedLedger && (
        <FarmerPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedLedger(null);
          }}
          onSuccess={handlePaymentSuccess}
          farmerId={selectedLedger.farmerId}
          farmerName={selectedLedger.farmerName}
          paddyEntryId=""
          totalAmount={selectedLedger.totalAmount}
          balanceAmount={selectedLedger.pendingBalance}
        />
      )}
    </div>
  );
};
