import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { promoteAllStudents } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

function ModalPromoteClass({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    if (confirmText !== 'NAIK KELAS') {
      setError('Ketik "NAIK KELAS" untuk konfirmasi');
      return;
    }
    setError('');
    setRunning(true);
    const res = await promoteAllStudents(currentUser?.uid);
    setRunning(false);
    if (res.success) {
      setResult(res);
    } else {
      setError(res.error || 'Gagal menjalankan kenaikan kelas');
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setResult(null);
    setError('');
    if (result) onSuccess?.(result.message);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="relative bg-gradient-to-br from-amber-600 via-orange-600 to-red-500 p-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
                <i className="ph-fill ph-arrow-up text-2xl text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold">Kenaikan Kelas Massal</h3>
                <p className="text-xs text-amber-50/90">Akhir tahun ajaran</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <i className="ph-fill ph-warning-octagon text-red-600 text-2xl flex-shrink-0"></i>
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-2">PERHATIAN — Aksi ini tidak bisa dibatalkan</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Semua siswa <strong>kelas 1-5</strong> akan naik kelas (+1 tingkat)</li>
                      <li>Semua siswa <strong>kelas 6</strong> akan ditandai <strong>Lulus</strong></li>
                      <li>Tagihan & riwayat pembayaran tetap aman</li>
                      <li>Jalankan SEKALI di akhir tahun ajaran (Juni-Juli)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <i className="ph-fill ph-warning-circle text-lg flex-shrink-0"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ketik <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-bold">NAIK KELAS</code> untuk mengkonfirmasi
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="NAIK KELAS"
                  disabled={running}
                  className="font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={running}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleRun}
                  disabled={running || confirmText !== 'NAIK KELAS'}
                  className="flex-[2] bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white"
                >
                  {running ? (
                    <><i className="ph ph-spinner animate-spin mr-2"></i>Memproses...</>
                  ) : (
                    <><i className="ph-fill ph-arrow-up mr-2"></i>Naikkan Sekarang</>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ph-fill ph-check-circle text-4xl text-emerald-600"></i>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Kenaikan Kelas Berhasil</h4>
                <p className="text-sm text-gray-600 mt-1">Semua siswa sudah dipromosikan</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{result.promoted}</p>
                  <p className="text-xs text-emerald-700 mt-1">Naik Kelas</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{result.graduated}</p>
                  <p className="text-xs text-blue-700 mt-1">Siswa Lulus</p>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">{result.errors.length} error:</p>
                  <ul className="list-disc list-inside space-y-0.5 max-h-20 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              >
                Selesai
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalPromoteClass;
