import { useState, useEffect } from 'react';
import { setStudentDiscount } from '../../services/firestoreService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ModalDiscount({ isOpen, student, onClose, onSaved }) {
  const [type, setType] = useState('percent');
  const [value, setValue] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      setType(student.discountType || 'percent');
      setValue(student.discountValue || 0);
      setReason(student.discountReason || '');
    }
  }, [isOpen, student]);

  const handleSave = async () => {
    setSaving(true);
    const result = await setStudentDiscount(student.id, {
      type: value > 0 ? type : null,
      value: parseInt(value) || 0,
      reason
    });
    setSaving(false);
    if (result.success) {
      onSaved?.();
      onClose();
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 p-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
                <i className="ph-fill ph-percent text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold">Atur Keringanan</h3>
                <p className="text-xs text-emerald-50/90">{student.name} • Kelas {student.class}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Jenis Keringanan</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('percent')}
                className={`p-3 rounded-lg border transition ${
                  type === 'percent'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                }`}
              >
                <i className="ph-fill ph-percent text-xl block mb-1"></i>
                <span className="text-xs font-medium">Persen (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('fixed')}
                className={`p-3 rounded-lg border transition ${
                  type === 'fixed'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                }`}
              >
                <i className="ph-fill ph-money text-xl block mb-1"></i>
                <span className="text-xs font-medium">Nominal Tetap (Rp)</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nilai Keringanan</Label>
            <div className="relative">
              {type === 'fixed' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
              )}
              <Input
                type="text"
                inputMode="numeric"
                value={value ? value.toLocaleString('id-ID') : ''}
                onChange={(e) => setValue(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                placeholder={type === 'percent' ? '50' : '25.000'}
                className={type === 'fixed' ? 'pl-10' : ''}
              />
              {type === 'percent' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {type === 'percent'
                ? 'Mis. 50 berarti diskon 50% dari tarif normal'
                : 'Nominal yang dipotong dari setiap tagihan'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Alasan / Kategori</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mis. Anak guru, Yatim, Kurang mampu"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
            <i className="ph-fill ph-info text-base flex-shrink-0"></i>
            <span>Keringanan berlaku otomatis pada tagihan yang di-generate setelah ini.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
            >
              {saving ? (
                <><i className="ph ph-spinner animate-spin mr-2"></i>Menyimpan...</>
              ) : (
                <><i className="ph-fill ph-check-circle mr-2"></i>Simpan Keringanan</>
              )}
            </Button>
          </div>

          {(student.discountType && student.discountValue > 0) && (
            <Button
              variant="outline"
              onClick={async () => {
                setSaving(true);
                await setStudentDiscount(student.id, { type: null, value: 0, reason: '' });
                setSaving(false);
                onSaved?.();
                onClose();
              }}
              disabled={saving}
              className="w-full text-red-600 hover:bg-red-50 border-red-200"
            >
              <i className="ph-fill ph-trash mr-2"></i>
              Hapus Keringanan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalDiscount;
