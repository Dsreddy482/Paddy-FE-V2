import React from 'react';
import { X, Share2, Check } from 'lucide-react';
import { shareOnWhatsApp, formatPaddyEntryForWhatsApp } from '../utils/whatsapp';

interface PaddyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  paddyEntry: {
    lorryNumber: string;
    loadedDate: string;
    totalWeight: number;
    bags: number;
    kgperBag: number;
    bagAmount: number;
    finalAmount: number;
  } | null;
  rythu: {
    name: string;
    phoneNumber: string;
  } | null;
}

export const PaddyConfirmationModal: React.FC<PaddyConfirmationModalProps> = ({
  isOpen,
  onClose,
  paddyEntry,
  rythu,
}) => {
  if (!isOpen || !paddyEntry || !rythu) return null;

  const handleShare = () => {
    const message = formatPaddyEntryForWhatsApp(
      {
        lorryNumber: paddyEntry.lorryNumber,
        loadedDate: paddyEntry.loadedDate,
        totalWeight: paddyEntry.totalWeight,
        bags: paddyEntry.bags,
        kgperBag: paddyEntry.kgperBag,
        bagAmount: paddyEntry.bagAmount,
        finalAmount: paddyEntry.finalAmount,
      },
      rythu.name
    );

    const phone = rythu.phoneNumber.replace(/\D/g, '');
    shareOnWhatsApp(message, phone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium leading-6 text-gray-900">
                  Paddy Entry Added Successfully
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-green-800 mb-2">Rythu Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">{rythu.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone Number:</span>
                    <span className="text-sm font-medium text-gray-900">{rythu.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Entry Summary</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-600">Lorry:</span>
                    <p className="text-sm font-medium text-gray-900">{paddyEntry.lorryNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Bags:</span>
                    <p className="text-sm font-medium text-gray-900">{paddyEntry.bags}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Weight:</span>
                    <p className="text-sm font-medium text-gray-900">{paddyEntry.totalWeight} kg</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Total Amount:</span>
                    <p className="text-sm font-medium text-green-600">₹{paddyEntry.finalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:text-sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
