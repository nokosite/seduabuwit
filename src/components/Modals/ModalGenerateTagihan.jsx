import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { generateMonthlyPayments } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function ModalGenerateTagihan({ show, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    amount: 100000
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const months = MONTHS;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

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

  const MIN_AMOUNT = 1000;
  const MAX_AMOUNT = 10000000; // 10 juta — cukup untuk semua Sumbangan Sukarela wajar

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || formData.amount < MIN_AMOUNT) {
      setError(`Nominal minimal Rp ${MIN_AMOUNT.toLocaleString('id-ID')}`);
      return;
    }
    if (formData.amount > MAX_AMOUNT) {
      setError(`Nominal terlalu besar. Maksimal Rp ${MAX_AMOUNT.toLocaleString('id-ID')}`);
      return;
    }

    setGenerating(true);

    const result = await generateMonthlyPayments(
      formData.month,
      formData.year,
      formData.amount,
      currentUser.uid
    );

    if (result.success) {
      // Build pesan ringkasan termasuk status email
      let finalMessage = result.message;
      const e = result.emailStatus;
      if (e) {
        const parts = [];
        if (e.sent > 0) parts.push(`✓ ${e.sent} email terkirim`);
        if (e.failed > 0) parts.push(`✗ ${e.failed} email gagal`);
        if (e.skipped > 0) parts.push(`${e.skipped} siswa tanpa email`);
        if (e.error) parts.push(`⚠️ Email API: ${e.error}`);

        if (parts.length > 0) {
          finalMessage += `. ${parts.join(' · ')}`;
        }

        // Kalau ada email gagal, tampilkan detail di alert (lebih jelas dari toast)
        if (e.failed > 0 && e.failedEmails && e.failedEmails.length > 0) {
          const detail = e.failedEmails
            .slice(0, 5)
            .map((f) => `• ${f.studentName} (${f.email || '-'}): ${f.reason}`)
            .join('\n');
          const more = e.failedEmails.length > 5 ? `\n...dan ${e.failedEmails.length - 5} lainnya` : '';
          setTimeout(() => {
            alert(`Email gagal terkirim ke ${e.failed} orang tua:\n\n${detail}${more}\n\nTip: Tanpa domain terverifikasi di Resend, email hanya bisa dikirim ke alamat akun Resend Anda.`);
          }, 600);
        }
      }

      if (contentRef.current) {
        gsap.to(contentRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            onSuccess(finalMessage);
          }
        });
      }
    } else {
      setError(result.error);
      setGenerating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' || name === 'year' ? parseInt(value) || 0 : value
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        ref={contentRef}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transform scale-95 opacity-0"
      >
        <div className="bg-white p-6 text-gray-900 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xl">Generate Tagihan Masal</h3>
              <p className="text-gray-500 text-sm mt-1">Buat tagihan untuk semua siswa aktif</p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
              <i className="ph ph-x text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-gray-50 border border-gray-200 text-gray-700 text-sm">
              <i className="ph ph-warning-circle mr-2"></i>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bulan *
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tahun *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nominal Sumbangan per Siswa *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                name="amount"
                value={formData.amount ? formData.amount.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, amount: raw ? parseInt(raw) : 0 });
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                placeholder="100.000"
                required
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Biaya admin Duitku otomatis ditambahkan
              </p>
              <p className="text-xs font-medium text-emerald-700">
                Maks Rp {MAX_AMOUNT.toLocaleString('id-ID')}
              </p>
            </div>
            {/* Quick presets */}
            <div className="flex gap-2 mt-2">
              {[50000, 100000, 150000, 200000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: preset })}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    formData.amount === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  Rp {(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Preview Total */}
          {formData.amount > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Preview</p>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-700">Total yang akan dibayar orang tua:</span>
                <span className="text-2xl font-bold text-emerald-700">
                  Rp {(formData.amount + 4500).toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Nominal Rp {formData.amount.toLocaleString('id-ID')} + Biaya admin Rp 4.500
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-4 border border-gray-200">
            <div className="flex gap-3">
              <i className="ph ph-info text-blue-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informasi:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Tagihan akan dibuat untuk semua siswa dengan status aktif</li>
                  <li>Jatuh tempo otomatis: tanggal 10 di bulan yang dipilih</li>
                  <li>Status awal: Belum Bayar (Pending)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border border-gray-200">
            <div className="flex gap-3">
              <i className="ph ph-warning text-yellow-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Peringatan:</p>
                <p className="text-xs mt-1">
                  Pastikan bulan dan tahun yang dipilih belum pernah dibuat sebelumnya.
                  Sistem akan menolak jika tagihan untuk periode tersebut sudah ada.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={generating}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={generating}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition shadow disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <i className="ph ph-spinner animate-spin"></i>
                Memproses...
              </>
            ) : (
              <>
                <i className="ph ph-paper-plane-tilt"></i>
                Generate Tagihan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalGenerateTagihan;
