import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import { Header } from '../components/Header';
import { reportsService } from '../services/reports';
import { DailyLoadingReport, MonthlyReport } from '../types/report';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const SmartReports: React.FC = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [dailyReports, setDailyReports] = useState<DailyLoadingReport[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setError('');
    setLoading(true);

    try {
      if (reportType === 'daily') {
        if (!startDate || !endDate) {
          setError('Please select both start and end dates');
          return;
        }
        const data = await reportsService.getDailyLoadingReport(startDate, endDate);
        setDailyReports(data);
        setMonthlyReport(null);
      } else {
        if (!month || !year) {
          setError('Please select both month and year');
          return;
        }
        const data = await reportsService.getMonthlyReport(month, year);
        setMonthlyReport(data);
        setDailyReports([]);
      }
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    if (reportType === 'daily' && dailyReports.length > 0) {
      doc.setFontSize(16);
      doc.text('Daily Loading Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Period: ${startDate} to ${endDate}`, 14, 22);

      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Lorry', 'Dealer', 'Farmer', 'Bags', 'Weight', 'Farmer Amt', 'Dealer Amt', 'Commission']],
        body: dailyReports.map(r => [
          new Date(r.date).toLocaleDateString(),
          r.lorryNumber,
          r.dealer,
          r.farmer,
          r.bags,
          `${r.weight} kg`,
          `₹${r.farmerAmount}`,
          `₹${r.dealerAmount}`,
          `₹${r.commission}`
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
      });

      const totalBags = dailyReports.reduce((sum, r) => sum + r.bags, 0);
      const totalWeight = dailyReports.reduce((sum, r) => sum + r.weight, 0);
      const totalFarmerAmount = dailyReports.reduce((sum, r) => sum + r.farmerAmount, 0);
      const totalDealerAmount = dailyReports.reduce((sum, r) => sum + r.dealerAmount, 0);
      const totalCommission = dailyReports.reduce((sum, r) => sum + r.commission, 0);

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Total Bags: ${totalBags}`, 14, finalY);
      doc.text(`Total Weight: ${totalWeight} kg`, 14, finalY + 7);
      doc.text(`Total Farmer Payment: ₹${totalFarmerAmount.toLocaleString()}`, 14, finalY + 14);
      doc.text(`Total Dealer Collection: ₹${totalDealerAmount.toLocaleString()}`, 14, finalY + 21);
      doc.text(`Total Commission: ₹${totalCommission.toLocaleString()}`, 14, finalY + 28);

      doc.save(`daily-report-${startDate}-to-${endDate}.pdf`);
    } else if (reportType === 'monthly' && monthlyReport) {
      doc.setFontSize(16);
      doc.text('Monthly Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Period: ${month} ${year}`, 14, 22);

      autoTable(doc, {
        startY: 30,
        head: [['Metric', 'Value']],
        body: [
          ['Total Bags', monthlyReport.totalBags.toString()],
          ['Total Weight', `${monthlyReport.totalWeight} kg`],
          ['Total Farmer Payment', `₹${monthlyReport.totalFarmerPayment.toLocaleString()}`],
          ['Total Dealer Collection', `₹${monthlyReport.totalDealerCollection.toLocaleString()}`],
          ['Total Commission', `₹${monthlyReport.totalCommission.toLocaleString()}`],
          ['Total Amali Payment', `₹${monthlyReport.totalAmaliPayment.toLocaleString()}`],
          ['Net Profit', `₹${monthlyReport.netProfit.toLocaleString()}`],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94] },
      });

      doc.save(`monthly-report-${month}-${year}.pdf`);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Smart Reports</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'daily' | 'monthly')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="daily">Daily Loading Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div>
          </div>

          {reportType === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Month</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="2024"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              <FileText className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>

            {((dailyReports.length > 0) || monthlyReport) && (
              <button
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {dailyReports.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Daily Loading Report</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lorry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bags</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer Amt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer Amt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyReports.map((report, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.lorryNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.dealer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.farmer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.bags}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.weight} kg</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{report.farmerAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{report.dealerAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">₹{report.commission.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {monthlyReport && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total Bags</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyReport.totalBags}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total Weight</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyReport.totalWeight} kg</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Farmer Payment</p>
                <p className="text-2xl font-bold text-red-600">₹{monthlyReport.totalFarmerPayment.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Dealer Collection</p>
                <p className="text-2xl font-bold text-green-600">₹{monthlyReport.totalDealerCollection.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-green-600">₹{monthlyReport.totalCommission.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-green-600">₹{monthlyReport.netProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
