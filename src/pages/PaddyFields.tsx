import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Plus, Edit2, Trash2, MapPin, Maximize2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { PaddyField } from '../types/paddyField';
import { getAllPaddyFields, createPaddyField, updatePaddyField, deletePaddyField } from '../services/paddyField';
import { AddPaddyFieldModal } from '../components/AddPaddyFieldModal';
import { EditPaddyFieldModal } from '../components/EditPaddyFieldModal';
import Alert from '../components/Alert';

export const PaddyFields: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [fields, setFields] = useState<PaddyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<PaddyField | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await getAllPaddyFields();
      setFields(data);
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to load fields' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async (fieldData: any) => {
    try {
      await createPaddyField(fieldData);
      await loadFields();
      setAlert({ type: 'success', message: 'Field added successfully' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to add field' });
      throw error;
    }
  };

  const handleUpdateField = async (fieldData: PaddyField) => {
    try {
      await updatePaddyField(fieldData);
      await loadFields();
      setAlert({ type: 'success', message: 'Field updated successfully' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to update field' });
      throw error;
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this field?')) {
      return;
    }

    try {
      await deletePaddyField(id);
      await loadFields();
      setAlert({ type: 'success', message: 'Field deleted successfully' });
    } catch (error: any) {
      setAlert({ type: 'error', message: error.message || 'Failed to delete field' });
    }
  };

  const handleEditClick = (field: PaddyField) => {
    setSelectedField(field);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paddy Fields</h1>
            <p className="text-gray-600 mt-1">Manage your paddy field locations</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Field
          </button>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : fields.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fields yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first paddy field</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Field
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <div key={field.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{field.fieldName}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {field.location}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      field.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {field.status}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-700 mb-4">
                    <Maximize2 className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-lg font-medium">{field.area} {field.unit}</span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEditClick(field)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddPaddyFieldModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddField}
      />

      <EditPaddyFieldModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedField(null);
        }}
        onUpdate={handleUpdateField}
        field={selectedField}
      />
    </div>
  );
};

export default PaddyFields;
