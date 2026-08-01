import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

import { Input } from '../ui/input';

const ModalEditKelas = ({ isOpen, onClose, kelas, onSave }) => {
  const [formData, setFormData] = useState({
    grade: '',
    isActive: true,
    customTarif: 0
  });

  useEffect(() => {
    if (kelas) {
      setFormData({
        grade: kelas.grade || '',
        isActive: kelas.isActive !== undefined ? kelas.isActive : true,
        customTarif: kelas.customTarif || 0
      });
    }
  }, [kelas, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.grade) {
      alert('Tingkat kelas harus diisi');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-white text-gray-900 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100">
                <i className="ph-fill ph-chalkboard-teacher text-2xl text-gray-700"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">Edit Kelas</h3>
                <p className="text-gray-500 text-sm">
                  Ubah pengaturan kelas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 transition"
            >
              <i className="ph-fill ph-x text-xl text-gray-700"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tingkat Kelas */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-semibold text-gray-700">
              Tingkat Kelas <span className="text-red-500">*</span>
            </Label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-400 focus:outline-none transition"
              required
            >
              <option value="">Pilih Tingkat</option>
              <option value="1">Kelas 1</option>
              <option value="2">Kelas 2</option>
              <option value="3">Kelas 3</option>
              <option value="4">Kelas 4</option>
              <option value="5">Kelas 5</option>
              <option value="6">Kelas 6</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Status Kelas
            </Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive === true}
                  onChange={() => setFormData(prev => ({ ...prev, isActive: true }))}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive === false}
                  onChange={() => setFormData(prev => ({ ...prev, isActive: false }))}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm text-gray-700">Tidak Aktif</span>
              </label>
            </div>
          </div>

          {/* Tarif Khusus per Kelas (opsional) */}
          <div className="space-y-2">
            <Label htmlFor="customTarif" className="text-sm font-semibold text-gray-700">
              Tarif Khusus untuk Kelas Ini (Opsional)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
              <Input
                id="customTarif"
                type="text"
                inputMode="numeric"
                value={formData.customTarif ? formData.customTarif.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, customTarif: raw ? parseInt(raw) : 0 }));
                }}
                placeholder="Kosongkan untuk pakai tarif default"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500">
              Mis. kelas 6 tarif lebih tinggi karena uang ujian akhir. Kosongkan untuk gunakan tarif global.
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex gap-3">
              <i className="ph-fill ph-info text-emerald-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-emerald-800">
                <p className="font-medium mb-1">Informasi:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Tingkat kelas: 1-6 (sesuai kelas SD)</li>
                  <li>• Tarif khusus berlaku saat generate tagihan berikutnya</li>
                  <li>• Tarif khusus mengganti tarif global hanya untuk kelas ini</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <i className="ph-fill ph-x text-xl mr-2"></i>
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <i className="ph-fill ph-check text-xl mr-2"></i>
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditKelas;
