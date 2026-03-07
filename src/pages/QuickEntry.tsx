import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { paddyService } from '../services/Paddy';

export const QuickEntry: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    farmerId: '',
    dealerId: '',
    amaliId: '',
    bags: '',
    weightPerBag: '',
    farmerPricePerBag: '',
    dealerPricePerBag: '',
    lorryNumber: '',
  });

  const [farmers, setFarmers] = useState<Array<{ id: string; name: string }>>([]);
  const [dealers, setDealers] = useState<Array<{ id: string; name: string }>>([]);
  const [amaliList, setAmaliList] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const totalWeight = parseFloat(formData.bags || '0') * parseFloat(formData.weightPerBag || '0');
  const totalFarmerAmount = parseFloat(formData.bags || '0') * parseFloat(formData.farmerPricePerBag || '0');
  const totalDealerAmount = parseFloat(formData.bags || '0') * parseFloat(formData.dealerPricePerBag || '0');
  const commission = parseFloat(formData.dealerPricePerBag || '0') - parseFloat(formData.farmerPricePerBag || '0');
  const totalCommission = parseFloat(formData.bags || '0') * commission;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [farmersRes, dealersRes, amaliRes] = await Promise.all([
        api.get('/users/farmers'),
        api.get('/users/dealers'),
        api.get('/users/amali'),
      ]);
      setFarmers(farmersRes.data);
      setDealers(dealersRes.data);
      setAmaliList(amaliRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (parseFloat(formData.bags) <= 0) {
      setError('Bags must be greater than 0');
      return;
    }

    if (parseFloat(formData.weightPerBag) <= 0) {
      setError('Weight per bag must be greater than 0');
      return;
    }

    if (parseFloat(formData.farmerPricePerBag) <= 0 || parseFloat(formData.dealerPricePerBag) <= 0) {
      setError('Prices must be greater than 0');
      return;
    }

    if (commission < 0) {
      setError('Dealer price must be greater than farmer price');
      return;
    }

    setLoading(true);

    try {
      const paddyEntry = {
        lorryNumber: formData.lorryNumber,
        bags: parseFloat(formData.bags),
        kgsPerBag: parseFloat(formData.weightPerBag),
        bagAmount: parseFloat(formData.farmerPricePerBag),
        dealerBagAmount: parseFloat(formData.dealerPricePerBag),
        loadedDate: new Date().toISOString(),
        dealerId: formData.dealerId,
        rythuId: formData.farmerId,
        totalWeight: totalWeight,
        farmerPricePerBag: parseFloat(formData.farmerPricePerBag),
        commissionPerBag: commission,
        totalCommission: totalCommission,
      };

      await paddyService.createPaddyEntry(paddyEntry);
      setSuccess(true);
      setFormData({
        farmerId: '',
        dealerId: '',
        amaliId: '',
        bags: '',
        weightPerBag: '',
        farmerPricePerBag: '',
        dealerPricePerBag: '',
        lorryNumber: '',
      });

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Quick Entry</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Entry created successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Farmer *
              </label>
              <select
                value={formData.farmerId}
                onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select Farmer</option>
                {farmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dealer *
              </label>
              <select
                value={formData.dealerId}
                onChange={(e) => setFormData({ ...formData, dealerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select Dealer</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lorry Number *
              </label>
              <input
                type="text"
                value={formData.lorryNumber}
                onChange={(e) => setFormData({ ...formData, lorryNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Enter lorry number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bags *
                </label>
                <input
                  type="number"
                  value={formData.bags}
                  onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Number of bags"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight per Bag (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weightPerBag}
                  onChange={(e) => setFormData({ ...formData, weightPerBag: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="kg"
                  min="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farmer Price/Bag *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.farmerPricePerBag}
                  onChange={(e) => setFormData({ ...formData, farmerPricePerBag: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="₹"
                  min="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dealer Price/Bag *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dealerPricePerBag}
                  onChange={(e) => setFormData({ ...formData, dealerPricePerBag: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="₹"
                  min="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amali (Optional)
              </label>
              <select
                value={formData.amaliId}
                onChange={(e) => setFormData({ ...formData, amaliId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Amali</option>
                {amaliList.map((amali) => (
                  <option key={amali.id} value={amali.id}>
                    {amali.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-gray-900 mb-2">Calculated Values</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Weight:</span>
              <span className="font-semibold text-gray-900">{totalWeight.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Farmer Amount:</span>
              <span className="font-semibold text-red-600">₹{totalFarmerAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Dealer Amount:</span>
              <span className="font-semibold text-green-600">₹{totalDealerAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-medium">Commission:</span>
              <span className="font-bold text-green-600">₹{totalCommission.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
};
