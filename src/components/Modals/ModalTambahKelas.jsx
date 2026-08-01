import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

const ModalTambahKelas = ({ isOpen, onClose, onSave, existingGrades = [] }) => {
  const [formData, setFormData] = useState({
    grade: '',
    isActive: true
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        grade: '',
        isActive: true
      });
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.grade) {
      alert('Tingkat kelas harus diisi');
      return;
    }

    // Check if grade already exists
    if (existingGrades.includes(parseInt(formData.grade))) {
      alert(`Kelas ${formData.grade} sudah ada!`);
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  // Available grades (1-6) minus existing ones
  const availableGrades = [1, 2, 3, 4, 5, 6].filter(g => !existingGrades.includes(g));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-white text-gray-900 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100">
                <i className="ph-fill ph-plus-circle text-2xl text-gray-700"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">Tambah Kelas Baru</h3>
                <p className="text-gray-500 text-sm">
                  Tambahkan tingkat kelas baru
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
          {availableGrades.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <i className="ph-fill ph-warning text-gray-600 text-xl flex-shrink-0"></i>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Semua kelas sudah ada!</p>
                  <p className="text-xs">
                    Kelas 1 sampai 6 sudah terdaftar di sistem. Anda bisa mengedit atau menghapus kelas yang ada.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                  {availableGrades.map(grade => (
                    <option key={grade} value={grade}>Kelas {grade}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Hanya kelas yang belum terdaftar yang ditampilkan
                </p>
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

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <i className="ph-fill ph-info text-gray-600 text-xl flex-shrink-0"></i>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Informasi:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Tingkat kelas: 1-6 (sesuai kelas SD)</li>
                      <li>• Status aktif: kelas sedang berjalan tahun ini</li>
                      <li>• Kelas yang sudah ada tidak bisa ditambahkan lagi</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <i className="ph-fill ph-x text-xl mr-2"></i>
              {availableGrades.length === 0 ? 'Tutup' : 'Batal'}
            </Button>
            {availableGrades.length > 0 && (
              <Button
                type="submit"
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <i className="ph-fill ph-plus text-xl mr-2"></i>
                Tambah
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalTambahKelas;
