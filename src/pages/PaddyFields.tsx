import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Plus, Edit2, Trash2, MapPin, Maximize2, Package } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { PaddyField } from '../types/paddyField';
import { getAllPaddyFields, createPaddyField, updatePaddyField, deletePaddyField } from '../services/paddyField';
import { AddPaddyFieldModal } from '../components/AddPaddyFieldModal';
import { EditPaddyFieldModal } from '../components/EditPaddyFieldModal';
import Alert from '../components/Alert';
import { inventoryService } from '../services/inventory';
import { InventoryAllocation, InventoryItem } from '../types/inventory';

export const PaddyFields: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [fields, setFields] = useState<PaddyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<PaddyField | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [allocations, setAllocations] = useState<Map<string, InventoryAllocation[]>>(new Map());
  const [showAllocations, setShowAllocations] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<Map<string, InventoryItem>>(new Map());

  useEffect(() => {
    loadFields();
    loadAllAllocations();
    loadInventoryItems();
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

  const loadInventoryItems = async () => {
    try {
      const items = await inventoryService.getAllItems();
      const itemsMap = new Map<string, InventoryItem>();
      items.forEach(item => {
        itemsMap.set(item.id, item);
      });
      setInventoryItems(itemsMap);
    } catch (error: any) {
      console.error('Failed to load inventory items:', error);
    }
  };

  const loadAllAllocations = async () => {
    try {
      const allAllocations = await inventoryService.getAllAllocations();
      const fieldAllocationsMap = new Map<string, InventoryAllocation[]>();

      allAllocations.forEach(allocation => {
        if (allocation.allocated_to_type === 'paddy_field') {
          const fieldId = allocation.allocated_to_id;
          if (!fieldAllocationsMap.has(fieldId)) {
            fieldAllocationsMap.set(fieldId, []);
          }
          fieldAllocationsMap.get(fieldId)!.push(allocation);
        }
      });

      setAllocations(fieldAllocationsMap);
    } catch (error: any) {
      console.error('Failed to load allocations:', error);
    }
  };

  const getFieldAllocations = (fieldId: string) => {
    return allocations.get(fieldId) || [];
  };

  const getTotalAllocationValue = (fieldId: string) => {
    const fieldAllocations = getFieldAllocations(fieldId);
    return fieldAllocations.reduce((total, allocation) => {
      return total + ((allocation.unit_price || 0) * allocation.quantity);
    }, 0);
  };

  const toggleAllocations = (fieldId: string) => {
    setShowAllocations(showAllocations === fieldId ? null : fieldId);
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

                  <div className="flex items-center text-gray-700 mb-2">
                    <Maximize2 className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-lg font-medium">{field.area} {field.unit}</span>
                  </div>

                  {getFieldAllocations(field.id).length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleAllocations(field.id)}
                        className="flex items-center text-sm text-green-600 hover:text-green-700"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        {getFieldAllocations(field.id).length} Inventory Items
                      </button>

                      {showAllocations === field.id && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="bg-green-600 text-white p-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h2 className="text-2xl font-bold mb-2">{field.fieldName}</h2>
                                  <div className="flex items-center text-green-100">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {field.location}
                                  </div>
                                  <div className="flex items-center text-green-100 mt-1">
                                    <Maximize2 className="h-4 w-4 mr-2" />
                                    {field.area} {field.unit}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setShowAllocations(null)}
                                  className="text-white hover:text-gray-200 text-2xl font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Inventory Allocations ({getFieldAllocations(field.id).length})
                              </h3>

                              <div className="space-y-3">
                                {getFieldAllocations(field.id).map((allocation) => {
                                  const inventoryItem = inventoryItems.get(allocation.inventory_item_id);
                                  const unitPrice = allocation.unit_price || inventoryItem?.unit_price || 0;
                                  const totalAmount = unitPrice * allocation.quantity;
                                  return (
                                    <div key={allocation.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                                      <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-gray-900 text-base">
                                            {allocation.item_name}
                                          </h4>
                                          <p className="text-sm text-gray-500 mt-1">
                                            Code: {allocation.item_code}
                                          </p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                          allocation.status === 'allocated'
                                            ? 'bg-blue-100 text-blue-800'
                                            : allocation.status === 'consumed'
                                            ? 'bg-gray-100 text-gray-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {allocation.status}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="bg-gray-50 p-3 rounded">
                                          <p className="text-xs text-gray-600 mb-1">Quantity</p>
                                          <p className="text-lg font-semibold text-gray-900">
                                            {allocation.quantity} units
                                          </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded">
                                          <p className="text-xs text-gray-600 mb-1">Price per Unit</p>
                                          <p className="text-lg font-semibold text-gray-900">
                                            ₹{unitPrice.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="bg-green-50 p-3 rounded mb-3">
                                        <div className="flex justify-between items-center">
                                          <p className="text-sm font-medium text-gray-700">Total Amount</p>
                                          <p className="text-xl font-bold text-green-600">
                                            ₹{totalAmount.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>

                                      {allocation.purpose && (
                                        <div className="mb-2">
                                          <p className="text-xs font-medium text-gray-700 mb-1">Purpose</p>
                                          <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                            {allocation.purpose}
                                          </p>
                                        </div>
                                      )}

                                      {allocation.notes && (
                                        <div className="mb-2">
                                          <p className="text-xs font-medium text-gray-700 mb-1">Notes</p>
                                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            {allocation.notes}
                                          </p>
                                        </div>
                                      )}

                                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                        Allocated on {new Date(allocation.allocation_date).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-6 pt-4 border-t-2 border-gray-300">
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900">
                                      Total Inventory Value:
                                    </span>
                                    <span className="text-2xl font-bold text-green-600">
                                      ₹{getFieldAllocations(field.id)
                                        .reduce((sum, a) => {
                                          const item = inventoryItems.get(a.inventory_item_id);
                                          const price = a.unit_price || item?.unit_price || 0;
                                          return sum + (price * a.quantity);
                                        }, 0)
                                        .toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                              <button
                                onClick={() => setShowAllocations(null)}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
