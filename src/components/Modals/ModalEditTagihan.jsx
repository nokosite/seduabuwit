import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 10000000;

function ModalEditTagihan({ isOpen, payment, onClose, onSave }) {
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && payment) {
      setAmount(payment.amount || 0);

      const d = payment.dueDate?.toDate
        ? payment.dueDate.toDate()
        : payment.dueDate
        ? new Date(payment.dueDate)
        : null;

      if (d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setDueDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setDueDate('');
      }

      setError('');
    }
  }, [isOpen, payment]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || amount < MIN_AMOUNT) {
      setError(`Nominal minimal Rp ${MIN_AMOUNT.toLocaleString('id-ID')}`);
      return;
    }
    if (amount > MAX_AMOUNT) {
      setError(`Nominal terlalu besar. Maksimal Rp ${MAX_AMOUNT.toLocaleString('id-ID')}`);
      return;
    }

    setSaving(true);
    const updates = { amount };
    if (dueDate) updates.dueDate = new Date(dueDate);

    const result = await onSave(payment.id, updates);
    setSaving(false);

    if (!result?.success) {
      setError(result?.error || 'Gagal menyimpan');
    }
  };

  if (!isOpen || !payment) return null;

  const adminFee = payment.adminFee ?? 4500;
  const previewTotal = (amount || 0) + adminFee;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 p-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
                <i className="ph-fill ph-pencil-simple text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold">Edit Tagihan</h3>
                <p className="text-xs text-emerald-50/90">
                  {payment.studentName} • {payment.month}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              aria-label="Tutup"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <i className="ph-fill ph-warning-circle text-lg flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {payment.status === 'paid' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
              <i className="ph-fill ph-warning text-lg flex-shrink-0"></i>
              <span>Tagihan ini sudah <strong>Lunas</strong>. Berhati-hatilah saat mengubah nominal.</span>
            </div>
          )}

          {/* Nominal */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-700 font-medium">
              Nominal Sumbangan <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount ? amount.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmount(raw ? parseInt(raw) : 0);
                }}
                placeholder="100.000"
                className="pl-10 text-lg font-semibold"
                required
              />
            </div>
            <div className="flex gap-2">
              {[50000, 100000, 150000, 200000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`px-3 py-1 text-xs rounded-lg border transition ${
                    amount === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  Rp {(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-gray-700 font-medium">
              Jatuh Tempo
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Preview */}
          {amount > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Total Baru</p>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-700">Yang dibayar orang tua:</span>
                <span className="text-2xl font-bold text-emerald-700">{formatCurrency(previewTotal)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sumbangan {formatCurrency(amount)} + Admin {formatCurrency(adminFee)}
              </p>
            </div>
          )}

          {/* Old vs New */}
          {payment.totalAmount !== previewTotal && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 flex justify-between items-center">
              <span>Total lama: <span className="font-semibold text-gray-900">{formatCurrency(payment.totalAmount || 0)}</span></span>
              <i className="ph-fill ph-arrow-right text-gray-400"></i>
              <span>Total baru: <span className="font-semibold text-emerald-700">{formatCurrency(previewTotal)}</span></span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300"
              disabled={saving}
            >
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
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditTagihan;
