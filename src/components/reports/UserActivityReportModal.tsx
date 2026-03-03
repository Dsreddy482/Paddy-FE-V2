import React, { useState, useEffect } from 'react';
import { X, Download, Filter, Search } from 'lucide-react';
import { api } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserActivity {
  userId: number;
  userName: string;
  userCode: string;
  phoneNumber: string;
  totalTransactions: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

interface UserActivityReportModalProps {
  onClose: () => void;
}

export const UserActivityReportModal: React.FC<UserActivityReportModalProps> = ({ onClose }) => {
  const [userData, setUserData] = useState<UserActivity[]>([]);
  const [filteredData, setFilteredData] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'transactions' | 'amount' | 'outstanding'>('name');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [userData, searchTerm, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      const users = response.data;

      const userActivities: UserActivity[] = await Promise.all(
        users.map(async (user: any) => {
          try {
            const transactionsResponse = await api.get(`/users/${user.id}/transactions`);
            const transactions = transactionsResponse.data || [];

            const totalAmount = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
            const paidAmount = transactions.reduce((sum: number, t: any) => sum + (t.paidAmount || 0), 0);

            return {
              userId: user.id,
              userName: user.name,
              userCode: user.userCode,
              phoneNumber: user.phoneNumber || 'N/A',
              totalTransactions: transactions.length,
              totalAmount,
              paidAmount,
              outstandingAmount: totalAmount - paidAmount
            };
          } catch (error) {
            return {
              userId: user.id,
              userName: user.name,
              userCode: user.userCode,
              phoneNumber: user.phoneNumber || 'N/A',
              totalTransactions: 0,
              totalAmount: 0,
              paidAmount: 0,
              outstandingAmount: 0
            };
          }
        })
      );

      setUserData(userActivities);
    } catch (error) {
      console.error('Failed to fetch user activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...userData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.userName.toLowerCase().includes(term) ||
          user.userCode.toLowerCase().includes(term) ||
          user.phoneNumber.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.userName.localeCompare(b.userName);
        case 'transactions':
          return b.totalTransactions - a.totalTransactions;
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'outstanding':
          return b.outstandingAmount - a.outstandingAmount;
        default:
          return 0;
      }
    });

    setFilteredData(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('User Activity Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

    const totalUsers = filteredData.length;
    const activeUsers = filteredData.filter(u => u.totalTransactions > 0).length;
    const totalOutstanding = filteredData.reduce((sum, u) => sum + u.outstandingAmount, 0);

    doc.text(`Total Users: ${totalUsers}`, 14, 36);
    doc.text(`Active Users: ${activeUsers}`, 14, 42);
    doc.text(`Total Outstanding: ₹${totalOutstanding.toLocaleString()}`, 14, 48);

    const tableData = filteredData.map(user => [
      user.userName,
      user.userCode,
      user.phoneNumber,
      user.totalTransactions.toString(),
      user.totalAmount.toLocaleString(),
      user.paidAmount.toLocaleString(),
      user.outstandingAmount.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 54,
      head: [['Name', 'Code', 'Phone', 'Transactions', 'Total', 'Paid', 'Outstanding']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [236, 72, 153] }
    });

    doc.save(`user-activity-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Activity Report</h2>
            <p className="text-sm text-gray-500 mt-1">Transaction history and payment records</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Search & Sort</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="h-4 w-4 inline mr-1" />
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by name, code, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="name">Name (A-Z)</option>
                <option value="transactions">Transaction Count</option>
                <option value="amount">Total Amount</option>
                <option value="outstanding">Outstanding Amount</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading user data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-pink-50 p-4 rounded-lg">
                  <p className="text-sm text-pink-600 font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-pink-900">{filteredData.length}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Active Users</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {filteredData.filter(u => u.totalTransactions > 0).length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Paid</p>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{filteredData.reduce((sum, u) => sum + u.paidAmount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-900">
                    ₹{filteredData.reduce((sum, u) => sum + u.outstandingAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((user) => (
                      <tr key={user.userId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.userName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.userCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phoneNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {user.totalTransactions}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">₹{user.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium">₹{user.paidAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${
                            user.outstandingAmount > 0 ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            ₹{user.outstandingAmount.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={generatePDF}
            disabled={filteredData.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
