import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { confirmPaymentFromDuitku } from '../services/firestoreService';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Duitku biasanya kirim merchantOrderId di query string saat redirect
  const merchantOrderId =
    searchParams.get('merchantOrderId') || searchParams.get('orderId') || null;
  const resultCodeQuery = searchParams.get('resultCode');
  const reference = searchParams.get('reference');

  // status: checking | success | pending | failed | error
  const [status, setStatus] = useState('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(null);
  const pollingRef = useRef(null);

  // Polling logic: ping backend sampai status = paid atau attempt max
  useEffect(() => {
    if (!merchantOrderId) {
      setStatus('error');
      setErrorMsg('Order ID tidak ditemukan di URL');
      return;
    }

    // Jika resultCode dari Duitku sudah jelas failed
    if (resultCodeQuery === '02') {
      setStatus('failed');
      return;
    }

    let cancelled = false;
    const MAX_ATTEMPTS = 12;     // ~1 menit (5s × 12)
    const INTERVAL_MS = 5000;

    const tick = async () => {
      if (cancelled) return;
      const result = await confirmPaymentFromDuitku(merchantOrderId);

      if (cancelled) return;
      setAttempt((a) => a + 1);

      if (result.success) {
        setStatus('success');
        return;
      }

      if (result.pending) {
        setStatus('pending');
      } else if (result.error) {
        setErrorMsg(result.error);
      }

      // Schedule next tick kalau belum sukses & belum max
      setAttempt((current) => {
        if (current + 1 >= MAX_ATTEMPTS) {
          if (status !== 'success') setStatus('pending');
          return current + 1;
        }
        pollingRef.current = setTimeout(tick, INTERVAL_MS);
        return current + 1;
      });
    };

    // Initial check immediately
    tick();

    return () => {
      cancelled = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantOrderId]);

  // Auto-redirect 5s setelah success
  useEffect(() => {
    if (status === 'success') {
      setAutoRedirectCountdown(5);
      const t = setInterval(() => {
        setAutoRedirectCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(t);
            navigate('/parent');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [status, navigate]);

  const ui = {
    checking: {
      bg: 'bg-emerald-100',
      icon: 'ph-spinner animate-spin text-emerald-600',
      title: 'Mengecek Status Pembayaran...',
      desc: `Mengkonfirmasi pembayaran Anda ke Duitku${attempt > 0 ? ` (cek ke-${attempt})` : ''}.`,
      badge: { variant: 'secondary', text: 'Memproses' }
    },
    success: {
      bg: 'bg-green-100',
      icon: 'ph ph-check-circle text-green-600',
      title: 'Pembayaran Berhasil!',
      desc: 'Terima kasih atas pembayaran Anda. Tagihan telah berhasil dibayar.',
      badge: { variant: 'success', text: 'Lunas' }
    },
    pending: {
      bg: 'bg-yellow-100',
      icon: 'ph ph-clock text-yellow-600',
      title: 'Menunggu Konfirmasi',
      desc: 'Status pembayaran belum kami terima dari Duitku. Jika Anda sudah membayar, status akan otomatis terupdate dalam beberapa menit.',
      badge: { variant: 'warning', text: 'Pending' }
    },
    failed: {
      bg: 'bg-red-100',
      icon: 'ph ph-x-circle text-red-600',
      title: 'Pembayaran Gagal',
      desc: 'Pembayaran tidak dapat diproses. Silakan coba metode lain atau hubungi admin.',
      badge: { variant: 'destructive', text: 'Gagal' }
    },
    error: {
      bg: 'bg-red-100',
      icon: 'ph ph-warning-circle text-red-600',
      title: 'Terjadi Kesalahan',
      desc: errorMsg || 'Tidak dapat memuat halaman ini.',
      badge: { variant: 'destructive', text: 'Error' }
    }
  };

  const v = ui[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${v.bg}`}>
            <i className={`text-5xl ${v.icon}`}></i>
          </div>
          <CardTitle className="text-2xl">{v.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-center text-gray-600 text-sm">{v.desc}</p>

          <div className="flex justify-center">
            <Badge variant={v.badge.variant}>{v.badge.text}</Badge>
          </div>

          {merchantOrderId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Order ID</p>
              <p className="font-mono text-sm font-bold text-gray-900 break-all">{merchantOrderId}</p>
            </div>
          )}

          {reference && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Reference Number</p>
              <p className="font-mono text-sm font-bold text-gray-900 break-all">{reference}</p>
            </div>
          )}

          {status === 'success' && autoRedirectCountdown !== null && (
            <p className="text-center text-sm text-gray-500">
              Redirect ke dashboard dalam{' '}
              <span className="font-bold text-emerald-600">{autoRedirectCountdown}</span> detik...
            </p>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => navigate('/parent')}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white"
            >
              <i className="ph ph-house mr-2"></i>
              Kembali ke Dashboard
            </Button>

            {(status === 'pending' || status === 'checking') && (
              <Button
                onClick={() => {
                  setStatus('checking');
                  setAttempt(0);
                  if (pollingRef.current) clearTimeout(pollingRef.current);
                  confirmPaymentFromDuitku(merchantOrderId).then((res) => {
                    if (res.success) setStatus('success');
                  });
                }}
                variant="outline"
                className="w-full"
              >
                <i className="ph ph-arrow-clockwise mr-2"></i>
                Cek Status Sekarang
              </Button>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex gap-2">
              <i className="ph ph-info text-emerald-600 text-lg flex-shrink-0"></i>
              <div className="text-xs text-emerald-800">
                {status === 'success' && (
                  <p>Status sudah ter-update. Kuitansi dapat diunduh di halaman Riwayat.</p>
                )}
                {status === 'pending' && (
                  <p>Beberapa bank butuh waktu 5-15 menit untuk konfirmasi. Refresh halaman ini atau cek dashboard Anda lagi nanti.</p>
                )}
                {status === 'failed' && (
                  <p>Jika sudah terlanjur transfer, hubungi admin sekolah dengan menyertakan Order ID di atas.</p>
                )}
                {status === 'checking' && (
                  <p>Sistem akan mengecek status secara otomatis setiap 5 detik selama ~1 menit.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccess;
