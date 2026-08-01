import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ModalManualPayment({ isOpen, payment, onClose, onConfirm }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    method: 'CASH',
    paidAt: today,
    receivedBy: '',
    receiptNumber: '',
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({
        method: 'CASH',
        paidAt: today,
        receivedBy: '',
        receiptNumber: '',
        note: ''
      });
      setError('');
    }
  }, [isOpen, today]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.receivedBy.trim()) {
      setError('Nama penerima wajib diisi');
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
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 p-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
                <i className="ph-fill ph-money text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold">Bayar Manual (Tunai)</h3>
                <p className="text-xs text-emerald-50/90">
                  {payment.studentName} • {payment.month}
                </p>
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

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-1">Jumlah yang Diterima</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(payment.totalAmount || payment.amount || 0)}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Metode Pembayaran</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'CASH', label: 'Tunai', icon: 'ph-money' },
                { v: 'TRANSFER', label: 'Transfer', icon: 'ph-bank' },
                { v: 'OTHER', label: 'Lainnya', icon: 'ph-credit-card' }
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setForm({ ...form, method: opt.v })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition ${
                    form.method === opt.v
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                  }`}
                >
                  <i className={`ph-fill ${opt.icon} text-xl`}></i>
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAt" className="text-gray-700 font-medium">
              Tanggal Bayar <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paidAt"
              type="date"
              value={form.paidAt}
              max={today}
              onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedBy" className="text-gray-700 font-medium">
              Diterima Oleh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="receivedBy"
              type="text"
              value={form.receivedBy}
              onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
              placeholder="Nama bendahara / TU"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptNumber" className="text-gray-700 font-medium">
              No. Kuitansi (Opsional)
            </Label>
            <Input
              id="receiptNumber"
              type="text"
              value={form.receiptNumber}
              onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
              placeholder="KW-001/2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-gray-700 font-medium">
              Catatan (Opsional)
            </Label>
            <textarea
              id="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Mis. dibayar bersama bulan Februari"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
            <i className="ph-fill ph-warning text-lg flex-shrink-0"></i>
            <span>Tagihan akan langsung berstatus <strong>Lunas</strong> setelah disimpan.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1" disabled={saving}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-600/30"
            >
              {saving ? (
                <>
                  <i className="ph ph-spinner animate-spin text-lg mr-2"></i>
                  Menyimpan...
                </>
              ) : (
                <>
                  <i className="ph-fill ph-check-circle text-lg mr-2"></i>
                  Konfirmasi Pembayaran
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalManualPayment;
