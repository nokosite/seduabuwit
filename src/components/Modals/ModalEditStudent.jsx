import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const ModalEditStudent = ({ isOpen, onClose, student, onSave, availableClasses = [] }) => {
  const [formData, setFormData] = useState({
    nisn: '',
    name: '',
    class: '',
    parentName: '',
    parentEmail: '',
    parentPhone: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        nisn: student.nisn || '',
        name: student.name || '',
        class: student.class || '',
        parentName: student.parentName || '',
        parentEmail: student.parentEmail || '',
        parentPhone: student.parentPhone || ''
      });
    }
  }, [student, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.nisn || !formData.name || !formData.class) {
      alert('NISN, Nama, dan Kelas harus diisi');
      return;
    }

    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white text-gray-900 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100">
                <i className="ph-fill ph-student text-2xl text-gray-700"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">Edit Data Siswa</h3>
                <p className="text-gray-500 text-sm">
                  Ubah informasi siswa dan orang tua
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
          {/* Data Siswa Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-100">
              <i className="ph-fill ph-student text-blue-600 text-xl"></i>
              <h4 className="font-bold text-gray-900">Data Siswa</h4>
            </div>

            {/* NISN */}
            <div className="space-y-2">
              <Label htmlFor="nisn" className="text-sm font-semibold text-gray-700">
                NISN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nisn"
                name="nisn"
                type="text"
                value={formData.nisn}
                onChange={handleChange}
                placeholder="Nomor Induk Siswa Nasional"
                className="h-12 border-2 focus:border-gray-400"
                required
              />
            </div>

            {/* Nama Siswa */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Nama Siswa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nama lengkap siswa"
                className="h-12 border-2 focus:border-blue-500"
                required
              />
            </div>

            {/* Kelas */}
            <div className="space-y-2">
              <Label htmlFor="class" className="text-sm font-semibold text-gray-700">
                Kelas <span className="text-red-500">*</span>
              </Label>
              <select
                id="class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-400 focus:outline-none transition h-12"
                required
              >
                <option value="">Pilih Kelas</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Orang Tua Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-green-100">
              <i className="ph-fill ph-users text-green-600 text-xl"></i>
              <h4 className="font-bold text-gray-900">Data Orang Tua</h4>
            </div>

            {/* Nama Orang Tua */}
            <div className="space-y-2">
              <Label htmlFor="parentName" className="text-sm font-semibold text-gray-700">
                Nama Orang Tua
              </Label>
              <Input
                id="parentName"
                name="parentName"
                type="text"
                value={formData.parentName}
                onChange={handleChange}
                placeholder="Nama lengkap orang tua/wali"
                className="h-12 border-2 focus:border-blue-500"
              />
            </div>

            {/* Email Orang Tua */}
            <div className="space-y-2">
              <Label htmlFor="parentEmail" className="text-sm font-semibold text-gray-700">
                Email Orang Tua
              </Label>
              <Input
                id="parentEmail"
                name="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={handleChange}
                placeholder="email@example.com"
                className="h-12 border-2 focus:border-blue-500"
              />
            </div>

            {/* No. HP Orang Tua */}
            <div className="space-y-2">
              <Label htmlFor="parentPhone" className="text-sm font-semibold text-gray-700">
                No. HP Orang Tua
              </Label>
              <Input
                id="parentPhone"
                name="parentPhone"
                type="tel"
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                className="h-12 border-2 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="ph-fill ph-info text-gray-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Informasi:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Data siswa akan diperbarui di sistem</li>
                  <li>• Perubahan kelas akan mempengaruhi tagihan berikutnya</li>
                  <li>• Email dan password orang tua bisa diubah di menu terpisah</li>
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
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditStudent;
