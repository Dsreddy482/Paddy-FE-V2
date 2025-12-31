import React, { useState, useEffect } from 'react';
import { TrendingUp, Truck, IndianRupee, Clock } from 'lucide-react';
import { paddyService } from '../services/paddy';
import { PaddyEntryDetails } from '../types/paddy';
import { Header } from '../components/Header';

export const Dashboard: React.FC = () => {
  const [paddyStats, setPaddyStats] = useState<{
    totalLorries: number;
    completedLorries: number;
    pendingLorries: number;
    totalAmount: number;
    pendingAmount: number;
    receivedAmount: number;
    vendorStats: Array<{
      name: string;
      totalLorries: number;
      amount: number;
    }>;
  }>({
    totalLorries: 0,
    completedLorries: 0,
    pendingLorries: 0,
    totalAmount: 0,
    pendingAmount: 0,
    receivedAmount: 0,
    vendorStats: []
  });

  useEffect(() => {
    const fetchPaddyStats = async () => {
      try {
        const entries = await paddyService.getAllPaddyEntries();
        calculateStats(entries);
      } catch (error) {
        console.error('Failed to fetch paddy statistics:', error);
      }
    };

    fetchPaddyStats();
  }, []);

  const calculateStats = (entries: PaddyEntryDetails[]) => {
    // Get unique lorry numbers
    const uniqueLorryNumbers = new Set(entries.map(e => e.lorryNumber));
    const completedLorryNumbers = new Set(
      entries
        .filter(e => e.status.toLowerCase() === 'completed')
        .map(e => e.lorryNumber)
    );
    const pendingLorryNumbers = new Set(
      entries
        .filter(e => e.status.toLowerCase() === 'pending')
        .map(e => e.lorryNumber)
    );

    // Calculate vendor stats with unique lorry numbers
    const vendorStatsMap = entries.reduce((acc: { [key: string]: { name: string; lorryNumbers: Set<string>; amount: number } }, entry) => {
      if (!acc[entry.dealer]) {
        acc[entry.dealer] = {
          name: entry.dealer,
          lorryNumbers: new Set(),
          amount: 0
        };
      }
      acc[entry.dealer].lorryNumbers.add(entry.lorryNumber);
      acc[entry.dealer].amount += entry.finalAmount;
      return acc;
    }, {});

    const stats = {
      totalLorries: uniqueLorryNumbers.size,
      completedLorries: completedLorryNumbers.size,
      pendingLorries: pendingLorryNumbers.size,
      totalAmount: entries.reduce((sum, e) => sum + e.finalAmount, 0),
      pendingAmount: entries
        .filter(e => e.status.toLowerCase() === 'pending')
        .reduce((sum, e) => sum + e.finalAmount, 0),
      receivedAmount: entries
        .filter(e => e.status.toLowerCase() === 'completed')
        .reduce((sum, e) => sum + e.finalAmount, 0),
      vendorStats: Object.values(vendorStatsMap).map(vendor => ({
        name: vendor.name,
        totalLorries: vendor.lorryNumbers.size,
        amount: vendor.amount
      }))
    };

    setPaddyStats(stats);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Unique Lorries</p>
                  <p className="text-2xl font-bold text-gray-900">{paddyStats.totalLorries}</p>
                </div>
                <Truck className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-green-600">{paddyStats.completedLorries} Completed</span>
                <span className="text-yellow-600">{paddyStats.pendingLorries} Pending</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{paddyStats.totalAmount.toLocaleString()}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-green-600">₹{paddyStats.receivedAmount.toLocaleString()} Received</span>
                <span className="text-yellow-600">₹{paddyStats.pendingAmount.toLocaleString()} Pending</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((paddyStats.completedLorries / paddyStats.totalLorries) * 100).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(paddyStats.completedLorries / paddyStats.totalLorries) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((paddyStats.receivedAmount / paddyStats.totalAmount) * 100).toFixed(1)}%
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(paddyStats.receivedAmount / paddyStats.totalAmount) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vendor Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Lorries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paddyStats.vendorStats.map((vendor, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vendor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vendor.totalLorries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{vendor.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};