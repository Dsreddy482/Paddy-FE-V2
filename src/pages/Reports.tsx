import React, { useState } from 'react';
import { FileText, Package, MapPin, DollarSign, Users, Truck, TrendingUp, BarChart3 } from 'lucide-react';
import { PaddyReportModal } from '../components/reports/PaddyReportModal';
import { InventoryReportModal } from '../components/reports/InventoryReportModal';
import { PaddyFieldReportModal } from '../components/reports/PaddyFieldReportModal';
import { FinancialReportModal } from '../components/reports/FinancialReportModal';
import { UserActivityReportModal } from '../components/reports/UserActivityReportModal';
import { LoadingReportModal } from '../components/reports/LoadingReportModal';

type ReportType = 'paddy' | 'inventory' | 'fields' | 'financial' | 'users' | 'loading' | null;

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>(null);

  const reports = [
    {
      id: 'paddy' as ReportType,
      title: 'Paddy Purchase Report',
      description: 'Detailed report of all paddy purchases, lorry details, weights, rates, and amounts',
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:border-blue-400'
    },
    {
      id: 'loading' as ReportType,
      title: 'Loading & Unloading Report',
      description: 'Track all loading and unloading operations with labor costs and timing details',
      icon: Truck,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:border-orange-400'
    },
    {
      id: 'inventory' as ReportType,
      title: 'Inventory Report',
      description: 'Complete inventory status, stock levels, investments, selling prices, and valuations',
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:border-purple-400'
    },
    {
      id: 'fields' as ReportType,
      title: 'Paddy Fields Report',
      description: 'Field information including ownership, location, area, and soil type details',
      icon: MapPin,
      color: 'teal',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      hoverColor: 'hover:border-teal-400'
    },
    {
      id: 'financial' as ReportType,
      title: 'Financial Report',
      description: 'Revenue, expenses, payments collected, outstanding amounts, and profit analysis',
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-400'
    },
    {
      id: 'users' as ReportType,
      title: 'User Activity Report',
      description: 'User transaction history, payment records, and outstanding balances',
      icon: Users,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      borderColor: 'border-pink-200',
      hoverColor: 'hover:border-pink-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-3 shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Generate comprehensive reports for all your data</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`${report.bgColor} ${report.borderColor} border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-xl ${report.hoverColor} transform hover:-translate-y-1`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`${report.iconColor} bg-white rounded-lg p-3 shadow-md`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className={`text-sm font-medium ${report.iconColor} hover:underline flex items-center`}>
                    Generate Report
                    <TrendingUp className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">PDF Export</p>
                <p className="text-sm text-gray-600">Download reports as PDF</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 rounded-lg p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Real-time Data</p>
                <p className="text-sm text-gray-600">Always up-to-date information</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-600">Visual insights and summaries</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Filters</p>
                <p className="text-sm text-gray-600">Customize report criteria</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeReport === 'paddy' && (
        <PaddyReportModal onClose={() => setActiveReport(null)} />
      )}
      {activeReport === 'inventory' && (
        <InventoryReportModal onClose={() => setActiveReport(null)} />
      )}
      {activeReport === 'fields' && (
        <PaddyFieldReportModal onClose={() => setActiveReport(null)} />
      )}
      {activeReport === 'financial' && (
        <FinancialReportModal onClose={() => setActiveReport(null)} />
      )}
      {activeReport === 'users' && (
        <UserActivityReportModal onClose={() => setActiveReport(null)} />
      )}
      {activeReport === 'loading' && (
        <LoadingReportModal onClose={() => setActiveReport(null)} />
      )}
    </div>
  );
};
