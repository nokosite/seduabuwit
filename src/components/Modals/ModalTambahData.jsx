import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { addStudent } from '../../services/firestoreService';
import { useClasses } from '../../hooks/useFirestore';

function ModalTambahData({ show, onClose, onSave }) {
  const contentRef = useRef(null);
  const { classes } = useClasses();
  const [formData, setFormData] = useState({
    nisn: '',
    name: '',
    class: '',
    parentPhone: '',
    parentName: '',
    parentEmail: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Set default class when classes load
  useEffect(() => {
    if (classes.length > 0 && !formData.class) {
      const firstActiveClass = classes.find(c => c.isActive);
      if (firstActiveClass) {
        setFormData(prev => ({ ...prev, class: String(firstActiveClass.grade) }));
      }
    }
  }, [classes, formData.class]);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      const firstActiveClass = classes.find(c => c.isActive);
      setFormData({
        nisn: '',
        name: '',
        class: firstActiveClass ? String(firstActiveClass.grade) : '',
        parentPhone: '',
        parentName: '',
        parentEmail: ''
      });
      setError('');
    }
  }, [show, classes]);

  useEffect(() => {
    if (show && contentRef.current) {
      gsap.to(contentRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: 'back.out(1.5)'
      });
    }
  }, [show]);

  const handleClose = () => {
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: onClose
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.nisn || !formData.name || !formData.parentPhone) {
      setError('NISN, Nama, dan No. WA Orang Tua harus diisi!');
      return;
    }

    setSaving(true);

    // Save to Firestore
    const result = await addStudent(formData);

    if (result.success) {
      // Close modal with animation
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            onSave(); // Trigger parent callback (show toast)
          }
        });
      }
    } else {
      setError('Gagal menyimpan data: ' + result.error);
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        ref={contentRef}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transform scale-95 opacity-0"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900">Tambah Data Siswa</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <i className="ph ph-warning-circle mr-2"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NISN / NIS *</label>
              <input
                type="text"
                name="nisn"
                value={formData.nisn}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan NISN..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama lengkap siswa..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas *</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {classes
                    .filter(c => c.isActive)
                    .sort((a, b) => a.grade - b.grade)
                    .map(kelas => (
                      <option key={kelas.id} value={String(kelas.grade)}>
                        Kelas {kelas.grade}
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. WA Orang Tua *
                </label>
                <input
                  type="text"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="08xx-xxxx-xxxx"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama orang tua/wali..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Orang Tua</label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password otomatis: <span className="font-semibold text-gray-700">password123</span>
              </p>
            </div>
          </form>

          {/* Info Card */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <i className="ph-fill ph-info text-blue-600 text-lg flex-shrink-0"></i>
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Informasi Login Orang Tua:</p>
                <ul className="space-y-0.5">
                  <li>• Email: Sesuai yang diinput</li>
                  <li>• Password: <span className="font-semibold">password123</span> (default)</li>
                  <li>• Admin bisa edit password via menu "Edit Parent"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition shadow disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <i className="ph ph-spinner animate-spin"></i>
                Menyimpan...
              </>
            ) : (
              <>
                <i className="ph ph-check"></i>
                Simpan ke Firebase
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalTambahData;
