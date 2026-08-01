import { useState } from 'react';
import { Button } from '@/components/ui/button';

function ModalConfirmDelete({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi Hapus",
  message = "Apakah Anda yakin ingin menghapus data ini?",
  itemName = "",
  type = "danger",
  confirmText = "Hapus",
  cancelText = "Batal"
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`px-6 py-5 border-b ${
          type === 'danger' 
            ? 'bg-red-50 border-red-100' 
            : type === 'warning'
            ? 'bg-orange-50 border-orange-100'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              type === 'danger' 
                ? 'bg-red-100' 
                : type === 'warning'
                ? 'bg-orange-100'
                : 'bg-gray-100'
            }`}>
              <i className={`ph-fill ${
                type === 'warning' ? 'ph-envelope' : 'ph-warning'
              } text-2xl ${
                type === 'danger' 
                  ? 'text-red-600' 
                  : type === 'warning'
                  ? 'text-orange-600'
                  : 'text-gray-600'
              }`}></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              {itemName && (
                <p className="text-sm text-gray-600 mt-0.5">{itemName}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-gray-700 leading-relaxed">{message}</p>
          
          {type === 'danger' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <i className="ph-fill ph-info text-red-600 text-lg mt-0.5"></i>
                <p className="text-sm text-red-800">
                  <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <Button
            onClick={onClose}
            disabled={isDeleting}
            variant="outline"
            className="px-6 h-10"
          >
            <i className="ph-fill ph-x mr-2"></i>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`px-6 h-10 ${
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : type === 'warning'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {isDeleting ? (
              <>
                <i className="ph ph-spinner animate-spin mr-2"></i>
                {type === 'warning' ? 'Mengirim...' : 'Menghapus...'}
              </>
            ) : (
              <>
                <i className={`ph-fill ${type === 'warning' ? 'ph-paper-plane-tilt' : 'ph-trash'} mr-2`}></i>
                {confirmText}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmDelete;
