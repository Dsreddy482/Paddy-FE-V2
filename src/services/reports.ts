import { api } from './api';
import { DailyLoadingReport, MonthlyReport } from '../types/report';

export const reportsService = {
  async getDailyLoadingReport(startDate: string, endDate: string): Promise<DailyLoadingReport[]> {
    const response = await api.get(`/api/Reports/daily-loading`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async getMonthlyReport(month: string, year: string): Promise<MonthlyReport> {
    const response = await api.get(`/api/Reports/monthly`, {
      params: { month, year }
    });
    return response.data;
  },

  async exportToPDF(reportData: any, reportType: string): Promise<Blob> {
    const response = await api.post('/api/Reports/export-pdf', {
      reportData,
      reportType
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportToExcel(reportData: any, reportType: string): Promise<Blob> {
    const response = await api.post('/api/Reports/export-excel', {
      reportData,
      reportType
    }, {
      responseType: 'blob'
    });
    return response.data;
  },
};
