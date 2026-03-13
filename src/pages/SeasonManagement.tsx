import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Check, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { AddSeasonModal } from '../components/AddSeasonModal';
import { seasonService } from '../services/season';
import { Season } from '../types/season';

export const SeasonManagement: React.FC = () => {
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const data = await seasonService.getAllSeasons();
      setSeasons(data);
    } catch (err) {
      setError('Failed to load seasons');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (seasonId: string) => {
    try {
      await seasonService.setActiveSeason(seasonId);
      fetchSeasons();
    } catch (err) {
      setError('Failed to set active season');
    }
  };

  const handleDelete = async (seasonId: string) => {
    if (!confirm('Are you sure you want to delete this season? This action cannot be undone.')) {
      return;
    }

    try {
      await seasonService.deleteSeason(seasonId);
      fetchSeasons();
    } catch (err: any) {
      setError(err.message || 'Failed to delete season');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
            <h1 className="text-2xl font-bold text-gray-900">Season Management</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Season
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map((season) => (
            <div
              key={season.Id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                season.IsActive ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{season.Name}</h3>
                  <p className="text-sm text-gray-500">
                    {season.Year} - Season {season.SeasonNumber}
                  </p>
                </div>
                {season.IsActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(season.StartDate)} - {formatDate(season.EndDate)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex space-x-2">
                {!season.IsActive && (
                  <button
                    onClick={() => handleSetActive(season.Id)}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm font-medium"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => handleDelete(season.Id)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {seasons.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No seasons found. Create your first season to get started.</p>
          </div>
        )}
      </div>

      <AddSeasonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchSeasons}
      />
    </div>
  );
};
