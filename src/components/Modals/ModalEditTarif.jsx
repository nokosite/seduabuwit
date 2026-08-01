import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ModalEditTarif({ isOpen, onClose, currentTarif, currentBiayaAdmin, onSave }) {
  const [tarif, setTarif] = useState(100000);
  const [biayaAdmin, setBiayaAdmin] = useState(4500);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTarif(currentTarif || 100000);
      setBiayaAdmin(currentBiayaAdmin || 4500);
      setShowConfirm(false);
    }
  }, [isOpen, currentTarif, currentBiayaAdmin]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleTarifChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setTarif(Number(value));
  };

  const handleBiayaAdminChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setBiayaAdmin(Number(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi
    if (tarif <= 0) {
      alert('Tarif sumbangan harus lebih dari 0!');
      return;
    }

    if (biayaAdmin < 0) {
      alert('Biaya admin tidak boleh negatif!');
      return;
    }

    // Show confirmation
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    await onSave(tarif, biayaAdmin);
    setIsLoading(false);
    setShowConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white text-gray-900 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="ph-fill ph-currency-circle-dollar text-2xl"></i>
                Edit Tarif Sumbangan
              </h3>
              <p className="text-sm mt-1 text-gray-500">
                Ubah nominal sumbangan bulanan
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition p-2 hover:bg-gray-100"
            >
              <i className="ph-fill ph-x text-2xl"></i>
            </button>
          </div>
        </div>

        {!showConfirm ? (
          /* Form Edit */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <i className="ph-fill ph-info text-gray-600 text-xl flex-shrink-0"></i>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Perhatian:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Perubahan tarif akan berlaku untuk tagihan baru</li>
                    <li>Tagihan yang sudah dibuat tidak akan terpengaruh</li>
                    <li>Pastikan nominal sudah benar sebelum menyimpan</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tarif Sumbangan Field */}
            <div className="space-y-2">
              <Label htmlFor="tarif" className="text-gray-700 font-medium">
                Sumbangan Bulanan <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <Input
                  id="tarif"
                  type="text"
                  value={tarif.toLocaleString('id-ID')}
                  onChange={handleTarifChange}
                  placeholder="100000"
                  className="pl-12 text-lg font-semibold"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Nominal sumbangan per siswa per bulan
              </p>
            </div>

            {/* Biaya Admin Field */}
            <div className="space-y-2">
              <Label htmlFor="biayaAdmin" className="text-gray-700 font-medium">
                Biaya Admin (Payment Gateway) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <Input
                  id="biayaAdmin"
                  type="text"
                  value={biayaAdmin.toLocaleString('id-ID')}
                  onChange={handleBiayaAdminChange}
                  placeholder="4500"
                  className="pl-12 text-lg font-semibold"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Biaya yang dikenakan oleh Duitku per transaksi
              </p>
            </div>

            {/* Preview Total */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total yang Dibayar Orang Tua</p>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {formatCurrency(tarif + biayaAdmin)}
                  </h4>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <p>Sumbangan: {formatCurrency(tarif)}</p>
                  <p>Biaya Admin: {formatCurrency(biayaAdmin)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <i className="ph-fill ph-x-circle text-lg mr-2"></i>
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                <i className="ph-fill ph-arrow-right text-lg mr-2"></i>
                Lanjutkan
              </Button>
            </div>
          </form>
        ) : (
          /* Confirmation */
          <div className="p-6 space-y-5">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <i className="ph-fill ph-warning text-gray-600 text-3xl"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Konfirmasi Perubahan Tarif
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Apakah Anda yakin ingin mengubah tarif sumbangan?
              </p>

              {/* Comparison */}
              <div className="bg-gray-50 p-4 space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tarif Lama:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(currentTarif)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tarif Baru:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(tarif)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Biaya Admin Lama:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(currentBiayaAdmin)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Biaya Admin Baru:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(biayaAdmin)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <i className="ph-fill ph-arrow-left text-lg mr-2"></i>
                Kembali
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="ph ph-spinner animate-spin text-lg mr-2"></i>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <i className="ph-fill ph-check-circle text-lg mr-2"></i>
                    Ya, Simpan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalEditTarif;
