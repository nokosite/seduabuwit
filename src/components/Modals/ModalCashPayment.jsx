import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ModalCashPayment({ isOpen, payment, studentInfo, onClose, onConfirm }) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    plannedDate: tomorrow,
    parentName: '',
    parentPhone: '',
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({
        plannedDate: tomorrow,
        parentName: '',
        parentPhone: '',
        note: ''
      });
      setError('');
    }
  }, [isOpen, tomorrow]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.parentName.trim()) {
      setError('Nama orang tua wajib diisi');
      return;
    }

    setSaving(true);
    const result = await onConfirm(payment.id, form);
    setSaving(false);

    if (!result?.success) {
      setError(result?.error || 'Gagal menyimpan');
    }
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 p-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
                <i className="ph-fill ph-money text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold">Bayar Tunai di Sekolah</h3>
                <p className="text-xs text-amber-50/90">{payment.month}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <i className="ph-fill ph-warning-circle text-lg flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Total */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1">Jumlah yang Akan Dibayar</p>
            <p className="text-2xl font-bold text-amber-700">{formatCurrency(payment.totalAmount || payment.amount || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Bawa uang pas ke sekolah pada tanggal yang Anda pilih.
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
            <i className="ph-fill ph-info text-base flex-shrink-0"></i>
            <div>
              <p className="font-semibold mb-1">Cara Pembayaran Tunai:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Datang ke sekolah pada tanggal yang Anda pilih</li>
                <li>Temui bendahara/TU sekolah</li>
                <li>Bayar tunai sesuai nominal di atas</li>
                <li>Status akan diperbarui setelah admin konfirmasi</li>
              </ol>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rencana Tanggal Bayar <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={form.plannedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Nama Orang Tua / Wali <span className="text-red-500">*</span></Label>
            <Input
              value={form.parentName}
              onChange={(e) => setForm({ ...form, parentName: e.target.value })}
              placeholder="Nama yang akan datang ke sekolah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>No. WhatsApp (Opsional)</Label>
            <Input
              type="tel"
              value={form.parentPhone}
              onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
              placeholder="0812-3456-7890"
            />
            <p className="text-xs text-gray-500">Admin bisa hubungi Anda jika ada konfirmasi</p>
          </div>

          <div className="space-y-2">
            <Label>Catatan untuk Admin (Opsional)</Label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Mis. Akan dititipkan ke wali kelas"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
            <i className="ph-fill ph-warning text-base flex-shrink-0"></i>
            <span>Status tagihan tetap <strong>Belum Lunas</strong> sampai admin sekolah konfirmasi penerimaan uang tunai.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1" disabled={saving}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-[2] bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-600/30"
            >
              {saving ? (
                <>
                  <i className="ph ph-spinner animate-spin mr-2"></i>
                  Menyimpan...
                </>
              ) : (
                <>
                  <i className="ph-fill ph-money mr-2"></i>
                  Konfirmasi Bayar Tunai
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCashPayment;
