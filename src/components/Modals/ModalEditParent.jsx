import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendParentPasswordReset } from '../../services/firestoreService';

function ModalEditParent({ isOpen, onClose, student, onSave }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (student) {
      setEmail(student.parentEmail || '');
      setResetSent(false);
    }
  }, [student]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert('Email orang tua harus diisi!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Format email tidak valid!');
      return;
    }

    setIsLoading(true);
    await onSave(student.id, { parentEmail: email });
    setIsLoading(false);
  };

  const handleSendResetEmail = async () => {
    if (!email) {
      alert('Email belum diisi');
      return;
    }
    setIsLoading(true);
    const result = await sendParentPasswordReset(email);
    setIsLoading(false);
    if (result.success) {
      setResetSent(true);
    } else {
      alert('Gagal mengirim email reset: ' + result.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white text-gray-900 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="ph-fill ph-user-circle-gear text-2xl"></i>
                Edit Data Orang Tua
              </h3>
              <p className="text-sm mt-1 text-gray-500">
                {student?.name} - Kelas {student?.class}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition p-2 hover:bg-gray-100 rounded-lg"
            >
              <i className="ph-fill ph-x text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="ph-fill ph-info text-emerald-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-emerald-800">
                <p className="font-medium mb-1">Catatan Keamanan:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Password tidak disimpan di database (dikelola Firebase Auth)</li>
                  <li>Gunakan tombol "Kirim Email Reset" agar orang tua bisa membuat password baru</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentEmail" className="text-gray-700 font-medium">
              Email Orang Tua <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <i className="ph-fill ph-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <Input
                id="parentEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh: orangtua@email.com"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Email ini digunakan untuk login ke portal orang tua
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Reset Password</Label>
            <Button
              type="button"
              onClick={handleSendResetEmail}
              variant="outline"
              className="w-full"
              disabled={isLoading || !email}
            >
              <i className="ph-fill ph-paper-plane-tilt text-lg mr-2"></i>
              {resetSent ? 'Email reset terkirim' : 'Kirim Email Reset Password'}
            </Button>
            <p className="text-xs text-gray-500">
              Orang tua akan menerima email berisi tautan untuk membuat password baru
            </p>
          </div>

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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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
                  Simpan Email
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditParent;
