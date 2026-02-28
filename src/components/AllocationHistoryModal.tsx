import { useState, useEffect } from 'react';
import { X, User, MapPin, Package, Calendar } from 'lucide-react';
import type { InventoryItem, InventoryAllocation } from '../types/inventory';
import { inventoryService } from '../services/inventory';

interface AllocationHistoryModalProps {
  item: InventoryItem;
  onClose: () => void;
}

export default function AllocationHistoryModal({ item, onClose }: AllocationHistoryModalProps) {
  const [allocations, setAllocations] = useState<InventoryAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllocations();
  }, [item.id]);

  const loadAllocations = async () => {
    try {
      const data = await inventoryService.getAllocationsByItem(item.id);
      setAllocations(data);
    } catch (error) {
      console.error('Failed to load allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allocated':
        return 'bg-blue-100 text-blue-800';
      case 'consumed':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Allocation History</h2>
            <p className="text-sm text-gray-600 mt-1">{item.item_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading allocations...</div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No allocations found</div>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {allocation.allocated_to_type === 'user' ? (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {allocation.allocated_to_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {allocation.allocated_to_type === 'user' ? 'User' : 'Paddy Field'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg text-blue-600">
                            {allocation.quantity} {item.unit}
                          </div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(allocation.status)}`}>
                            {allocation.status}
                          </span>
                        </div>
                      </div>

                      {allocation.purpose && (
                        <div className="mb-2 text-sm">
                          <span className="font-medium text-gray-700">Purpose:</span>{' '}
                          <span className="text-gray-600">{allocation.purpose}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(allocation.allocation_date)}
                        </div>
                      </div>

                      {allocation.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {allocation.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
